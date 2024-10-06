
import {MP4Demuxer} from "./demuxer_mp4";
import {ArrayBufferTarget, FileSystemWritableFileStreamTarget, Muxer} from "mp4-muxer";
import WebSR from "../../websr/";
console.log("Worker")









function getMP4Data(data, type) {

    return new Promise(function (resolve, reject) {

        let configToReturn;
        let dataToReturn =[];
        let lastChunk = false;

        const demuxer = new MP4Demuxer(data, type, {
            onConfig(config) {
                configToReturn = config;
                if(configToReturn && lastChunk) return resolve({config: configToReturn, encoded_chunks: dataToReturn});
            },
            onData(chunks) {

                for(let chunk of chunks){
                    dataToReturn.push(chunk);
                }

                let last_time = chunks[chunks.length-1].timestamp/(1000*1000);

                if(Math.abs(20 - last_time) < 1) lastChunk = true;

                if(configToReturn && lastChunk) return resolve({config: configToReturn, encoded_chunks: dataToReturn});
            },
            setStatus: function (){}
        });
    });


}


const weights =  require('./weights/cnn-2x-m-rl.json');


self.onmessage = async function (event){
    console.log("Got message");

    console.log("Data", event.data);

    if(!event.data.data) return;




    await initRecording(event.data.data)


}


async function initRecording( data){


    console.log("Starting");
    const gpu = await WebSR.initWebGPU();

    const upscaled_canvas = new OffscreenCanvas(400, 400);



    const websr = new WebSR({
        network_name: "anime4k/cnn-2x-m",
        weights,
        resolution: {
            width: 200,
            height: 200,
        },
        gpu: gpu,
        canvas: upscaled_canvas
    });




    let bitrate = 1e7;

    let videoData;
    let audioData;


    try {
        audioData = await getMP4Data(data, 'audio');

    } catch (e) {
        console.log('No audio track found, skipping....');

    }


    console.log("Audio data", audioData);

    try{
        videoData = await getMP4Data(data, 'video');
    } catch (e) {
        console.warn('No video data found');

    }
    const config = videoData.config;
    const encoded_chunks = videoData.encoded_chunks;


    const target = new ArrayBufferTarget();


    const muxerOptions =
        {
            target: target,
            video: {
                codec: 'avc',
                width: 400,
                height: 400
            },
            firstTimestampBehavior: 'offset',
            fastStart: 'in-memory'
        };

    if(audioData){
        muxerOptions.audio = {

            codec:  'aac',
            numberOfChannels: audioData.config.numberOfChannels,
            sampleRate: audioData.config.sampleRate

        }
    }


    const muxer = new Muxer(muxerOptions);


    let codec_string = 'avc1.42001f';

    //   let codec_string = config.codec;


    const videoEncoderConfig = {
        codec: 'avc1.42001f',
        width: 400,
        height: 400,
        bitrate: Math.round(bitrate),
        framerate: 30,
    };





    const decode_callbacks = [];

    // Set up a VideoDecoer.
    const decoder = new VideoDecoder({
        output(frame) {

            const callback = decode_callbacks.shift();
            callback(frame);
        },
        error(e) {
            console.log("Decoder error");
            console.log(e);

        }
    });


    const encode_callbacks = [];

    const encoder = new VideoEncoder({
        output: (chunk, meta) => {
            const callback = encode_callbacks.shift();

            try {
                //    muxer.addVideoChunk(chunk, meta);
            } catch (e) {


                console.log("Encoder error");
                console.log(e);

            }


            callback();
        },
        error: (e) => {

            console.log("Encoder error");
            console.log(e);

        }
    });


    encoder.configure(videoEncoderConfig);

    decoder.configure(config);


    const decode_promises = [];

    const decoder_buffer_length =1000;

    for (let i = 0; i < Math.min(encoded_chunks.length, decoder_buffer_length); i ++){

        let chunk = encoded_chunks[i];

        decode_promises.push(new Promise(function (resolve, reject) {
            const callback = function (frame){ resolve(frame);}
            decode_callbacks.push(callback);
        }));

        try{
            decoder.decode(chunk);
        } catch (e) {

            console.log("Error");
            console.log(e);
        }

    }

    const encode_promises = [];

    const start_time = performance.now();

    let last_decode = performance.now();

    let flush_check = setInterval(function () {

        if(performance.now() - last_decode > 1000 && (encoded_chunks.length - current_frame < 10)) decoder.flush()

    }, 100);

    let current_frame;

    for (let i =0; i < decode_promises.length; i++){

        const decode_promise = decode_promises[i];
        const source_chunk = encoded_chunks[i];

        const frame = await decode_promise;
        last_decode = performance.now();



        let render_promise = websr.render(frame);

        await websr.context.device.queue.onSubmittedWorkDone();


        current_frame = i;


        const new_frame = new VideoFrame(upscaled_canvas,{ timestamp: frame.timestamp, duration: frame.duration, alpha: "discard"});

        console.log(new_frame)



        let time_elapsed = performance.now() - start_time;






        encode_promises.push(new Promise(function (resolve, reject) {
            const callback = function (){ resolve();}
            encode_callbacks.push(callback);
        }));



        try{
            console.log("Encode");

            console.log(encoder)

            encoder.encode(new_frame, {keyFrame: i%60 === 0});

        } catch (e) {

            console.log("This");

            console.warn(e);

            return
        }


        frame.close();
        new_frame.close();


        if( i +decoder_buffer_length < encoded_chunks.length){

            let chunk = encoded_chunks[i+decoder_buffer_length];

            decode_promises.push(new Promise(function (resolve, reject) {
                const callback = function (frame){ resolve(frame);}
                decode_callbacks.push(callback);
            }));

            try{
                decoder.decode(chunk);
            } catch (e) {
            }


            last_decode = performance.now();
        }

    }

    clearInterval(flush_check);

    let last_encode = performance.now();

    flush_check = setInterval(function () {

        console.log("Flushing")
        if(performance.now() - last_encode > 1000) encoder.flush()

    }, 100);


    for (let i =0; i < encode_promises.length; i++){

        const encode_promise = encode_promises[i];
        await encode_promise;
        last_encode = performance.now();

    }

    clearInterval(flush_check);


    try{

        if(audioData) {

            const source_audio_chunks = audioData.encoded_chunks;

            for (let audio_chunk of source_audio_chunks){
                muxer.addAudioChunk(audio_chunk);
            }

        }


        muxer.finalize();

        console.log("Done")



    } catch (e) {


        console.log("Err finishing");
        console.log(e);

    }





}

