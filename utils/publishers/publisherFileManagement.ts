import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import BadRequest from "../../helper/exception/badRequest.ts";

export const buildPublisherLogoPath = (filename?: string | null) => {
   if (!filename) return null;
   return `/assets/publishers/${filename}`;
};

export const buildPublisherW9Paths = (filenames?: string[] | null) => {
   if (!filenames || !filenames.length) return [];
   return filenames.map((f) => `/assets/publishers/${f}`);
};

export async function removeFileIfExists(relativePath: string | null) {
   if (!relativePath) return;
   try {
      const clean = relativePath.startsWith("/")
         ? relativePath.slice(1)
         : relativePath;
      const absPath = path.join(process.cwd(), clean);
      await fsp.unlink(absPath);
      console.log("🗑 File removed:", absPath);
   } catch (err: any) {
      if (err.code === "ENOENT") {
         console.warn("⚠ File not found, skipping delete:", relativePath);
      } else {
         console.error("❌ unlink failed:", err);
      }
   }
}

export function safeJsonArray(value: any) {
   try {
      if (!value) return [];
      if (typeof value === "string") {
         const parsed = JSON.parse(value);
         return Array.isArray(parsed) ? parsed : [];
      }
      return Array.isArray(value) ? value : [];
   } catch {
      throw new BadRequest("Invalid JSON array payload", "INVALID_PAYLOAD");
   }
}

export function filenameStartsWithSlash(p: string) {
   return typeof p === "string" && p.startsWith("/");
}


export async function removePathIfExists(filePath: string) {
   try {
      const file = filenameStartsWithSlash(filePath)
         ? filePath.slice(1)
         : filePath;

      const fullPath = path.join(process.cwd(), "public", file);
      if (fs.existsSync(fullPath)) {
         await fs.promises.unlink(fullPath);
      }
   } catch (err) {
      console.error("File deletion error:", filePath, err);
   }
}
