/**
 * Type-safe worker message definitions for communication between
 * the main thread and the video processing worker.
 */

export interface Resolution {
  width: number;
  height: number;
}

// Messages sent FROM main thread TO worker
export type WorkerRequestMessage =
  | { cmd: 'isSupported' }
  | { cmd: 'init'; data: InitData }
  | { cmd: 'network'; data: NetworkData }
  | { cmd: 'process'; data: ArrayBuffer; duration: number; handle?: FileSystemWritableFileStream };

export interface InitData {
  bitmap: ImageBitmap;
  upscaled: OffscreenCanvas;
  original: OffscreenCanvas;
  resolution: Resolution;
}

export interface NetworkData {
  name: string;
  bitmap: ImageBitmap;
  weights: any; // TODO: Type this based on WebSR weight structure
}

// Messages sent FROM worker TO main thread
export type WorkerResponseMessage =
  | { cmd: 'isSupported'; data: boolean }
  | { cmd: 'progress'; data: number }
  | { cmd: 'eta'; data: string }
  | { cmd: 'process' }
  | { cmd: 'error'; data: string }
  | { cmd: 'finished'; data: ArrayBuffer | null };

// Type guard helpers
export function isWorkerRequestMessage(msg: any): msg is WorkerRequestMessage {
  return msg && typeof msg.cmd === 'string';
}

export function isWorkerResponseMessage(msg: any): msg is WorkerResponseMessage {
  return msg && typeof msg.cmd === 'string';
}
