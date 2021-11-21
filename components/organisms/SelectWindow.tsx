// import * as facemesh from '@tensorflow-models/facemesh';
import * as bodyPix from '@tensorflow-models/body-pix';
import React, { useEffect, useRef, useState } from 'react'
import Button from '../atoms/Button';
import { PersonInferenceConfig } from '@tensorflow-models/body-pix/dist/body_pix_model';

const SelectWindow: React.FC = () => {
  const [showState, setShowState] = useState(false)
  const [comming, setComming] = useState(false)
  const [model, setModel] = useState<bodyPix.BodyPix>()
  const [audio, setAudio] = useState<HTMLAudioElement>()
  const videoRef = useRef<HTMLVideoElement>(null)

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
  }

  const callGetDisplayMedia = async () => {
    console.log('call getDisplayMedia')

    await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: {
        width: 894,
        height: 504
      }
    }).then((stream) => {
      videoRef.current!.srcObject = stream
      estimateFace()

    });
  }

  useEffect(() => {
    setAudio(new Audio("famima.mp3"))
    bodyPix.load().then((net) => {
      setModel(net);
    })
  }, [])

  const estimateFace = async () => {
    const video = document.getElementById('windowVideo') as HTMLVideoElement;
    const output = document.getElementById('output') as HTMLCanvasElement;
    output.width = 894
    output.height = 504

    const ctx = output.getContext("2d")


    setShowState(true)
    bell();

    var isLoading = true;

    video.onloadeddata = (event) => {
      isLoading = false;
    };


    let silentCount = 0

    setInterval(async () => {

      const bodyPixOption = {
        flipHorizontal: false,
        internalResolution: "medium",
        segmentationThreshold: 0.5,
        maxDetections: 3,
        scoreThreshold: 0.2,
        nmsRadius: 20,
        minKeypointScore: 0.2,
        refineSteps: 10,
      } as PersonInferenceConfig;

      if (model && !isLoading) {
        const bodies = await model.segmentMultiPerson(video, bodyPixOption);
        setComming(false);
        let commingFlag = false
        bodies && bodies.map((body) => {
          const leftKnee = body.pose.keypoints[13]
          const rightKnee = body.pose.keypoints[14]
          const threshold = 0.4
          // console.log(leftKnee.position.y, rightKnee.position.y);
          if ((leftKnee && leftKnee.score > threshold) || (rightKnee && rightKnee.score > threshold)) {
            if ((leftKnee.position.y > 200) || (rightKnee.position.y > 200)) {
              commingFlag = true;
              setComming(commingFlag);
            }
          }
        })

        ctx?.clearRect(0, 0, video.width, video.height);
        const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
        const foregroundColor = { r: 255, g: 0, b: 0, a: 255 };
        const mask = bodyPix.toMask(bodies, foregroundColor, backgroundColor);
        const opacity = 0.7;

        bodyPix.drawMask(output, video, mask, opacity, 0, false);

        console.log(silentCount);
        if (commingFlag) {
          if (silentCount > 45 * 1000 / 100) {
            bell();
            console.log("comming")
            var now = new Date();
            console.log(now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds());
          }
          silentCount = 0;
        } else {
          silentCount = silentCount + 1
        }
      }
    }, 100)
  }


  return (
    <div className="text-center container mx-auto">
      <div className="mb-5 mt-16">
        <p className="mb-5">判定したい画面をピン留めした上で、下記ボタンからZOOMを選択してください。</p>
        <Button onClick={() => callGetDisplayMedia()}>Select a window</Button>
      </div>
      {showState &&
        (comming ? <div className="bg-red-600 text-gray-100">来客</div>
          : <div className="bg-blue-600 text-gray-100">無人</div>)
      }
      <div className="flex justify-center mt-5">
        <div className="absolute">
          <video ref={videoRef} id="windowVideo" autoPlay playsInline muted style={{
            visibility: 'hidden',
            width: 890,
            height: 504
          }}
            className="" />
        </div>
        <div className="absolute">
          <canvas id="output" className=""
            style={{
              width: 890,
              height: 504
            }} />
        </div>
      </div>
    </div>
  )
}

export default SelectWindow;