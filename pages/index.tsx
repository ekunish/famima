import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import SelectWindow from '../components/organisms/SelectWindow'
import styles from '../styles/Home.module.css'
import * as tf from "@tensorflow/tfjs";
import '@tensorflow/tfjs-backend-webgl';
import "@tensorflow/tfjs-backend-wasm";
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'


const Home: NextPage = () => {

  return (

    <div className={styles.container}>
      <Head>
        <title>Famima App</title>
        <meta name="description" content="Famima app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <SelectWindow />
      </main>

    </div>
  )

}

export default Home
