const multer = require('multer');

/**
 * memory storage to store file
 */
const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '');
    }
});

// upload middleware
const uploadMiddleware = multer({storage}).single('image');

module.exports = {
    uploadMiddleware
};