const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const os = require("os");
const api = require("./api")
/*
This file handles the file conversions for storing audio files on imgur. 
  audio to static mp4
  mp4 to audio
  split mp4 into 50 second segments (for max imgur video length)
*/

const audToMp4 = (base64Audio, extension) => {
  return new Promise((resolve, reject) => {
    // Paths for temporary files
    const tempAudioPath = path.join(__dirname, 'temp_audio_file.' + extension);
    const tempOutputPath = path.join(__dirname, 'output.mp4');

    // Decode the base64 audio and save it as a temporary file
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    fs.writeFile(tempAudioPath, audioBuffer, (err) => {
      if (err) {
        return reject(`Failed to write temporary audio file: ${err.message}`);
      }

      // Use ffmpeg to create an MP4 with blank video
      ffmpeg(tempAudioPath)
        .input('color=c=black:s=1280x720:d=10') // Blank video with black color
        .inputFormat('lavfi')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-shortest'])
        .save(tempOutputPath)
        .on('end', () => {
          // Read the output file as a base64 string
          fs.readFile(tempOutputPath, (readErr, data) => {
            if (readErr) {
              return reject(`Failed to read output MP4 file: ${readErr.message}`);
            }

            // Encode the MP4 file as base64
            const base64Output = data.toString('base64');

            // Clean up temporary files
            fs.unlink(tempAudioPath, () => {});
            fs.unlink(tempOutputPath, () => {});

            resolve(base64Output);
          });
        })
        .on('error', (ffmpegErr) => {
          reject(`FFmpeg error: ${ffmpegErr.message}`);
        });
    });
  });
}

const segmentizeMp4 = (base64Mp4) => {
  return new Promise((resolve, reject) => {
    // Paths for temporary files
    const tempInputPath = path.join(__dirname, 'temp_input.mp4');
    const tempSegmentPath = path.join(__dirname, 'segment_%03d.mp4');

    // Decode the base64 MP4 and save it as a temporary file
    const mp4Buffer = Buffer.from(base64Mp4, 'base64');
    fs.writeFile(tempInputPath, mp4Buffer, (err) => {
      if (err) {
        return reject(`Failed to write temporary MP4 file: ${err.message}`);
      }

      // Use ffmpeg to split the MP4 into 50-second segments
      ffmpeg(tempInputPath)
        .outputOptions('-f', 'segment', '-segment_time', '50', '-reset_timestamps', '1')
        .output(tempSegmentPath)
        .on('end', () => {
          // Read all generated segments and encode them as base64
          const segmentFiles = fs.readdirSync(__dirname).filter((file) => file.startsWith('segment_') && file.endsWith('.mp4'));
          const base64Segments = segmentFiles.map((file) => {
            const filePath = path.join(__dirname, file);
            const fileData = fs.readFileSync(filePath);
            fs.unlinkSync(filePath); // Cleanup segment file
            return fileData.toString('base64');
          });

          // Cleanup temporary input file
          fs.unlinkSync(tempInputPath);

          resolve(base64Segments);
        })
        .on('error', (ffmpegErr) => {
          // Cleanup temporary input file in case of error
          fs.unlinkSync(tempInputPath);
          reject(`FFmpeg error: ${ffmpegErr.message}`);
        })
        .run();
    });
  });
}

const combineMp4 = (blobs) => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, 'temp_segments');
    const tempListPath = path.join(tempDir, 'file_list.txt');
    const tempOutputPath = path.join(__dirname, 'output_combined.mp4');

    // Create a temporary directory for storing segment files
    fs.mkdirSync(tempDir, { recursive: true });

    // Write each Blob as a segment file
    const segmentPaths = [];
    blobs.forEach((blob, index) => {
      const segmentPath = path.join(tempDir, `segment_${index}.mp4`);
      const segmentBuffer = Buffer.from(blob);
      fs.writeFileSync(segmentPath, segmentBuffer);
      segmentPaths.push(segmentPath);
    });

    // Create a file list for FFmpeg concatenation
    const fileListContent = segmentPaths.map((filePath) => `file '${filePath}'`).join('\n');
    fs.writeFileSync(tempListPath, fileListContent);

    // Use FFmpeg to concatenate the segments into a single file
    ffmpeg()
      .input(tempListPath)
      .inputOptions('-f', 'concat', '-safe', '0')
      .outputOptions('-c', 'copy')
      .output(tempOutputPath)
      .on('end', () => {
        // Read the combined MP4 file and encode it as base64
        fs.readFile(tempOutputPath, (readErr, data) => {
          if (readErr) {
            return reject(`Failed to read output MP4 file: ${readErr.message}`);
          }

          const base64Output = data.toString('base64');

          // Cleanup temporary files and directory
          fs.rmSync(tempDir, { recursive: true, force: true });
          fs.unlinkSync(tempOutputPath);

          resolve(base64Output);
        });
      })
      .on('error', (ffmpegErr) => {
        // Cleanup on error
        fs.rmSync(tempDir, { recursive: true, force: true });
        reject(`FFmpeg error: ${ffmpegErr.message}`);
      })
      .run();
  });
}

const extractMp3FromMp4 = (base64Mp4) => {
  return new Promise((resolve, reject) => {
    // Paths for temporary files
    const tempInputPath = path.join(__dirname, 'temp_input.mp4');
    const tempOutputPath = path.join(__dirname, 'output_audio.mp3');

    // Decode the base64 MP4 and save it as a temporary file
    const mp4Buffer = Buffer.from(base64Mp4, 'base64');
    fs.writeFile(tempInputPath, mp4Buffer, (err) => {
      if (err) {
        return reject(`Failed to write temporary MP4 file: ${err.message}`);
      }

      // Use FFmpeg to extract the MP3 audio
      ffmpeg(tempInputPath)
        .noVideo() // Disable video stream
        .audioCodec('libmp3lame') // Use MP3 codec
        .save(tempOutputPath)
        .on('end', () => {
          // Read the MP3 file and encode it as base64
          fs.readFile(tempOutputPath, (readErr, data) => {
            if (readErr) {
              return reject(`Failed to read output MP3 file: ${readErr.message}`);
            }

            const base64Audio = data.toString('base64');

            // Cleanup temporary files
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(tempOutputPath);

            resolve(base64Audio);
          });
        })
        .on('error', (ffmpegErr) => {
          // Cleanup on error
          fs.unlinkSync(tempInputPath);
          reject(`FFmpeg error: ${ffmpegErr.message}`);
        });
    });
  });
}



const getMp4ImgurBlob = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Error fetching video: ${response.status}`);
    }

    const videoBlob = await response.blob(); // Retrieve the video as a Blob
    return videoBlob;

  } catch (error) {
    console.error('Error:', error);
  }
}

export const uploadAudio = (base64Audio, extension) => {
  audToMp4(base64Audio, extension).then((base64Mp4) => {
    segmentizeMp4(base64Mp4).then((segments) => {
      let output = [];
      for (segment of segments) {
        output.push(api.uploadToImgur(segment));
      }
    });
  });

  return output;
}

export const getAudio = (links) => {
  let blobs = [];
  for (link of links) {
    blobs.push(getMp4ImgurBlob(link));
  }

  combined = combineMp4(blobs);
  return extractMp3FromMp4(combined);
}