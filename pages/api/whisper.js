import axios from "axios";
import { ElevenLabsClient } from "elevenlabs";
import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { runCommands } from "rhubarb-lip-sync";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
var readline = require("readline");

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const bodyData = req.body;
      console.log("body :", bodyData);
      const { text } = bodyData;
      // OpenAI Text generation
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          // {
          //   role: 'system',
          //   content:
          //     'You are a school teacher.Your name is Tina. Give answers to the questions asked by the student in a simple and short manner.and make sure to answer the questions in a way that the student can understand. ',
          // },
          { role: "user", content: text },
        ],
      });

      const generatedText = chatCompletion?.choices[0]?.message?.content;

      res.status(200).json(
        {
          completion: generatedText,
        },
        (err) => {
          console.error("Error synthesizing speech:", err);
          res.status(500).json({ message: "Error synthesizing speech" });
        }
      );
    } catch (error) {
      console.log("error in open ai response", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
