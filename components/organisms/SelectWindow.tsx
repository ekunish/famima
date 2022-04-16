// import * as facemesh from '@tensorflow-models/facemesh';
import * as bodyPix from '@tensorflow-models/body-pix';
import React, { EventHandler, useEffect, useRef, useState } from 'react'
import Button from '../atoms/Button';
import { PersonInferenceConfig } from '@tensorflow-models/body-pix/dist/body_pix_model';

const FPS = 10;
const thresholdCount = 20;
const displayConfig = {
  width: 890,
  height: 504,
};
const detectArea = {
  width: 890,
  height: 200 // reverse
}
const threshold = 0.4;
const bodyPixOption = {
  flipHorizontal: false,
  internalResolution: "high",
  segmentationThreshold: 0.2,
  maxDetections: 2,
  scoreThreshold: 0.2,
  nmsRadius: 10,
  minKeypointScore: 0.2,
  refineSteps: 10,
} as PersonInferenceConfig;

const SelectWindow: React.FC = () => {
  const [comming, setComming] = useState(false)
  const [model, setModel] = useState<bodyPix.BodyPix>()
  const [audio, setAudio] = useState<HTMLAudioElement>()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const outputRef = useRef<HTMLCanvasElement | null>(null)
  const [silentCount, setSilentCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDisplaySegment, setIsDisplaySegment] = useState(true);
  const isDisplaySegmentRef = useRef(isDisplaySegment)


  const sound = (type: OscillatorType, sec: number | undefined) => {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.type = type
    osc.connect(ctx.destination)
    osc.start()
    osc.stop(sec)
  }

  const bell = () => {
    // sound("sine", 0.5)
    audio && (audio.volume = 0.05) && audio.play();

    return true
  }

  const handleChangeSegment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = JSON.parse(e.target.value.toLowerCase())
    setIsDisplaySegment(input)
    isDisplaySegmentRef.current = input
  }

  useEffect(() => {
    console.log("start")
    setAudio(new Audio("famima.mp3"))
    bodyPix.load().then((net) => {
      setModel(net);
      console.log("bodypix loaded")
    })
  }, [])

  useEffect(() => {
    let counter = 0;
    setInterval(async () => {
      if (model && isLoading) {
        const bodies = await model.segmentMultiPersonParts(videoRef.current!, bodyPixOption);
        let isComming = false;
        setComming(false);
        bodies && bodies.map((body: any) => {
          const rightHip = body.pose.keypoints[11]
          const leftHip = body.pose.keypoints[12]
          if ((rightHip && rightHip.score > threshold) || (leftHip && leftHip.score > threshold)) {
            if ((rightHip.position.y > detectArea.height) || (leftHip.position.y > detectArea.height)) {
              isComming = true;
              setComming(true);
            }
          }
        })

        if(bodies && isDisplaySegmentRef.current && outputRef.current){
          outputRef.current!.width = displayConfig.width
          outputRef.current!.height = displayConfig.height

          outputRef.current!.getContext("2d")!.clearRect(0, 0, videoRef.current!.width, videoRef.current!.height);
          const mask = bodyPix.toColoredPartMask(bodies);
          const opacity = 1.0;

          bodyPix.drawMask(outputRef.current!, videoRef.current!, mask, opacity, 0, false);

          var imageData = outputRef.current!.getContext("2d")!.getImageData(0, 0, outputRef.current!.width, outputRef.current!.height);
          for(var i = 0; i < (imageData.width*imageData.height); i++) {
            ((imageData.data[i*4] == 255) && (imageData.data[i*4+1] == 255) && (imageData.data[i*4+2] == 255))
              && (imageData.data[i*4+3] = 0);
          }
          outputRef.current!.getContext("2d")!.putImageData(imageData, 0, 0);
        }


        isComming
          ? ((counter >= thresholdCount) ? (bell() && (counter = 0)) : (counter = 0))
          : (counter < thresholdCount) && (counter += 1 / FPS);

        setSilentCount(counter);

      }
    }, 1000 / FPS)

  }, [model, isLoading])


  const callGetDisplayMedia = async () => {
    await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: {
        width: displayConfig.width,
        height: displayConfig.height
      }
    }).then((stream) => {
      videoRef.current!.srcObject = stream

      videoRef.current!.onloadeddata = (event) => {
        setIsLoading(true);
        console.log("videoRef onloaded")
      };

    });
  }



  return (
    <div className="relative flex flex-col text-center container mx-auto">
      <div className="mb-5 mt-16">
        <p className="mb-5">判定したい画面をピン留めした上で、下記ボタンからZOOMを選択してください。</p>
        <Button onClick={() => callGetDisplayMedia()}>{isLoading ? "Cancel" : "Select a window"}</Button>
      </div>
      {(comming ? <div className="bg-red-600 text-gray-100">来客</div>
        : <div className="bg-blue-600 text-gray-100">無人</div>)}
      <div className="flex flex-col justify-start text-left">
      <div className="">Silent Count: {Math.round(silentCount)} / {thresholdCount}</div>
      <div className='relative'>
          <label>Segment: </label>
        <label className="mx-1 inline-flex items-center">
          <input
            type="radio"
            value="true"
            checked={isDisplaySegment === true}
            onChange={handleChangeSegment}
            />
          <span className="ml-1">display</span>
        </label>
        <label className="mx-1 inline-flex items-center">
          <input
            type="radio"
            value="false"
            checked={isDisplaySegment === false}
            onChange={handleChangeSegment}
            />
          <span className="ml-1">hidden</span>
        </label>
      </div>
      </div>

      <div className="relative flex justify-center items-center mt-5">
        <div className="absolute top-0">
          <video ref={videoRef} id="windowVideo" autoPlay playsInline muted style={{
            // visibility: 'hidden',
            width: displayConfig.width,
            height: displayConfig.height
          }}
            className="opacity-100" />
        </div>
        {isDisplaySegment && comming && <div className="absolute top-0">
          <canvas ref={outputRef} id="output" className="opacity-60 w-full h-full"
            style={{
              // visibility: isDisplaySegment ? "hidden" : "visible",
              // width: displayConfig.width,
              // height: displayConfig.height
            }} />
        </div>}
      </div>
    </div>
  )
}

export default SelectWindow;
