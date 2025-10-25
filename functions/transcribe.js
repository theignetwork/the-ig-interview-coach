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
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: { "Content-Type": "application/json" }
    };
  }

  // Log headers for debugging
  console.log("Request content type:", event.headers['content-type'] || event.headers['Content-Type']);
  
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ 
      headers: event.headers,
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });
    
    let uploadPath = "";
    let fileWriteStream;
    let fileReceived = false;
    
    busboy.on("file", (fieldname, file, { filename, encoding, mimeType }) => {
      console.log(`Processing file upload: field=${fieldname}, filename=${filename}, type=${mimeType}`);
      fileReceived = true;
      
      // Generate a unique filename with timestamp
      const safeFilename = `recording-${Date.now()}.webm`;
      uploadPath = path.join(os.tmpdir(), safeFilename);
      console.log(`Saving to: ${uploadPath}`);
      
      fileWriteStream = fs.createWriteStream(uploadPath);
      
      // Track file size for debugging
      let fileSize = 0;
      file.on('data', (chunk) => {
        fileSize += chunk.length;
      });
      
      file.on('end', () => {
        console.log(`File upload completed: ${fileSize} bytes received`);
      });
      
      file.pipe(fileWriteStream);
    });

    busboy.on("finish", async () => {
      try {
        if (!fileReceived) {
          throw new Error("No file was received in the request");
        }
        
        // Ensure file is fully written
        if (fileWriteStream) {
          await new Promise((resolve) => {
            fileWriteStream.on('finish', resolve);
            fileWriteStream.end();
          });
        }
        
        // Check file exists and has content
        if (!fs.existsSync(uploadPath)) {
          throw new Error(`File does not exist at path: ${uploadPath}`);
        }
        
        const stats = fs.statSync(uploadPath);
        console.log(`File size on disk: ${stats.size} bytes`);
        
        if (stats.size === 0) {
          throw new Error("File is empty (0 bytes)");
        }
        
        // Send to Whisper API
        console.log("Sending to Whisper API...");
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(uploadPath),
          model: "whisper-1",
        });
        
        console.log("Transcription successful:", transcription.text.substring(0, 50) + "...");
        
        // Cleanup and return
        try {
          fs.unlinkSync(uploadPath);
        } catch (cleanupError) {
          console.warn("Failed to clean up file:", cleanupError);
        }
        
        resolve({
          statusCode: 200,
          body: JSON.stringify({ text: transcription.text }),
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("Transcription error:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
          response: err.response?.data || "No response data"
        });
        
        // Try to clean up file if it exists
        if (uploadPath && fs.existsSync(uploadPath)) {
          try {
            fs.unlinkSync(uploadPath);
          } catch (e) {
            console.error("Error cleaning up file:", e);
          }
        }
        
        resolve({
          statusCode: 500,
          body: JSON.stringify({ 
            error: "Failed to transcribe audio.",
            details: err.message || "Unknown error" 
          }),
          headers: { "Content-Type": "application/json" }
        });
      }
    });

    // Parse the request body
    if (event.isBase64Encoded) {
      const buffer = Buffer.from(event.body, "base64");
      busboy.end(buffer);
    } else {
      const buffer = Buffer.from(event.body, "utf-8");
      busboy.end(buffer);
    }
  });
};



