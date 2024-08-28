



self.onmessage = ({data}) => {

    if(data.cmd === 'init'){

        self.videoEncoder = new VideoEncoder({
            output: (chunk, meta) => {

                const buffer = new ArrayBuffer(chunk.byteLength);

                chunk.copyTo(buffer);

                postMessage({
                    cmd: 'encoded',
                    buffer: buffer,
                    type: chunk.type,
                    timestamp: chunk.timestamp,
                    duration: chunk.duration,
                    meta: meta
                }, [buffer])


            },
            error: (e) => {
                postMessage({
                    cmd: 'error',
                    msg: e.message
                })
            }
        });


        self.videoEncoder.configure(data.config);


    } else if(data.cmd === 'encode'){

        const upscaled_frame = new VideoFrame(data.bitmap,{ timestamp: data.timestamp});

        self.videoEncoder.encode(upscaled_frame, { keyFrame: data.isKeyFrame});

        upscaled_frame.close();


    } else if (data.cmd === 'flush'){

        self.videoEncoder.flush();
    }


}
