import WebSR from  '@websr/websr';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import weights from './cnn-2x-s.json'
import Alpine from 'alpinejs'
import ImageCompare from './lib/image-compare-viewer.min';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import "./lib/image-compare-viewer.min.css"




const video  =  document.getElementById("video");
const canvas = document.getElementById("upscaled");
const fullScreenButton = document.getElementById('full-screen');
const imageCompare = document.getElementById('image-compare');


var pending_outputs = 0;
let frames_processed = 0;


let gpu;

Alpine.store('state', 'init');

Alpine.start();


async function index() {
    if(!"VideoEncoder" in window) return showUnsupported("WebCodecs");
    gpu = await WebSR.initWebGPU();
    if(!gpu) return showUnsupported("WebGPU");
    window.chooseFile =  chooseFile;

}
function chooseFile(e) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = inputHandler;
    input.click();
}

index();

function showUnsupported(text) {
    Alpine.store('component', text);
    Alpine.store('state', 'unsupported');
}


function inputHandler(input){

    const file = input.target.files[0];
    const url = URL.createObjectURL(file);

    const reader = new FileReader();

    reader.onload = function (e) {
        setupUpscaler(url);
    }

    Alpine.store('download_name',  file.name.split(".")[0] + "-upscaled.mp4");
    reader.readAsDataURL(file);

}

async function setupUpscaler(url) {
    video.src = url;

    video.onloadeddata = async function (){
        const websr = new WebSR({
            source: video,
            network_name: "anime4k/cnn-2x-s",
            weights:weights,
            gpu: gpu,
            canvas: canvas
        });
        console.log("Setting the preview");

        Alpine.store('state', 'preview');


        canvas.width = video.videoWidth*2;
        canvas.height = video.videoHeight*2;

        video.volume = 0.01;

        // View them side by side
        new ImageCompare( document.getElementById("image-compare")).mount();


        const muxer = new Muxer({
            target: new ArrayBufferTarget(),
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
            error: (e)=> console.log(e)
        })

        let finished= false;

        audioEncoder.configure({
            codec: 'mp4a.40.2',
            sampleRate: 48000,
            numberOfChannels: 2
        })


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

        const encoder_config = {
            codec: 'avc1.42001f',
            width: video.videoWidth*2,
            height: video.videoHeight*2,
            bitrate: 1e7,
            framerate: 30,
        };


        const init = {
            output: (chunk, meta) => {
                handleEncoded(chunk, meta);
            },
            error: (e) => {
                console.log(e.message);
            }
        };

        let encoder = new VideoEncoder(init);
        encoder.configure(encoder_config);


        const frameStack = [];

        async function decodeLoop() {
            let bitmap = await createImageBitmap(video);
            frameStack.push({
                frame: bitmap,
                time: video.currentTime
            });
            pending_outputs +=1;
            if(frameStack.length > 40) video.pause();
            video.requestVideoFrameCallback(decodeLoop);
        }


        window.frameStack = frameStack;

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

            encoder.encode(upscaled_frame, { keyFrame: isKeyFrame});

            upscaled_frame.close();

            if(!(video.ended && frameStack.length ===0) ) await encodeLoop();
        }


        let initPlaybackTime = null;


        video.requestVideoFrameCallback(showPreview);


        async function showPreview(){
            const bitmap = await createImageBitmap(video);
            await websr.render(bitmap);
            window.initRecording = initRecording;
            window.fullScreenPreview = fullScreenPreview;
            fullScreenButton.style.left = `${imageCompare.offsetLeft + 550}px`
            fullScreenButton.style.top = `${imageCompare.offsetTop + 300}px`

            imageCompare.addEventListener('fullscreenchange', function () {
                if(!document.fullscreenElement){
                    canvas.style.width = ``;
                    canvas.style.height = ``;
                }
            });

        }

        async function fullScreenPreview(e) {
            imageCompare.requestFullscreen();
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

        }

        async function initRecording(){


            Alpine.store('state', 'processing');

            let bitmap = await createImageBitmap(video);
            frameStack.push({
                frame: bitmap,
                time: video.currentTime
            });

            pending_outputs +=1;

            const audioStream = video.captureStream().getAudioTracks()[0];

            const audioContext = new AudioContext();
            const source  = audioContext.createMediaStreamSource(new MediaStream([audioStream]));

            const processor = audioContext.createScriptProcessor(4096, 2, 2);

            source.connect(processor);
            processor.connect(audioContext.destination);
            processor.onaudioprocess = function (e) {

                if(finished) return;

                const inputBuffer = e.inputBuffer;

                if(!initPlaybackTime) initPlaybackTime = e.playbackTime;

                const numberOfChannels = inputBuffer.numberOfChannels;
                const numberOfFrames = inputBuffer.length;
                const sampleRate = inputBuffer.sampleRate;


                // Create an AudioData object
                let audioData = new AudioData({
                    format: 'f32', // assuming the audio data is in 32-bit float format
                    sampleRate: sampleRate,
                    numberOfFrames: numberOfFrames,
                    numberOfChannels: numberOfChannels,
                    timestamp: (e.playbackTime -initPlaybackTime)* sampleRate, // or other appropriate timestamp
                    data: copyAudioData(inputBuffer) // You'll need to copy data from inputBuffer
                });

                audioEncoder.encode(audioData);
            }



            video.play();

            video.requestVideoFrameCallback(decodeLoop);

            video.requestVideoFrameCallback(encodeLoop);
        }








        video.onended = async function () {
            if(video.ended && pending_outputs < 1 && !finished) return await onEnd();
        }

        async function onEnd() {

            Alpine.store('state', 'complete');

            finished = true;
            await encoder.flush()
            await audioEncoder.flush();
            await audioEncoder.close();
            muxer.finalize();


            const blob = new Blob([muxer.target.buffer], {type: "video/mp4"});

            const url = window.URL.createObjectURL(blob);

            Alpine.store('download_url', url);



        }

        async function handleEncoded(chunk, meta){

            muxer.addVideoChunk(chunk, meta);

            if(video.ended && pending_outputs < 1 && !finished) return await onEnd();

        }




    }

}

