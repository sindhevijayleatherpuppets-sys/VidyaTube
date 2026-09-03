const multer = require("multer");
const path = require("path");
const fs = require("fs");

const VIDEO_DIR = path.join(__dirname, "..", "uploads", "videos");
const THUMB_DIR = path.join(__dirname, "..", "uploads", "thumbnails");

[VIDEO_DIR, THUMB_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "video") {
      cb(null, VIDEO_DIR);
    } else if (file.fieldname === "thumbnail") {
      cb(null, THUMB_DIR);
    } else {
      cb(new Error("Unexpected field"), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "video") {
    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return cb(new Error("Invalid video format"), false);
    }
  } else if (file.fieldname === "thumbnail") {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error("Invalid thumbnail format"), false);
    }
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // multer applies the same global limit; per-field limit is
    // enforced after upload in the controller for the thumbnail (see videoController).
  },
});

const uploadVideoMiddleware = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

module.exports = { upload, uploadVideoMiddleware, MAX_VIDEO_SIZE, MAX_THUMBNAIL_SIZE };

