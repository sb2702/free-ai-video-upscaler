import WebSR from  '@websr/websr';
import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import Alpine from 'alpinejs'
import ImageCompare from './lib/image-compare-viewer.min';
import { MP4Demuxer } from "./demuxer_mp4";



// Tensorflow dependencies are for the content detection model to determine if it's animation, real life or 3d. Upscaling networks are implemented directly in WebGPU via WebSR
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';
import * as tflite from '@tensorflow/tfjs-tflite';


import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import "./lib/image-compare-viewer.min.css"



let upscaled_canvas;
let original_canvas;
let video;
let ctx;

let size = 'medium';
let content = 'rl';


let tfliteModelP;
let tfliteModel;

let download_name;
let data;
let gpu;
let websr;

const weights = {
    'large':
        {
            'rl': require('./weights/cnn-2x-l-rl.json'),
            'an': require('./weights/cnn-2x-l-an.json'),
            '3d': require('./weights/cnn-2x-l-3d.json'),
        },
    'medium':
        {
            'rl': require('./weights/cnn-2x-m-rl.json'),
            'an': require('./weights/cnn-2x-m-an.json'),
            '3d': require('./weights/cnn-2x-m-3d.json'),
        },
    'small':
        {
            'rl': require('./weights/cnn-2x-s-rl.json'),
            'an': require('./weights/cnn-2x-s-an.json'),
            '3d': require('./weights/cnn-2x-s-3d.json'),
        }
}


const networks = {
    'small': {
        name: "anime4k/cnn-2x-s",
    },
    'medium': {
        name: "anime4k/cnn-2x-m",
    },
    'large': {
        name: "anime4k/cnn-2x-l",
    }
}



document.addEventListener("DOMContentLoaded", index);




//===================  Initial Load ===========================

async function index() {

    Alpine.store('state', 'init');

    Alpine.start();
    document.body.style.display = "block";

    tfliteModelP =  tflite.loadTFLiteModel('./content_detection_mobilenet_v3.tflite',  {numThreads: 1} );

    upscaled_canvas = document.getElementById("upscaled");
    original_canvas = document.getElementById('original');
    ctx = original_canvas.getContext('bitmaprenderer');

    if(!"VideoEncoder" in window) return showUnsupported("WebCodecs");
    gpu = await WebSR.initWebGPU();
    if(!gpu) return showUnsupported("WebGPU");
    window.chooseFile =  chooseFile;

}

function showUnsupported(text) {
    Alpine.store('component', text);
    Alpine.store('state', 'unsupported');
}

function chooseFile(e) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = loadVideo;
    input.accept = "video/mp4";
    input.click();
}

//===================  Preview ===========================


function loadVideo(input){

    const file = input.target.files[0];

    const reader = new FileReader();

    Alpine.store('state', 'loading');

    reader.onload = function (e) {
        data = reader.result;

        setupPreview(data);
    }

    reader.readAsArrayBuffer(file);

    download_name = file.name.split(".")[0] + "-upscaled.mp4";
    Alpine.store('download_name',  download_name);
    Alpine.store('filename',  file.name);


    gtag('event', 'load_video', {});
}

async function updateNetwork(){

    console.log("Updating network with size", size, "Style", content);

    websr.switchNetwork(networks[size].name, weights[size][content]);

    const bitmap = await createImageBitmap(video);
    await websr.render(bitmap);

}

async function setupPreview(data) {


    video = document.createElement('video');


    const fileBlob = new Blob([data], {type: "video/mp4"});

    video.src = URL.createObjectURL(fileBlob);



    const imageCompare = document.getElementById('image-compare');



    video.onloadeddata = async function (){



        Alpine.store('width', video.videoWidth);
        Alpine.store('height', video.videoHeight);
        upscaled_canvas.width = video.videoWidth*2;
        upscaled_canvas.height = video.videoHeight*2;
        original_canvas.width = video.videoWidth;
        original_canvas.height = video.videoHeight;
        new ImageCompare(imageCompare).mount();
        video.currentTime = video.duration * 0.2;
        if(video.requestVideoFrameCallback)  video.requestVideoFrameCallback(showPreview);
        else requestAnimationFrame(showPreview);

    }




    async function showPreview(){

        gtag('event', 'preview', {});

        const fullScreenButton = document.getElementById('full-screen');

        websr = new WebSR({
            source: video,
            network_name: "anime4k/cnn-2x-m",
            weights:weights[size][content],
            gpu: gpu,
            canvas: upscaled_canvas
        });

        const bitmap = await createImageBitmap(video);




        await websr.render(bitmap);
        window.initRecording = initRecording;
        window.fullScreenPreview = fullScreenPreview;

        ctx.transferFromImageBitmap(await createImageBitmap(video));


        video.style.height = '100%';

        const contentDetectionCanvas = document.createElement('canvas');
        contentDetectionCanvas.width = 224;
        contentDetectionCanvas.height = 224;
        const contentDetectionCtx = contentDetectionCanvas.getContext('2d');

        tfliteModel = await tfliteModelP;




        async function detectContentType(){

            const preds = {
                'animation': [],
                'rl': []
            }

            for (let i=0; i < 5; i++){

                video.currentTime = (i/10 + 0.1)*video.duration;

                if(video.requestVideoFrameCallback) await new Promise((resolve => video.requestVideoFrameCallback(resolve)));
                else await new Promise((resolve => requestAnimationFrame(resolve)));


                contentDetectionCtx.drawImage(video, video.videoWidth/2-112, video.videoHeight/2-112, 224, 224, 0, 0, 224, 224 );

                const img = tf.browser.fromPixels(contentDetectionCanvas);


                const input = tf.div(tf.expandDims(img), 255);

                let outputTensor = tfliteModel.predict(input);

                const values = outputTensor.dataSync();

                preds['animation'].push(values[0]);
                preds['rl'].push(values[1]);


            }
            video.currentTime =video.duration*0.2;

            if(video.requestVideoFrameCallback) await new Promise((resolve => video.requestVideoFrameCallback(resolve)));
            else await new Promise((resolve => requestAnimationFrame(resolve)));


            const animation_score = preds['animation'].reduce((partialSum, a)=> partialSum +a, 0);
            const rl_score = preds['rl'].reduce((partialSum, a)=> partialSum +a, 0);

            const unk_thresh = 2;

            if(animation_score - rl_score > unk_thresh) return 'an'
            else if (rl_score  - animation_score > unk_thresh) return 'rl';
            else return  null;



        }

        
        let detected = await detectContentType();

        if(detected){
            content = detected;
            await updateNetwork();
            Alpine.store('style', content);
        } else {
            // Just a guess
            // I tried training a 3 class network, but it was producing really innacurate results compared to just real life vs 2d animation
            // Decided I'd rather do a good job on 2d animations and real life, and then show a menu if it's maybe something else or we don't know
            content = '3d';
            await updateNetwork();
            Alpine.store('style', 'unknown');
        }





        function setFullScreenLocation(){
            fullScreenButton.style.left = `${imageCompare.offsetLeft + 550}px`;
            fullScreenButton.style.top = `${imageCompare.offsetTop + 300}px`;
        }

        setTimeout(setFullScreenLocation, 20);
        setTimeout(setFullScreenLocation, 60);
        setTimeout(setFullScreenLocation, 200);





        imageCompare.addEventListener('fullscreenchange', function () {
            if(!document.fullscreenElement){
                upscaled_canvas.style.width = ``;
                upscaled_canvas.style.height = ``;
                original_canvas.style.width = ``;
                original_canvas.style.height = ``;
            }
        });

        let bitrate = getBitrate();

        const estimated_size = (bitrate/8)*video.duration + (128/8)*video.duration; // Assume 128 kbps audio

        if(estimated_size > 100*1024*1024){
            Alpine.store('target', 'writer');
        } else {
            Alpine.store('target', 'blob');
        }

        const quota = (await navigator.storage.estimate()).quota;

        if(estimated_size > quota){
            return showError(`The video is too big. It would output a file of ${humanFileSize(estimated_size)} but the browser can only write files up to ${humanFileSize(quota)}`);
        }


        Alpine.store('size', humanFileSize(estimated_size))


        function canvasFullScreen(){
            upscaled_canvas.style.width = `${window.innerWidth}px`;
            upscaled_canvas.style.height = `${window.innerHeight}px`;
            original_canvas.style.width = `${window.innerWidth}px`;
            original_canvas.style.height = `${window.innerHeight}px`;
        }

        async function fullScreenPreview(e) {
            imageCompare.requestFullscreen();
            setTimeout(canvasFullScreen, 20);
            setTimeout(canvasFullScreen, 60);
            setTimeout(canvasFullScreen, 200);

        }


        Alpine.store('state', 'preview');



        window.switchNetworkSize = async function(el){
            if(el.value !== size){
                size = el.value;

                await updateNetwork();
            }
        }

        window.switchNetworkStyle = async function(el){
            if(el.value !== content){
                content = el.value;

                await updateNetwork();

            }
        }



    }

}


//===================  Process ===========================

async function initRecording(){

    gtag('event', 'start', {});

    Alpine.store('state', 'loading');

    let bitrate = getBitrate();
    const estimated_size = (bitrate/8)*video.duration + (128/8)*video.duration; // Assume 128 kbps audio

    let writer;

    // Max Blob size - 100 MB
    if(estimated_size > 100*1024*1024){
        writer = await showFilePicker();
    }


    Alpine.store('progress', 0);
    Alpine.store('state', 'processing');

    let videoData;

    try{
        videoData = await getMP4Data(data, 'video');
    } catch (e) {
        console.warn('No video data found');

    }

    if(!videoData) return showError(`There was an error loading the video track. Is there something wrong with the video file?`);

    const config = videoData.config;
    const encoded_chunks = videoData.encoded_chunks;


    const target = writer ? new FileSystemWritableFileStreamTarget(writer) : new ArrayBufferTarget();

    const muxer = new Muxer({
        target: target,
        video: {
            codec: 'avc',
            width: video.videoWidth*2,
            height: video.videoHeight*2
        },
        audio: {
            codec:  'aac',
            numberOfChannels: 2,
            sampleRate: 48000
        },
        firstTimestampBehavior: 'offset',
        fastStart: writer ? false: 'in-memory'
    });


   let codec_string = video.videoWidth*video.videoHeight *4 > 1920*1080  ? 'avc1.42003e': 'avc1.42001f';

    const videoEncoderConfig = {
        codec: codec_string,
        width: video.videoWidth*2,
        height: video.videoHeight*2,
        bitrate: bitrate,
        framerate: 30,
    };

    if(!(await VideoEncoder.isConfigSupported(videoEncoderConfig)).supported) return showUnsupported(`Video codec: ${codec_string}`);

    const decode_callbacks = [];

    // Set up a VideoDecoer.
    const decoder = new VideoDecoder({
        output(frame) {

            const callback = decode_callbacks.shift();
            callback(frame);
        },
        error(e) {
            showError(e.message);
            Sentry.captureException(e);
        }
    });


    const encode_callbacks = [];

    const encoder = new VideoEncoder({
        output: (chunk, meta) => {
            const callback = encode_callbacks.shift();

            try {
                muxer.addVideoChunk(chunk, meta);
            } catch (e) {
                showError(e.message);
                Sentry.captureException(e);
            }


            callback();
        },
        error: (e) => {
            showError(e.message);
            Sentry.captureException(e);
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
        decoder.decode(chunk);
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


        const bitmap1 = await createImageBitmap(frame);
        const bitmap2 = await createImageBitmap(frame);


        let render_promise = websr.render(bitmap1);
        ctx.transferFromImageBitmap(bitmap2);
        await render_promise;

        current_frame = i;

        const bitmap = await createImageBitmap(upscaled_canvas);

        const new_frame = new VideoFrame(bitmap,{ timestamp: frame.timestamp});

        let progress  = Math.floor((frame.timestamp/(1000*1000))/video.duration*100);


        let time_elapsed = performance.now() - start_time;

        if(time_elapsed > 1000){
            const processing_rate = ((frame.timestamp/(1000*1000))/video.duration*100)/time_elapsed;
            let eta = Math.round(((100-progress)/processing_rate)/1000);
            Alpine.store('eta', prettyTime(eta))
        } else {
            Alpine.store('eta', 'calculating...')
        }



        Alpine.store('progress', progress);


        encode_promises.push(new Promise(function (resolve, reject) {
            const callback = function (){ resolve();}
            encode_callbacks.push(callback);
        }));


        encoder.encode(new_frame, {keyFrame: source_chunk.type === 'key'});

        frame.close();
        new_frame.close();

        bitmap1.close();
        bitmap2.close();
        bitmap.close();


        if( i +decoder_buffer_length < encoded_chunks.length){

            let chunk = encoded_chunks[i+decoder_buffer_length];

            decode_promises.push(new Promise(function (resolve, reject) {
                const callback = function (frame){ resolve(frame);}
                decode_callbacks.push(callback);
            }));
            decoder.decode(chunk);

            last_decode = performance.now();
        }

    }

    clearInterval(flush_check);

    let last_encode = performance.now();

    flush_check = setInterval(function () {

        if(performance.now() - last_encode > 1000) encoder.flush()

    }, 100);


    for (let i =0; i < encode_promises.length; i++){

        const encode_promise = encode_promises[i];
        await encode_promise;
        last_encode = performance.now();

    }

    clearInterval(flush_check);

    let audioData;


    try {
        audioData = await getMP4Data(data, 'audio');

    } catch (e) {
        console.log('No audio track found, skipping....');

    }

    try{

        if(audioData) {

            const source_audio_chunks = audioData.encoded_chunks;

            for (let audio_chunk of source_audio_chunks){
                muxer.addAudioChunk(audio_chunk);
            }

        }

        Alpine.store('progress', 100);

        muxer.finalize();

        if(writer){
            await writer.close();
        } else{
            const blob = new Blob([muxer.target.buffer], {type: "video/mp4"});
            Alpine.store('download_url', window.URL.createObjectURL(blob));
        }

        Alpine.store('state', 'complete');

        gtag('event', 'finish', {});

    } catch (e) {

        showError(e.message);
        Sentry.captureException(e);

    }





}

function showError(message){
    Alpine.store('state', 'error');
    Alpine.store('error', message);

}


function getBitrate() {

    return 1e7 * (video.videoWidth*video.videoHeight*4)/(1280*720);
}

function humanFileSize(bytes, si=false, dp=1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}



function prettyTime(secs){
    var sec_num = parseInt(secs, 10)
    var hours   = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}

async function showFilePicker(){
    const handle = await window.showSaveFilePicker({
        startIn: 'videos',
        suggestedName: download_name,
        types: [{
            description: 'Video File',
            accept: {'video/mp4' :['.mp4']}
        }],
    });


    return  await handle.createWritable();
}


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

                if(Math.abs(video.duration - last_time) < 1) lastChunk = true;

                if(configToReturn && lastChunk) return resolve({config: configToReturn, encoded_chunks: dataToReturn});
            },
            setStatus: function (){}
        });
    });


}










