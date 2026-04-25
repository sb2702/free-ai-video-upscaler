import { WebDemuxer } from "web-demuxer";
import { Muxer, StreamTarget } from 'mp4-muxer';
import WebSR from '@websr/websr';
import InMemoryStorage from './in-memory-storage';

interface ProcessorArgs {
  inputHandle: FileSystemFileHandle;
  outputHandle?: FileSystemFileHandle;
  websr: WebSR;
  upscaled_canvas: OffscreenCanvas;
  original_canvas: OffscreenCanvas;
  resolution: { width: number; height: number };
  getPauseLock?: () => Promise<void> | null;
}


/**
 * Track demuxed chunks with indices for keyframe detection
 */
class DemuxerTrackingStream extends TransformStream<EncodedVideoChunk, { chunk: EncodedVideoChunk; index: number }> {
  constructor() {
    let chunkIndex = 0;
    super(
      {

        async transform(chunk, controller) {
          // Apply backpressure if downstream is full
          while (controller.desiredSize !== null && controller.desiredSize < 0) {
            await new Promise((r) => setTimeout(r, 10));
          }

          controller.enqueue({ chunk, index: chunkIndex++ });
        },
      },
      { highWaterMark: 20 } // Buffer up to 20 chunks
    );
  }
}

/**
 * Decode video chunks into frames with backpressure management
 */
class VideoDecoderStream extends TransformStream<
  { chunk: EncodedVideoChunk; index: number },
  { frame: VideoFrame; index: number }
> {
  constructor(config: VideoDecoderConfig, getPauseLock?: () => Promise<void> | null) {
    let pendingIndices: number[] = [];
    let decoder: VideoDecoder;


    super(
      {
        start(controller) {
          decoder = new VideoDecoder({
            output: (frame) => {
              const index = pendingIndices.shift()!;
              controller.enqueue({ frame, index });
            },
            error: (e) => {
              console.error('Decoder error:', e);
              controller.error(e);
            },
          });

          decoder.configure(config);
        },

        async transform(item, controller) {
          if (getPauseLock) {
            const lock = getPauseLock();
            if (lock) {
              await lock;
            }
          }
          // Check decoder queue backpressure
          while (decoder.decodeQueueSize >= 20) {
            await new Promise((r) => setTimeout(r, 10));
          }

          // Check downstream backpressure
          while (controller.desiredSize !== null && controller.desiredSize < 0) {
            await new Promise((r) => setTimeout(r, 10));
          }

          pendingIndices.push(item.index);
          decoder.decode(item.chunk);
        },

        async flush(controller) {
          await decoder.flush();
          try {
            decoder.close();
          } catch (e) {
            console.error('Error closing decoder:', e);
          }
        },
      },
      { highWaterMark: 10 }
    );
  }
}

/**
 * Upscale frames using WebSR and render "before" preview
 */
class VideoUpscaleStream extends TransformStream<
  { frame: VideoFrame; index: number },
  { frame: VideoFrame; index: number }
> {
  constructor(
    private websr: WebSR,
    private upscaled_canvas: OffscreenCanvas,
    private original_canvas: OffscreenCanvas,
    getPauseLock?: () => Promise<void> | null
  ) {
    super(
      {

        async transform(item, controller) {
          if (getPauseLock) {
            const lock = getPauseLock();
            if (lock) {
              await lock;
            }
          }
          const { frame, index } = item;

          // Create "before" preview (resized to 2x)
          const beforeBitmap = await createImageBitmap(frame, {
            resizeHeight: frame.codedHeight * 2,
            resizeWidth: frame.codedWidth * 2
          });

          // Render upscaled frame to canvas
          await websr.render(frame);

          // Update "before" preview canvas
          const ctx = original_canvas.getContext('bitmaprenderer');
          if (ctx) {
            ctx.transferFromImageBitmap(beforeBitmap);
          }

          // Create upscaled VideoFrame from canvas
          const upscaledFrame = new VideoFrame(upscaled_canvas, {
            timestamp: frame.timestamp,
            duration: frame.duration,
            alpha: "discard"
          });

          // Clean up original frame
          frame.close();

          controller.enqueue({ frame: upscaledFrame, index });
        },
      },
      { highWaterMark: 5 } // Keep small - frames are large
    );
  }
}

/**
 * Encode upscaled frames with backpressure management
 */
class VideoEncoderStream extends TransformStream<
  { frame: VideoFrame; index: number },
  { chunk: EncodedVideoChunk; meta: EncodedVideoChunkMetadata }
> {
  constructor(config: VideoEncoderConfig) {
    let encoder: VideoEncoder;
    super(
      {
        start(controller) {
          encoder = new VideoEncoder({
            output: (chunk, meta) => {
              controller.enqueue({ chunk, meta });
            },
            error: (e) => {
              console.error('Encoder error:', e);
              controller.error(e);
            },
          });

          encoder.configure(config);
        },

        async transform(item, controller) {
          // Check encoder queue backpressure
          while (encoder.encodeQueueSize >= 20) {
            await new Promise((r) => setTimeout(r, 10));
          }

          // Check downstream backpressure
          while (controller.desiredSize !== null && controller.desiredSize < 0) {
            await new Promise((r) => setTimeout(r, 10));
          }

          // Encode with keyframe every 60 frames
          encoder.encode(item.frame, { keyFrame: item.index % 60 === 0 });
          item.frame.close();
        },

        async flush(controller) {
          await encoder.flush();
          try {
            encoder.close();
          } catch (e) {
            console.error('Error closing encoder:', e);
          }
        },
      },
      { highWaterMark: 10 }
    );
  }
}

/**
 * Create WritableStream for video chunks with progress reporting
 */
function createVideoMuxerWriter(
  muxer: Muxer<StreamTarget>,
  duration: number
): WritableStream<{ chunk: EncodedVideoChunk; meta: EncodedVideoChunkMetadata }> {
  const startTime = performance.now();
  let frameCount = 0;

  return new WritableStream({
    async write(value) {
      muxer.addVideoChunk(value.chunk, value.meta);
      frameCount++;

      // Report progress every 30 frames
      if (frameCount % 30 === 0) {
        const elapsed = performance.now() - startTime;
        const progress = Math.floor((value.chunk.timestamp / 1000000) / duration * 100);

        postMessage({ cmd: 'progress', data: progress });

        if (elapsed > 1000) {
          const processingRate = progress / elapsed;
          const eta = Math.round(((100 - progress) / processingRate) / 1000);
          postMessage({ cmd: 'eta', data: prettyTime(eta) });
        } else {
          postMessage({ cmd: 'eta', data: 'calculating...' });
        }
      }
    },

    close() {
      console.log('All video frames written to muxer');
    },

    abort(reason) {
      console.error('Video muxer writer aborted:', reason);
    }
  });
}

/**
 * Create WritableStream for audio chunks (passthrough)
 */
function createAudioMuxerWriter(
  muxer: Muxer<StreamTarget>
): WritableStream<EncodedAudioChunk> {
  return new WritableStream({
    async write(chunk) {
      if (chunk.timestamp >= 0) {
        muxer.addAudioChunk(chunk);
      }
    },

    close() {
      console.log('All audio chunks written to muxer');
    },

    abort(reason) {
      console.error('Audio muxer writer aborted:', reason);
    }
  });
}

/**
 * Format seconds into HH:MM:SS
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
 * Main pipeline processor using Streams API
 */
export default async function pipelineProcessor(args: ProcessorArgs): Promise<void> {
  const { inputHandle, outputHandle, websr, upscaled_canvas, original_canvas, resolution, getPauseLock } = args;

  console.log('Starting pipeline processor with Streams API');

  // Get file from handle
  const file = await inputHandle.getFile();

  // Initialize demuxer
  const demuxer = new WebDemuxer({
    wasmFilePath: "https://cdn.jsdelivr.net/npm/web-demuxer@latest/dist/wasm-files/web-demuxer.wasm",
  });

  await demuxer.load(file);

  // Get media info
  const mediaInfo = await demuxer.getMediaInfo();
  const videoTrack = mediaInfo.streams.find((s: any) => s.codec_type_string === 'video');
  const audioTrack = mediaInfo.streams.find((s: any) => s.codec_type_string === 'audio');

  if (!videoTrack) {
    return postMessage({ cmd: 'error', data: 'No video track found' });
  }

  const videoDecoderConfig = await demuxer.getDecoderConfig('video');
  const audioConfig = audioTrack ? await demuxer.getDecoderConfig('audio') : null;

  const duration = videoTrack.duration;
  const width = resolution.width;
  const height = resolution.height;

  // Set up muxer target
  let target: StreamTarget;
  let writer: FileSystemWritableFileStream | undefined;
  let storage: InMemoryStorage | undefined;

  if (outputHandle) {
    writer = <FileSystemWritableFileStream >await outputHandle.createWritable();
    target = new StreamTarget({
      //@ts-expect-error - onData can be async for FileSystemWritableFileStream
      onData: async (data: ArrayBufferLike, position: number) => {
        //@ts-expect-error - onData can be async for FileSystemWritableFileStream
        await writer!.write({ type: 'write', position, data });
      },
      chunked: true,
      chunkSize: 1024 * 1024 * 10
    });
  } else {
    storage = new InMemoryStorage();
    target = new StreamTarget({

      onData: (data: Uint8Array, position: number) => {

        storage!.write(data, position);
      },
      chunked: true,
      chunkSize: 1024 * 1024 * 10
    });
  }

  // Configure muxer
  const muxerOptions: any = {
    target,
    video: {
      codec: 'avc',
      width: width * 2,
      height: height * 2,
    },
    firstTimestampBehavior: 'offset',
    fastStart: 'in-memory',
  };

  if (audioConfig) {
    muxerOptions.audio = {
      codec: 'aac',
      numberOfChannels: audioConfig.numberOfChannels,
      sampleRate: audioConfig.sampleRate,
    };
  }

  const muxer = new Muxer(muxerOptions);

  // Configure encoder
  const bitrate = 2.5e6 * (width * height * 4) / (1280 * 720);

  const videoEncoderConfig: VideoEncoderConfig = {
    codec: 'avc1.4d0034',
    width: width * 2,
    height: height * 2,
    bitrate: Math.round(bitrate),
    framerate: 30,
  };

  // Build the pipeline!
  const chunkStream = demuxer.read('video', 0) as ReadableStream<EncodedVideoChunk>;

  const videoWriter = createVideoMuxerWriter(muxer, duration);

  const pipeline = chunkStream
    .pipeThrough(new DemuxerTrackingStream())
    .pipeThrough(new VideoDecoderStream(videoDecoderConfig, getPauseLock))
    .pipeThrough(new VideoUpscaleStream(websr, upscaled_canvas, original_canvas, getPauseLock))
    .pipeThrough(new VideoEncoderStream(videoEncoderConfig))
    .pipeTo(videoWriter);

  // Process video
  await pipeline;

  // Process audio (passthrough)
  if (audioConfig) {
    console.log('Processing audio...');
    const audioStream = demuxer.read('audio', 0) as ReadableStream<EncodedAudioChunk>;
    const audioWriter = createAudioMuxerWriter(muxer);
    await audioStream.pipeTo(audioWriter);
  }

  // Finalize
  muxer.finalize();

  if (writer) {
    await writer.close();
    postMessage({ cmd: 'finished', data: null }, []);
  } else {
    const blob = storage!.toBlob('video/mp4');
    postMessage({ cmd: 'finished', data: blob });
  }

  console.log('Pipeline processing complete!');
}
