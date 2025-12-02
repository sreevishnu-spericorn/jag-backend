import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import fs from "fs";
import path from "path";

// Ensure folder exists
const uploadPath = "public/assets/advertisements";
if (!fs.existsSync(uploadPath)) {
   fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
   destination: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, uploadPath);
   },

   filename: (req: Request, file: Express.Multer.File, cb) => {
      const unique = Date.now();
      const cleanName = file.originalname.replace(/\s/g, "");
      cb(null, `${unique}-${cleanName}`);
   },
});

const uploadAdvertisement = multer({
   storage,
   fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {

      const allowed = [
         "image/png",
         "image/jpeg",
         "image/jpg",
         "image/webp",
         "video/mp4",
         "application/pdf",
         "application/msword",
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowed.includes(file.mimetype)) {
         return cb(new Error("Unsupported file type"));
      }

      cb(null, true);
   },
});

export default uploadAdvertisement;
