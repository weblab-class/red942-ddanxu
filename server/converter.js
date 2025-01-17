const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");

/*
This file handles the file conversions for storing audio files on imgur. 
  audio to static mp4
  mp4 to audio
  split mp4 into 40 second segments (for max imgur video length)
*/

export const audioBuffBase64toMP4 = (base64Audio, base64Audio) => {
  return new Promise((resolve, reject) => {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");

    // Create a temporary file to store the audio
    const tempInputFile = path.join(os.tmpdir(), "input_audio");

    // Write the buffer to the temporary file
    fs.writeFile(tempInputFile, audioBuffer, (err) => {
      if (err) {
        reject("Error writing audio buffer to temporary file");
        return;
      }

      // Output file for MP4 conversion
      const tempOutputFile = path.join(os.tmpdir(), "output_video.mp4");

      // Use ffmpeg to convert the audio to MP4 with a blank video
      let outputBuffer = [];
      ffmpeg(tempInputFile)
        .input("anullsrc=r=44100:cl=stereo") // Blank video stream
        .inputOptions("-tune", "stillimage") // Simple still image video
        .output(tempOutputFile)
        .videoCodec("libx264")
        .audioCodec("aac")
        .audioBitrate("192k")
        .outputOptions("-shortest")
        .on("end", () => {
          // Read the generated MP4 file and convert it to base64
          fs.readFile(tempOutputFile, (err, data) => {
            if (err) {
              reject("Error reading output file");
              return;
            }
            // Convert the buffer to base64
            const base64Output = data.toString("base64");
            outputBase64Callback(base64Output);
            resolve();
          });
        })
        .on("error", (err) => {
          console.error("Error during conversion:", err);
          reject(err);
        })
        .run();
    });
  });
};
