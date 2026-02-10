import WebSR from '@websr/websr';

import type {
  WorkerRequestMessage,
  WorkerResponseMessage,
  InitData,
  NetworkData,
  Resolution
} from './types/worker-messages';

// Processors
import pipelineProcessor from './processors/pipeline-processor';
// import mediabunnyProcessor from './processors/mediabunny-processor'; // Fallback if needed

// Worker state
let gpu: any | false;
let websr: WebSR;
let upscaled_canvas: OffscreenCanvas;
let original_canvas: OffscreenCanvas;
let resolution: Resolution;
let ctx: ImageBitmapRenderingContext | null;

// Default weights
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






// Processing functions moved to processors/

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
      await pipelineProcessor({
        inputHandle: event.data.inputHandle,
        outputHandle: event.data.outputHandle,
        websr,
        upscaled_canvas,
        original_canvas,
        resolution
      });
      // To use MediaBunny instead, uncomment above import and use:
      // await mediabunnyProcessor({ inputHandle: event.data.inputHandle, outputHandle: event.data.outputHandle, websr, upscaled_canvas, original_canvas, resolution });
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
