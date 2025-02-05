const express = require('express');
const router = express.Router();
const path = require('path');
const { upload, assembleChunks, optimizeImage } = require('../utils/fileHandlers');

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.body.isChunked === 'true') {
      if (req.body.chunkNumber === req.body.totalChunks - 1) {
        const finalPath = await assembleChunks(
          req.body.identifier,
          req.body.totalChunks,
          req.file.originalname
        );

        if (!finalPath) {
          return res.status(400).json({ error: 'Chunk assembly failed' });
        }

        const optimizedPath = await optimizeImage(finalPath);
        return res.json({ 
          url: `/uploads/${path.basename(optimizedPath)}`,
          success: true 
        });
      }
      return res.json({ success: true });
    }

    const optimizedPath = await optimizeImage(req.file.path);
    res.json({ 
      url: `/uploads/${path.basename(optimizedPath)}`,
      success: true 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;