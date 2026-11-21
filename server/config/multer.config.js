import multer from "multer";
import path from "path";
import {fileURLToPath} from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {recursive: true});
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter - only accept PDF and DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".docx", ".doc"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF and DOCX files are allowed."),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Audio upload configuration for voice interviews
const audioStorage = multer.memoryStorage(); // Store in memory for quick processing

const audioFileFilter = (req, file, cb) => {
  console.log("📎 Multer received file:");
  console.log("  - fieldname:", file.fieldname);
  console.log("  - originalname:", file.originalname);
  console.log("  - mimetype:", file.mimetype);

  const allowedTypes = [".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac"];
  const ext = path.extname(file.originalname).toLowerCase();

  // Also check MIME types
  const allowedMimes = [
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/m4a",
    "audio/x-m4a",
    "audio/webm",
    "audio/ogg",
    "audio/flac",
  ];

  if (allowedTypes.includes(ext) || allowedMimes.includes(file.mimetype)) {
    console.log("  ✅ File accepted");
    cb(null, true);
  } else {
    console.log("  ❌ File rejected - Invalid format");
    cb(
      new Error(
        "Invalid audio format. Allowed: wav, mp3, m4a, webm, ogg, flac"
      ),
      false
    );
  }
};

export const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio
  },
});

// Video upload configuration for recorded interview sessions
const videoDir = path.join(uploadsDir, "interviews");
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    const filename = `session-${req.params.sessionId || "rec"}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const videoFileFilter = (req, file, cb) => {
  const allowedExts = [".webm", ".mp4", ".mkv"];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = ["video/webm", "video/mp4", "video/x-matroska", "application/octet-stream"];

  if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid video format. Allowed: webm, mp4"), false);
  }
};

export const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB limit
  },
});


export default upload;
