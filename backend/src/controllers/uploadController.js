const path = require('path');
const fs   = require('fs');

// POST /api/upload/image
// Returns URL of uploaded image to store in DB
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const baseUrl  = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    return res.json({ success: true, url: imageUrl, filename: req.file.filename });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// POST /api/upload/images (multiple)
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const urls = req.files.map(f => ({
      url:      `${baseUrl}/uploads/${f.filename}`,
      filename: f.filename,
    }));
    return res.json({ success: true, images: urls });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// DELETE /api/upload/:filename
exports.deleteImage = async (req, res) => {
  try {
    const safeFilename = path.basename(String(req.params.filename || ''));
    if (!safeFilename || safeFilename !== req.params.filename) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const uploadsRoot = path.resolve(__dirname, '../../uploads');
    const filePath = path.resolve(uploadsRoot, safeFilename);
    if (!filePath.startsWith(uploadsRoot + path.sep)) {
      return res.status(400).json({ success: false, message: 'Invalid filename path' });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
};
