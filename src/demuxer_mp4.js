import MP4Box from 'mp4box'
import {DataStream} from 'mp4box'


// Demuxes the first video track of an MP4 file using MP4Box, calling
// `onConfig()` and `onChunk()` with appropriate WebCodecs objects.
class MP4Demuxer {
  onConfig = null;
  onData = null;
  setStatus = null;
  file = null;

  constructor(buffer, type, {onConfig, onData, setStatus}) {
    this.onConfig = onConfig;
    this.onData = onData;
    this.setStatus = setStatus;

    this.type = type;
    // Configure an MP4Box File for demuxing.
    this.file = MP4Box.createFile();
    this.file.onError = error => setStatus("demux", error);
    this.file.onReady = this.onReady.bind(this);
    this.file.onSamples = this.onSamples.bind(this);
    buffer.fileStart = 0;
    this.file.appendBuffer(buffer);
    this.file.flush();

  }

  // Get the appropriate `description` for a specific track. Assumes that the
  // track is H.264, H.265, VP8, VP9, or AV1.
  description(track) {
    const trak = this.file.getTrackById(track.id);
    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (box) {
        const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
        box.write(stream);
        return new Uint8Array(stream.buffer, 8);  // Remove the box header.
      }
    }
    throw new Error("avcC, hvcC, vpcC, or av1C box not found");
  }

  onReady(info) {
    this.setStatus("demux", "Ready");


    const track = this.type === 'video'? info.videoTracks[0] : info.audioTracks[0];
    let config ={};

    if(track.type === 'video'){
      config = {
        codec: track.codec,
        codedHeight: track.video.height,
        codedWidth: track.video.width,
        description: this.description(track),
      }
    } else {
      config = {
        codec: track.codec,
        sampleRate: track.audio.sample_rate,
        numberOfChannels: track.audio.channel_count
      }
    }

    this.onConfig(config);

    this.file.setExtractionOptions(track.id);
    this.file.start();
  }

  onSamples(track_id, ref, samples) {
    // Generate and emit an EncodedVideoChunk for each demuxed sample.

    const chunks = [];

    const Chunk = this.type === 'video'? EncodedVideoChunk : EncodedAudioChunk;

    for (const sample of samples) {

        chunks.push(new Chunk({
          type: sample.is_sync ? "key" : "delta",
          timestamp: 1e6 * sample.cts / sample.timescale,
          duration: 1e6 * sample.duration / sample.timescale,
          data: sample.data
        }));

    }

    this.onData(chunks);
  }

  flush(){
    
    this.file.flush();
  }
}

export {
  MP4Demuxer
}