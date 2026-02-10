import {
  BlobSource,
  BufferTarget,
  CanvasSource,
  Input,
  MP4,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  EncodedAudioPacketSource,
  StreamTarget,
  VideoSample,
  VideoSampleSink,
  EncodedPacketSink,
} from 'mediabunny';

import WebSR from '@websr/websr';

interface ProcessorArgs {
  inputHandle: FileSystemFileHandle;
  outputHandle?: FileSystemFileHandle;
  websr: WebSR;
  upscaled_canvas: OffscreenCanvas;
  original_canvas: OffscreenCanvas;
  resolution: { width: number; height: number };
}

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
 * Video processing using MediaBunny
 */
export default async function mediabunnyProcessor(args: ProcessorArgs): Promise<void> {
  const { inputHandle, outputHandle, websr, upscaled_canvas, original_canvas, resolution } = args;

  // Get the file from the handle
  const file = await inputHandle.getFile();

  // MediaBunny handles streaming from the blob for large files
  const source = new BlobSource(file);

  const input = new Input({
    formats: [MP4],
    source
  });

  let target: BufferTarget | StreamTarget;
  let writer: WritableStream | undefined;

  if (outputHandle) {
    writer = await outputHandle.createWritable();
    target = new StreamTarget(writer);
  } else {
    target = new BufferTarget();
  }

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: target,
  });

  const videoSource = new CanvasSource(upscaled_canvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH,
    keyFrameInterval: 60,
  });

  output.addVideoTrack(videoSource, { frameRate: 30 });

  const videoTrack = await input.getPrimaryVideoTrack();
  const audioTrack = await input.getPrimaryAudioTrack();

  let audioSource;
  let audioSink;

  if (audioTrack) {
    audioSource = new EncodedAudioPacketSource(audioTrack.codec);
    output.addAudioTrack(audioSource);
    audioSink = new EncodedPacketSink(audioTrack);
  }

  await output.start();

  if (!videoTrack) {
    return postMessage({ cmd: 'error', data: 'The video does not have a video track' })
  }

  const decodable = await videoTrack.canDecode();
  if (!decodable) {
    return postMessage({ cmd: 'error', data: 'The video could not be processed, is it a valid video file?' })
  }

  const sink = new VideoSampleSink(videoTrack);
  const duration = await input.computeDuration();
  const start_time = performance.now();

  const ctx = original_canvas.getContext('bitmaprenderer');

  function reportProgress(sample: VideoSample) {
    const time_elapsed = performance.now() - start_time;
    const progress = Math.floor((sample.timestamp) / duration * 100);

    postMessage({ cmd: 'progress', data: progress })

    if (time_elapsed > 1000) {
      const processing_rate = ((sample.timestamp) / duration * 100) / time_elapsed;
      const eta = Math.round(((100 - progress) / processing_rate) / 1000);
      postMessage({ cmd: 'eta', data: prettyTime(eta) })
    } else {
      postMessage({ cmd: 'eta', data: 'calculating...' })
    }
  }

  // Loop over all frames
  for await (const sample of sink.samples()) {
    const videoFrame = sample.toVideoFrame();

    // This is for the 'before' preview
    const bitmap = await createImageBitmap(videoFrame, {
      resizeHeight: videoFrame.codedHeight * 2,
      resizeWidth: videoFrame.codedWidth * 2
    });

    //@ts-expect-error
    websr.render(videoFrame); // Render the upscaled frame

    // Render the "Before"
    if (ctx) {
      ctx.transferFromImageBitmap(bitmap)
    }

    videoSource.add(sample.timestamp, sample.duration);

    reportProgress(sample)

    videoFrame.close();
    sample.close();
  }

  // Pass audio without re-encoding
  if (audioSink) {
    const config = await audioTrack.getDecoderConfig()
    for await (const packet of audioSink.packets()) {
      if (packet.timestamp > 0) {
        audioSource.add(packet, { decoderConfig: config });
      }
    }
  }

  await output.finalize();

  if (writer) {
    postMessage({ cmd: 'finished', data: null }, []);
  } else {
    const buffer = (output.target as BufferTarget).buffer;
    postMessage({ cmd: 'finished', data: buffer }, [buffer]);
  }
}
