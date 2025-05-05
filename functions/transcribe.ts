import { Handler } from "@netlify/functions";
import { OpenAI } from "openai";
import Busboy from "busboy";
import fs from "fs";
import os from "os";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  return new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: event.headers,
    });

    let uploadPath = "";
    let fileWriteStream: fs.WriteStream;

    busboy.on("file", (_fieldname, file, filename) => {
      uploadPath = path.join(os.tmpdir(), filename);
      fileWriteStream = fs.createWriteStream(uploadPath);
      file.pipe(fileWriteStream);
    });

    busboy.on("finish", async () => {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(uploadPath),
          model: "whisper-1",
        });

        fs.unlinkSync(uploadPath); // cleanup

        resolve({
          statusCode: 200,
          body: JSON.stringify({ text: transcription.text }),
        });
      } catch (err) {
        console.error("Transcription error:", err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to transcribe audio." }),
        });
      }
    });

    busboy.end(Buffer.from(event.body || "", "base64"));
  });
};

export { handler };

