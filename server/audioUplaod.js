import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { PassThrough } from 'stream';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import concat from 'concat-stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GOOGLE_DRIVE_JSON = process.env.GOOGLE_DRIVE_JSON;
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

if (!GOOGLE_DRIVE_JSON) {
  throw new Error("Missing GOOGLE_DRIVE_JSON environment variable");
}

const convertToMp3 = async (file) => {
    const extension = path.extname(file.originalname).slice(1);
    const validExtensions = ["mp3", "wav", "aac", "ogg", "flac", "m4a", "amr"];

    if (!validExtensions.includes(extension)) {
        throw new Error("Invalid file format");
    }

    const bufferStream = new PassThrough();
    bufferStream.end(file.buffer);

    return new Promise((resolve, reject) => {
        const outputStream = new PassThrough();
        ffmpeg(bufferStream)
            .audioBitrate(128)
            .toFormat('mp3')
            .on('error', (err) => reject(err))
            .pipe(outputStream);
        
        outputStream.pipe(concat((buffer) => {
            resolve({
                originalname: `${path.basename(file.originalname, path.extname(file.originalname))}_128kbps.mp3`,
                buffer: buffer,
                mimetype: "audio/mp3",
            });
        }));
    });
};

export const uploadFileToDrive = async (file) => {
    try {
        const convertedFile = await convertToMp3(file);
        const credentials = JSON.parse(GOOGLE_DRIVE_JSON);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });

        const drive = google.drive({ version: "v3", auth });

        const bufferStream = new PassThrough();
        bufferStream.end(convertedFile.buffer);

        const response = await drive.files.create({
            requestBody: {
                name: convertedFile.originalname,
                parents: ["1wcUVJssTEVBpyrz1OYEJ96e-74CTMkSF"], // Replace with your shared folder ID
            },
            media: {
                mimeType: convertedFile.mimetype,
                body: bufferStream,
            },
        });

        return response.data;
    } catch (error) {
        throw new Error("Failed to convert and upload file: " + error.message);
    }
};

export { convertToMp3 };