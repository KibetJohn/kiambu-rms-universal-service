const multer = require('multer');
const fs = require('fs');

// Ensure the upload directory exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Specify the destination directory for uploaded files
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename for each uploaded file
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Initialize Multer upload middleware
const upload = multer({ storage: storage });

// Middleware function to handle multiple file uploads
const uploadMultiple = upload.array('documents', 10);

module.exports = uploadMultiple;
