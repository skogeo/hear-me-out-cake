const multer = require('multer');
const path = require('path');
const { promises: fs } = require('fs');
const sharp = require('sharp');

const UPLOAD_DIR = 'uploads';
const CHUNKS_DIR = path.join(UPLOAD_DIR, 'chunks');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Create directories for file uploads and chunks
const initializeDirectories = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(CHUNKS_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    if (req.body.isChunked === 'true') {
      cb(null, CHUNKS_DIR);
    } else {
      cb(null, UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    if (req.body.isChunked === 'true') {
      cb(null, `${req.body.identifier}_${req.body.chunkNumber}`);
    } else {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

// Handler for assembling file chunks
const assembleChunks = async (identifier, totalChunks, originalname) => {
  const chunkFiles = await fs.readdir(CHUNKS_DIR);
  const relevantChunks = chunkFiles.filter(file => file.startsWith(identifier));

  if (relevantChunks.length !== parseInt(totalChunks)) {
    return null;
  }

  const finalPath = path.join(UPLOAD_DIR, `${identifier}${path.extname(originalname)}`);
  const writeStream = fs.createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(CHUNKS_DIR, `${identifier}_${i}`);
    const chunkBuffer = await fs.readFile(chunkPath);
    writeStream.write(chunkBuffer);
    await fs.unlink(chunkPath);
  }

  writeStream.end();
  return finalPath;
};

// Image optimization with sharp
const optimizeImage = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const optimizedPath = filePath.replace(ext, `_optimized${ext}`);

  await sharp(filePath)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(optimizedPath);

  return optimizedPath;
};

module.exports = {
  initializeDirectories,
  upload,
  assembleChunks,
  optimizeImage
};