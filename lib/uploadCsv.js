const multer = require('multer');
const path = require('path'); 
const fse = require('fs-extra'); 

let csvFilter = (req, file, cb) => {
    if (file.mimetype.includes("csv")) {
        cb(null, true);
    } else {
        cb("Please upload only csv file.", false);
    }
};

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads/"); 

        fse.ensureDir(uploadPath, err => { 
            if (err) {
                console.log("Error ensuring directory exists:", err);
                cb(err, uploadPath);
            } else {
                cb(null, uploadPath);
            }
        });
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-PDSL-${file.originalname}`);
    },
});

const uploadFile = multer({ storage: storage, fileFilter: csvFilter });

module.exports = {
    uploadFile
};