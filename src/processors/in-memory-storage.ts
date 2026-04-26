class InMemoryStorage {
  private _chunkSize: number;
  private chunks: Map<number, Uint8Array>;
  private _size: number;

  constructor(chunkSize = 10 * 1024 * 1024) {
    this._chunkSize = chunkSize;
    this.chunks = new Map();
    this._size = 0;
  }

  write(data: Uint8Array, position: number): void {
    this._size = Math.max(this._size, position + data.byteLength);

    const startChunkIndex = Math.floor(position / this._chunkSize);
    const endChunkIndex = Math.floor((position + data.byteLength - 1) / this._chunkSize);

    for (let chunkIndex = startChunkIndex; chunkIndex <= endChunkIndex; chunkIndex++) {
      const chunkStart = chunkIndex * this._chunkSize;
      const chunkEnd = chunkStart + this._chunkSize;

      const overlapStart = Math.max(position, chunkStart);
      const overlapEnd = Math.min(position + data.byteLength, chunkEnd);
      const overlapSize = overlapEnd - overlapStart;

      if (overlapSize <= 0) continue;

      let chunk: Uint8Array;
      if (!this.chunks.has(chunkIndex)) {
        chunk = new Uint8Array(this._chunkSize);
        this.chunks.set(chunkIndex, chunk);
      } else {
        chunk = this.chunks.get(chunkIndex)!;
      }

      const targetOffset = overlapStart - chunkStart;
      const sourceOffset = overlapStart - position;

      chunk.set(data.subarray(sourceOffset, sourceOffset + overlapSize), targetOffset);
    }
  }

  get size(): number {
    return this._size;
  }

  toBlob(type = 'application/octet-stream'): Blob {
    if (this.chunks.size === 0) {
      return new Blob([], { type });
    }

    const chunkIndices = Array.from(this.chunks.keys()).sort((a, b) => a - b);
    const blobParts: BlobPart[] = [];

    for (let i = 0; i < chunkIndices.length; i++) {
      const chunkIndex = chunkIndices[i];
      const chunk = this.chunks.get(chunkIndex)!;

      if (i === chunkIndices.length - 1) {
        const remainingBytes = this._size - (chunkIndex * this._chunkSize);
        if (remainingBytes < this._chunkSize) {
          blobParts.push(chunk.slice(0, remainingBytes));
        } else {
          //@ts-expect-error whatever
          blobParts.push(chunk);
        }
      } else {
        //@ts-expect-error whatever
        blobParts.push(chunk);
      }
    }

    return new Blob(blobParts, { type });
  }
}

export default InMemoryStorage;
