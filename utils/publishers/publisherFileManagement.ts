import fs from "fs/promises";
import path from "path";

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
      await fs.unlink(absPath);
      console.log("🗑 File removed:", absPath);
   } catch (err: any) {
      if (err.code === "ENOENT") {
         console.warn("⚠ File not found, skipping delete:", relativePath);
      } else {
         console.error("❌ unlink failed:", err);
      }
   }
}
