import fs from "fs/promises";
import path from "path";

export const buildLogoPath = (filename?: string) => {
   if (!filename) return null;
   return `/assets/client-logos/${filename}`;
};

export async function removeFileIfExists(relativePath: string | null) {
   if (!relativePath) return;

   try {
      const clean = relativePath.startsWith("/")
         ? relativePath.slice(1)
         : relativePath;

      const absPath = path.join(process.cwd(), clean); // correct full path

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
