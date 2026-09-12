import multer from "multer";

// Files are held in memory only long enough to stream them to
// Cloudinary — nothing is written to disk on the API server.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file, matches the client's copy
    files: 3, // matches "up to 3 images" in the report form
  },
});

export default upload;