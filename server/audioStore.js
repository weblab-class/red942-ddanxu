import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";
import { uploadToImgur } from "./imgur.js";
import { fileURLToPath } from "url";

const audToMp4 = async (base64Audio, extension) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tempAudioPath = path.join(__dirname, "temp_audio_file." + extension);
  const tempOutputPath = path.join(__dirname, "output.mp4");
  const blankVideoPath = path.join(__dirname, "./res/black_background.mp4");

  try {
    const audioBuffer = Buffer.from(base64Audio, "base64");
    await fs.promises.writeFile(tempAudioPath, audioBuffer);

    await new Promise((resolve, reject) => {
      ffmpeg(tempAudioPath)
        .input(blankVideoPath) // Use pre-generated blank video
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-shortest"])
        .save(tempOutputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    const data = await fs.promises.readFile(tempOutputPath);
    const base64Output = data.toString("base64");

    await Promise.all([fs.promises.unlink(tempAudioPath), fs.promises.unlink(tempOutputPath)]);

    return base64Output;
  } catch (error) {
    throw new Error(`Error in audToMp4: ${error.message}`);
  }
};

const segmentizeMp4 = async (base64Mp4) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tempInputPath = path.join(__dirname, "temp_input.mp4");
  const tempSegmentPath = path.join(__dirname, "segment_%03d.mp4");

  try {
    const mp4Buffer = Buffer.from(base64Mp4, "base64");
    await fs.promises.writeFile(tempInputPath, mp4Buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .outputOptions("-f", "segment", "-segment_time", "50", "-reset_timestamps", "1")
        .output(tempSegmentPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    const segmentFiles = fs
      .readdirSync(__dirname)
      .filter((file) => file.startsWith("segment_") && file.endsWith(".mp4"));
    const base64Segments = await Promise.all(
      segmentFiles.map(async (file) => {
        const filePath = path.join(__dirname, file);
        const fileData = await fs.promises.readFile(filePath);
        await fs.promises.unlink(filePath);
        return fileData.toString("base64");
      })
    );

    await fs.promises.unlink(tempInputPath);

    return base64Segments;
  } catch (error) {
    throw new Error(`Error in segmentizeMp4: ${error.message}`);
  }
};

const combineMp4 = async (blobs) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tempDir = path.join(__dirname, "temp_segments");
  const tempListPath = path.join(tempDir, "file_list.txt");
  const tempOutputPath = path.join(__dirname, "output_combined.mp4");

  await fs.promises.mkdir(tempDir, { recursive: true });

  const segmentPaths = await Promise.all(
    blobs.map(async (blob, index) => {
      const segmentPath = path.join(tempDir, `segment_${index}.mp4`);

      // Convert Blob to ArrayBuffer, then to Buffer
      const arrayBuffer = await blob.arrayBuffer();
      const segmentBuffer = Buffer.from(arrayBuffer);

      await fs.promises.writeFile(segmentPath, segmentBuffer);
      return segmentPath;
    })
  );

  const fileListContent = segmentPaths.map((filePath) => `file '${filePath}'`).join("\n");
  await fs.promises.writeFile(tempListPath, fileListContent);

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(tempListPath)
      .inputOptions("-f", "concat", "-safe", "0")
      .outputOptions("-c", "copy")
      .output(tempOutputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  const data = await fs.promises.readFile(tempOutputPath);
  await fs.promises.rm(tempDir, { recursive: true, force: true });
  await fs.promises.unlink(tempOutputPath);

  return data.toString("base64");
};

const extractMp3FromMp4 = async (base64Mp4) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  //If the function is running twice simultaneously, they can interfere
  //to get around this, we add a random number to the end of the file name
  const randomSuffix = Math.floor(Math.random() * 1000000); // Random number to append
  const tempInputPath = path.join(__dirname, `temp_input_${randomSuffix}.mp4`);
  const tempOutputPath = path.join(__dirname, `output_audio_${randomSuffix}.mp3`);

  const mp4Buffer = Buffer.from(base64Mp4, "base64");
  await fs.promises.writeFile(tempInputPath, mp4Buffer);

  await new Promise((resolve, reject) => {
    ffmpeg(tempInputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .save(tempOutputPath)
      .on("end", resolve)
      .on("error", reject);
  });

  const data = await fs.promises.readFile(tempOutputPath);
  await Promise.all([fs.promises.unlink(tempInputPath), fs.promises.unlink(tempOutputPath)]);

  // Return as Blob
  return new Blob([data], { type: "audio/mp3" });
};

const getMp4ImgurBlob = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Error fetching video: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const uploadAudio = async (base64Audio, extension) => {
  const base64Mp4 = await audToMp4(base64Audio, extension);
  const segments = await segmentizeMp4(base64Mp4);

  const uploads = await Promise.all(segments.map(uploadToImgur));
  return uploads;
};

export const getAudio = async (links) => {
  const blobs = await Promise.all(links.map(getMp4ImgurBlob));
  const combined = await combineMp4(blobs);
  const blob = await extractMp3FromMp4(combined);
  return blob;
};
