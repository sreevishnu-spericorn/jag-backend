import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import fs from "fs";

const PUB_ASSETS_DIR = "public/assets/publishers";

// ensure directory exists
if (!fs.existsSync(PUB_ASSETS_DIR)) {
   fs.mkdirSync(PUB_ASSETS_DIR, { recursive: true });
}
console.log('git')

const storage = multer.diskStorage({
   destination: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, PUB_ASSETS_DIR); // relative path
   },
   filename: (req: Request, file: Express.Multer.File, cb) => {
      const safeName = Date.now() + "-" + file.originalname.replace(/\s/g, "");
      cb(null, safeName);
   },
});

const upload = multer({
   storage,
   fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
      const allowed = [
         "image/png",
         "image/jpeg",
         "image/jpg",
         "application/pdf",
      ];
      if (!allowed.includes(file.mimetype)) {
         return cb(new Error("Invalid file type"));
      }
      cb(null, true);
   },
});

export default upload;
