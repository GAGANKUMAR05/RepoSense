import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (!file.originalname.toLowerCase().endsWith(".zip")) return callback(new Error("Only ZIP archives are supported"));
        callback(null, true);
    }
});

export default upload
