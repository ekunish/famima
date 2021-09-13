// import * as facemesh from '@tensorflow-models/facemesh';
import * as bodyPix from '@tensorflow-models/body-pix';
import React, { useEffect, useRef, useState } from 'react'
import Button from '../atoms/Button';
import { PersonInferenceConfig } from '@tensorflow-models/body-pix/dist/body_pix_model';

const SelectWindow: React.FC = () => {
  const [showState, setShowState] = useState(false)
  const [comming, setComming] = useState(false)
  const [model, setModel] = useState<bodyPix.BodyPix>()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [audio, setAudio] = useState<HTMLAudioElement>()

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
    audio && (audio.volume = 0.1) && audio.play();
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
      // console.log(stream)
      videoRef.current!.srcObject = stream
      estimateFace()

    });
  }

  useEffect(() => {
    setAudio(new Audio("famima.mp3"))
  }, [])

  useEffect(() => {
    bodyPix.load().then((net) => {
      setModel(net);
    })
  }, [])

  const estimateFace = async () => {
    const video = document.getElementById('windowVideo') as HTMLVideoElement;
    const output = document.getElementById('output') as HTMLCanvasElement;
    output.width = video.width
    output.height = video.height

    const ctx = output.getContext("2d")

    // console.log(video)

    setShowState(true)
    bell();

    let silentCount = 0

    setInterval(async () => {
      const bodyPixOption = {
        flipHorizontal: false,
        internalResolution: "medium",
        segmentationThreshold: 0.3,
        maxDetections: 4,
        scoreThreshold: 0.3,
        nmsRadius: 20,
        minKeypointScore: 0.3,
        refineSteps: 10,
      } as PersonInferenceConfig;

      if (model) {
        // video.addEventListener('loadeddata', async () => {
        // const bodies = await model.segmentPerson(video, bodyPixOption);
        // if (bodies.allPoses.length > 0) {
        //   console.log(bodies.allPoses.length)
        //   setComming(true)
        //   if (silentCount > 10) {
        //     console.log("comming!!!!!!!!!!!!!!!!!!!!!!!")
        //     bell();
        //   }
        //   silentCount = 0
        // } else {
        //   setComming(false)
        //   console.log("none")
        //   silentCount = silentCount + 1
        // }

        const bodies = await model.segmentMultiPerson(video, bodyPixOption);
        setComming(false);
        let commingFlag = false
        // console.log(bodies)
        bodies && bodies.map((body) => {
          const leftKnee = body.pose.keypoints[13]
          const rightKnee = body.pose.keypoints[14]

          const threshold = 0.7
          if ((leftKnee && leftKnee.score > threshold) || (rightKnee && rightKnee.score > threshold)) {
            setComming(true);
            commingFlag = true
          }
        })

        if (commingFlag) {
          console.log("comming")
          if (silentCount > 20) {
            bell();
          }
          silentCount = 0;
        } else {
          console.log("silent")
          silentCount = silentCount + 1
        }


        // })


      }
    }, 1000)
  }


  return (
    <div className="pt-10 text-center">
      <div className="mb-6">
        <p className="mb-3">判定したい場所が大きく映っている状態にした上で、下記ボタンからZOOMを選択してください。</p>
        <Button onClick={() => callGetDisplayMedia()}>Select a window</Button>
      </div>
      {showState &&
        (comming ? <div className="bg-red-600 text-gray-100">来客</div>
          : <div className="bg-blue-600 text-gray-100">無人</div>)}
      <video ref={videoRef} id="windowVideo" autoPlay playsInline muted />
      <canvas id="output" />
    </div>
  )
}

export default SelectWindow;