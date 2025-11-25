import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, "public/assets/client-logos");
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, ""));
  },
});

const upload = multer({
  storage,
  fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

export default upload;