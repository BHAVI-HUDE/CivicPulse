import streamifier from "streamifier";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

/**
 * Uploads a single in-memory file buffer (from multer) to Cloudinary
 * and resolves with the resulting secure URL. Images are organized
 * under civicpulse/issues so they're easy to find/manage in the
 * Cloudinary dashboard.
 */
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "civicpulse/issues",
        resource_type: "image",
        // Keeps stored images reasonably sized without visibly
        // degrading quality — citizen photos can be huge.
        transformation: [{ width: 1600, height: 1600, crop: "limit" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * Uploads every file in a multer `req.files` array to Cloudinary in
 * parallel and returns the array of secure URLs, in the same order
 * the files were received.
 */
export async function uploadIssueImages(files = []) {
  if (!isCloudinaryConfigured) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env.",
    );
  }
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadBufferToCloudinary(file.buffer)));
}

export default uploadIssueImages;