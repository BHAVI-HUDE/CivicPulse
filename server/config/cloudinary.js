import { v2 as cloudinary } from "cloudinary";

// Configured once from env vars. If these aren't set, uploads will
// fail with a clear error rather than silently hitting Cloudinary's
// default (nonexistent) account.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

export default cloudinary;