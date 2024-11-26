"use client";
import Image from "next/image";
import Microphone from "./microphone";
import { FaGithub } from "react-icons/fa";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./Experience";

import { CiLinkedin } from "react-icons/ci";
import Siriwave from "react-siriwave";
import MicrosoftAvatar from "./MicrosoftAvatar";
import { MediumAvatar } from "./MediumAvatar";
import "./globals.css";
import RealEstateAssistant from "./RealEstateAssistant";

export default function Home() {
  return (
    <>
      {/* <Canvas
        shadows
        camera={{ position: [0, 0, 8], fov: 42 }}
        style={{ width: "70vw", height: "50vh" }}
      >
        <Experience />
      </Canvas> */}
      {/* <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="mb-32 lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4">
          <MicrosoftAvatar />
          <Microphone />
        </div>
      </main> */}
      {/* <MediumAvatar /> */}
      <RealEstateAssistant />
    </>
  );
}
