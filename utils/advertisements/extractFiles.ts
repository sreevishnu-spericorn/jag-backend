export function extractFiles(files: Express.Multer.File[]) {
   const fileMap: Record<string, string[]> = {};

   if (!files) return fileMap;

   for (const file of files) {
      const field = file.fieldname;

      if (!fileMap[field]) {
         fileMap[field] = [];
      }

      fileMap[field].push(`/advertisements/${file.filename}`);
   }

   return fileMap;
}
