const { Readable } = require("stream");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Busboy = require("busboy");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: event.headers });
    let uploadPath = "";
    let fileWriteStream;

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

    // Convert base64 body to buffer
    const buffer = Buffer.from(event.body || "", "base64");
    busboy.end(buffer);
  });
};


