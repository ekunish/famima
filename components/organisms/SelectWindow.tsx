// import * as facemesh from '@tensorflow-models/facemesh';
import * as bodyPix from '@tensorflow-models/body-pix';
import React, { useRef } from 'react'
import Button from '../atoms/Button';
import { PersonInferenceConfig } from '@tensorflow-models/body-pix/dist/body_pix_model';

const SelectWindow: React.FC = () => {
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
    const audioElm = new Audio()
    audioElm.src = "famima.mp3"
    audioElm.play()
  }

  const callGetDisplayMedia = async () => {
    console.log('call getDisplayMedia')

    await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: {
        width: 1280,
        height: 720
      }
    }).then((stream) => {
      // console.log(stream)
      videoRef.current!.srcObject = stream
      estimateFace()

    });


  }

  const estimateFace = async () => {
    const modelBody = await bodyPix.load()
    const video = document.getElementById('windowVideo') as HTMLVideoElement;
    // console.log(video)

    bell();

    let silentCount = 0

    setInterval(async () => {
      // console.log('interval')
      const bodyPixOption = {
        flipHorizontal: false,
        internalResolution: "medium",
        segmentationThreshold: 0.4,
        maxDetections: 1,
        scoreThreshold: 0.5,
        nmsRadius: 20,
        minKeypointScore: 0.3,
        refineSteps: 10,
      } as PersonInferenceConfig;
      const bodies = await modelBody.segmentPerson(video, bodyPixOption);
      // const faces = await model.estimateFaces(video);

      if (bodies.allPoses.length > 0) {
        console.log(bodies.allPoses.length)
        if (silentCount > 10) {
          console.log("comming!!!!!!!!!!!!!!!!!!!!!!!")
          // sound("sine", 0.5)
          bell();

        }
        silentCount = 0
      } else {
        console.log("none")
        silentCount = silentCount + 1
      }

    }, 1000)
  }



  return (
    <div className="pt-24">
      <p>SelectWindow</p>
      <Button onClick={() => callGetDisplayMedia()}>Select</Button>
      <video ref={videoRef} id="windowVideo" autoPlay playsInline muted />
    </div>
  )
}

export default SelectWindow;