import WebSR from  '@websr/websr';
import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import weights from './cnn-2x-s.json'
import Alpine from 'alpinejs'
import ImageCompare from './lib/image-compare-viewer.min';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import "./lib/image-compare-viewer.min.css"
import isArray from "alpinejs";


let video;
let canvas;



let download_name;

let gpu;
let websr;

Alpine.store('state', 'init');

Alpine.start();


document.addEventListener("DOMContentLoaded", index);


//===================  Initial Load ===========================

async function index() {

    video  =  document.getElementById("video");
    canvas = document.getElementById("upscaled");

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
    input.click();
}

//===================  Preview ===========================


function loadVideo(input){

    const file = input.target.files[0];
    const url = URL.createObjectURL(file);

    const reader = new FileReader();

    reader.onload = function (e) {
        setupPreview(url);
    }

    download_name = file.name.split(".")[0] + "-upscaled.mp4";
    Alpine.store('download_name',  download_name);
    reader.readAsDataURL(file);

}

async function setupPreview(url) {

    video.src = url;

    const imageCompare = document.getElementById('image-compare');

    Alpine.store('state', 'preview');

    video.onloadeddata = async function (){

        canvas.width = video.videoWidth*2;
        canvas.height = video.videoHeight*2;
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
            canvas: canvas
        });

        const bitmap = await createImageBitmap(video);
        await websr.render(bitmap);
        window.initRecording = initRecording;
        window.fullScreenPreview = fullScreenPreview;

        video.style.height = '100%';

        fullScreenButton.style.left = `${imageCompare.offsetLeft + 550}px`
        fullScreenButton.style.top = `${imageCompare.offsetTop + 300}px`

        imageCompare.addEventListener('fullscreenchange', function () {
            if(!document.fullscreenElement){
                canvas.style.width = ``;
                canvas.style.height = ``;
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
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
        }

        async function fullScreenPreview(e) {
            imageCompare.requestFullscreen();
            setTimeout(canvasFullScreen, 20);
            setTimeout(canvasFullScreen, 60);
            setTimeout(canvasFullScreen, 200);

        }

    }

}


//===================  Process ===========================

async function initRecording(){

    let bitrate = getBitrate();



    const max_duration = 3500/(bitrate/(8*1024*1024));

    let writer;

    if(video.duration > max_duration){
        writer = await showFilePicker();
    }

    Alpine.store('state', 'processing');

    let pending_outputs = 0;
    let frames_processed = 0;
    let finished = false;

    video.volume = 0.01;


    function processingError(text){
        finished = true;
        Alpine.store('state', 'error')
        Alpine.store('error', text);
    }




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
        fastStart: 'in-memory'
    });


    const audioEncoder = new AudioEncoder({
        output: function (encodedAudioChunk) {
            muxer.addAudioChunk(encodedAudioChunk);
        },
        error: (e)=> processingError(e.message)
    })



    const audioEncoderConfig = {
        codec: 'mp4a.40.2',
        sampleRate: 48000,
        numberOfChannels: 2
    }

    if(!(await AudioEncoder.isConfigSupported(audioEncoderConfig)).supported) return showUnsupported(`Audio codec: ${audioEncoderConfig.codec}`);

    audioEncoder.configure(audioEncoderConfig);


    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
            addVideoChunk(chunk, meta);
        },
        error: (e) => {
            processingError(e.message)
        }
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

    videoEncoder.configure(videoEncoderConfig);


    const frameStack = [];

    async function decodeLoop() {
        let bitmap = await createImageBitmap(video);
        frameStack.push({
            frame: bitmap,
            time: video.currentTime
        });
        pending_outputs +=1;
        if(frameStack.length > 40) video.pause();

        if(!finished) video.requestVideoFrameCallback(decodeLoop);

    }


    async function encodeLoop() {
        if(frameStack.length ===0 && !video.ended) return video.requestVideoFrameCallback(encodeLoop);
        const { frame, time } = frameStack.shift();

        await websr.render(frame);

        const upscaled_bitmap = await createImageBitmap(canvas);


        const upscaled_frame = new VideoFrame(upscaled_bitmap, { timestamp: time*1000*1000});

        const isKeyFrame = frames_processed %60 ===0;

        let progress  = Math.floor(time/video.duration*100);

        Alpine.store('progress', progress);

        frames_processed +=1;
        pending_outputs --;

        videoEncoder.encode(upscaled_frame, { keyFrame: isKeyFrame});

        upscaled_frame.close();



        if(!(video.ended && frameStack.length ===0) && !finished) await encodeLoop();
    }


    let initPlaybackTime = null;


    let bitmap = await createImageBitmap(video);
    frameStack.push({
        frame: bitmap,
        time: video.currentTime
    });

    pending_outputs +=1;


    function copyAudioData(inputBuffer) {
        // This function should copy data from inputBuffer into a new ArrayBuffer
        // The implementation depends on how you want to handle the audio data
        const numberOfChannels = inputBuffer.numberOfChannels;
        const numberOfFrames = inputBuffer.length;
        const outputArray = new Float32Array(numberOfChannels * numberOfFrames);

        for (let channel = 0; channel < numberOfChannels; channel++) {
            const inputData = inputBuffer.getChannelData(channel);
            for (let frame = 0; frame < numberOfFrames; frame++) {
                outputArray[frame * numberOfChannels + channel] = inputData[frame];
            }

        }

        return outputArray.buffer;
    }

    const audioStream = video.captureStream().getAudioTracks()[0];
    const audioContext = new AudioContext();
    const source  = audioContext.createMediaStreamSource(new MediaStream([audioStream]));
    const processor = audioContext.createScriptProcessor(4096, 2, 2);

    source.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = function (e) {

        if(finished) return;

        if(video.paused) return;

        const inputBuffer = e.inputBuffer;

        if(!initPlaybackTime) initPlaybackTime =video.currentTime;

        const numberOfChannels = inputBuffer.numberOfChannels;
        const numberOfFrames = inputBuffer.length;
        const sampleRate = inputBuffer.sampleRate;


        // Create an AudioData object
        let audioData = new AudioData({
            format: 'f32', // assuming the audio data is in 32-bit float format
            sampleRate: sampleRate,
            numberOfFrames: numberOfFrames,
            numberOfChannels: numberOfChannels,
            timestamp: (video.currentTime -initPlaybackTime)* sampleRate, // or other appropriate timestamp
            data: copyAudioData(inputBuffer) // You'll need to copy data from inputBuffer
        });

        audioEncoder.encode(audioData);
    }

    video.play();
    video.requestVideoFrameCallback(decodeLoop);
    video.requestVideoFrameCallback(encodeLoop);


    video.onended = async function () {
        if(video.ended && pending_outputs < 1 && !finished) return await onEnd();
    }

    async function onEnd() {

        Alpine.store('progress', 100);

        finished = true;
        await videoEncoder.flush()
        await audioEncoder.flush();
        muxer.finalize();


        if(writer){
            await writer.close();
        } else{
            const blob = new Blob([muxer.target.buffer], {type: "video/mp4"});
            Alpine.store('download_url', window.URL.createObjectURL(blob));
        }

        Alpine.store('state', 'complete');



    }

    async function addVideoChunk(chunk, meta){

        muxer.addVideoChunk(chunk, meta);

        if(video.ended && pending_outputs < 1 && !finished) return await onEnd();

    }


}

function getBitrate() {

    return 1e7 * (video.videoWidth*video.videoHeight*4)/(1280*720);
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










