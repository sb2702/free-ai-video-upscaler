import {
  BlobSource,
  BufferTarget,
  CanvasSource,
  Input,
  MP4,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  VideoSample,
  VideoSampleSink,
} from 'mediabunny';

import WebSR from '../../websr';
import type {
  WorkerRequestMessage,
  WorkerResponseMessage,
  InitData,
  NetworkData,
  Resolution
} from './types/worker-messages';

// Worker state
let gpu: any | false;
let websr: WebSR;
let upscaled_canvas: OffscreenCanvas;
let original_canvas: OffscreenCanvas;
let resolution: Resolution;
let ctx: ImageBitmapRenderingContext | null;

const weights = require('./weights/cnn-2x-m-rl.json');

/**
 * Check if WebGPU is supported in this environment
 */
async function isSupported(): Promise<void> {
  gpu = await WebSR.initWebGPU();

  postMessage({
    cmd: 'isSupported',
    data: gpu !== false
  } satisfies WorkerResponseMessage);
}

/**
 * Initialize the worker with canvases and create WebSR instance
 */
async function init(config: InitData): Promise<void> {
  if (!gpu) {
    gpu = await WebSR.initWebGPU();
  }

  websr = new WebSR({
    network_name: "anime4k/cnn-2x-m",
    weights,
    resolution: config.resolution,
    gpu: gpu,
    canvas: config.upscaled as any // OffscreenCanvas is valid but types may be strict
  });

  resolution = config.resolution;
  upscaled_canvas = config.upscaled;
  original_canvas = config.original;

  ctx = original_canvas.getContext('bitmaprenderer');

  const bitmap2 = await createImageBitmap(config.bitmap, {
    resizeHeight: config.resolution.height * 2,
    resizeWidth: config.resolution.width * 2,
  });

  await websr.render(config.bitmap as any);

  if (ctx) {
    ctx.transferFromImageBitmap(bitmap2);
  }
}

/**
 * Switch to a different AI upscaling network
 */
async function switchNetwork(name: string, weights: any, bitmap: ImageBitmap): Promise<void> {
  websr.switchNetwork(name as any, weights);

  await websr.render(bitmap as any);
}






/**
 * Main video processing function using MediaBunny
 * TODO: Implement full pipeline with MediaBunny
 */
async function initRecording(
  data: ArrayBuffer,

  handle?: FileSystemWritableFileStream
): Promise<void> {
  console.log("Data", data);

  // TODO: This is a placeholder - MediaBunny implementation in progress
  const blob = new Blob([data], { type: 'video/mp4' });

  const input = new Input({
    formats: [MP4],
    source: new BlobSource(blob),
  });


  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(upscaled_canvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH,
    keyFrameInterval: 60,
  });

  output.addVideoTrack(videoSource, { frameRate: 30 });
  await output.start();



  const videoTrack = await input.getPrimaryVideoTrack();

  if (!videoTrack) {
    //TODO: Handle
  }

  const decodable = await videoTrack.canDecode();
  if (!decodable) {
     // TODO: Handle
  }



  const sink = new VideoSampleSink(videoTrack);


  const duration = await input.computeDuration();


  const start_time = performance.now();


  function reportProgress(sample: VideoSample){


    let time_elapsed = performance.now() - start_time;



    let progress  = Math.floor((sample.timestamp)/duration*100);

     postMessage({cmd: 'progress', data: progress})



      if(time_elapsed > 1000){
        const processing_rate = ((sample.timestamp)/duration*100)/time_elapsed;
        let eta = Math.round(((100-progress)/processing_rate)/1000);

        postMessage({cmd: 'eta', data: prettyTime(eta)})


    } else {
        postMessage({cmd: 'eta', data: 'calculating...'})
    }

  

  }



  // Loop over all frames
  for await (const sample of sink.samples()) {
   

    const videoFrame = sample.toVideoFrame();


    //@ts-expect-error
    websr.render(videoFrame);


  
    videoSource.add(sample.timestamp, sample.duration);

    reportProgress(sample)


    videoFrame.close();
    sample.close();


  }



  await output.finalize();

  const buffer = (output.target as BufferTarget).buffer;


  postMessage({cmd: 'finished', data: buffer}, [buffer]);



  // Early return - implementation incomplete
  return;

  // Old implementation below - will be replaced with MediaBunny pipeline
  // This code is kept for reference during migration
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
function prettyTime(secs: number): string {
  const sec_num = parseInt(secs.toString(), 10);
  const hours = Math.floor(sec_num / 3600);
  const minutes = Math.floor(sec_num / 60) % 60;
  const seconds = sec_num % 60;

  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
}

/**
 * Worker message handler with type-safe message routing
 */
self.onmessage = async function (event: MessageEvent<WorkerRequestMessage>) {
  if (!event.data.cmd) return;

  switch (event.data.cmd) {
    case 'init':
      await init(event.data.data);
      break;

    case 'isSupported':
      await isSupported();
      break;

    case 'process':
      await initRecording(event.data.data,  event.data.handle);
      break;

    case 'network':
      await switchNetwork(
        event.data.data.name,
        event.data.data.weights,
        event.data.data.bitmap
      );
      break;
  }
};
