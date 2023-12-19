import WebSR from  '@websr/websr';
import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import weights from './cnn-2x-s.json'
import Alpine from 'alpinejs'
import ImageCompare from './lib/image-compare-viewer.min';
import { MP4Demuxer } from "./demuxer_mp4";

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import "./lib/image-compare-viewer.min.css"



let upscaled_canvas;
let original_canvas;
let video;
let ctx;


let download_name;
let data;
let gpu;
let websr;

Alpine.store('state', 'init');

Alpine.start();


document.addEventListener("DOMContentLoaded", index);


//===================  Initial Load ===========================

async function index() {

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
        video.requestVideoFrameCallback(showPreview);
    }


    async function showPreview(){

        const fullScreenButton = document.getElementById('full-screen');

        websr = new WebSR({
            source: video,
            network_name: "anime4k/cnn-2x-s",
            weights:weights,
            gpu: gpu,
            canvas: upscaled_canvas
        });

        const bitmap = await createImageBitmap(video);



        await websr.render(bitmap);
        window.initRecording = initRecording;
        window.fullScreenPreview = fullScreenPreview;

        ctx.transferFromImageBitmap(await createImageBitmap(video));


        video.style.height = '100%';


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
        const max_duration = 3500/(bitrate/(8*1024*1024));

        if(video.duration > max_duration){
            Alpine.store('target', 'writer');
        } else {
            Alpine.store('target', 'blob');
        }


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


    }

}


//===================  Process ===========================

async function initRecording(){

    Alpine.store('state', 'loading');

    let bitrate = getBitrate();

    const max_duration = 3500/(bitrate/(8*1024*1024));

    let writer;

    if(video.duration > max_duration){
        writer = await showFilePicker();
    }


    Alpine.store('progress', 0);


    let { config, encoded_chunks } = await getMP4Data(data, 'video');


    let finished = false;

    Alpine.store('state', 'processing');
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
        fastStart: 'in-memory'
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
            console.log(e);
        }
    });


    const encode_callbacks = [];

    const encoder = new VideoEncoder({
        output: (chunk, meta) => {
            const callback = encode_callbacks.shift();
            callback({chunk, meta});
        },
        error: (e) => {
            console.log(e);
        }
    });


    encoder.configure(videoEncoderConfig);

    decoder.configure(config);


    const decode_promises = [];

    for (let chunk of encoded_chunks){
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

        if(performance.now() - last_decode > 1000) decoder.flush()

    }, 100);

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
            const callback = function (result){ resolve(result);}
            encode_callbacks.push(callback);
        }));


        encoder.encode(new_frame, {keyFrame: source_chunk.type === 'key'});

        frame.close();
        new_frame.close();

        bitmap1.close();
        bitmap2.close();
        bitmap.close();

    }

    clearInterval(flush_check);

    let last_encode = performance.now();

    flush_check = setInterval(function () {

        if(performance.now() - last_encode > 1000) encoder.flush()

    }, 100);


    for (let i =0; i < encode_promises.length; i++){

        const encode_promise = encode_promises[i];

        const {chunk, meta} = await encode_promise;

        muxer.addVideoChunk(chunk, meta);

        last_encode = performance.now();

    }

    clearInterval(flush_check);

    const audioData  = await getMP4Data(data, 'audio');

    const source_audio_chunks = audioData.encoded_chunks;


    for (let audio_chunk of source_audio_chunks){
        muxer.addAudioChunk(audio_chunk);
    }



    Alpine.store('progress', 100);

    finished = true;

    muxer.finalize();


    if(writer){
        await writer.close();
    } else{
        const blob = new Blob([muxer.target.buffer], {type: "video/mp4"});
        Alpine.store('download_url', window.URL.createObjectURL(blob));
    }

    Alpine.store('state', 'complete');




}

function getBitrate() {

    return 1e7 * (video.videoWidth*video.videoHeight*4)/(1280*720);
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










