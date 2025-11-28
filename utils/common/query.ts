export const parseListQuery = (query: any) => {
   const page = Math.max(Number(query.page) || 1, 1);
   const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
   const search = query.search?.trim() || "";

   const normalizeDate = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
   };

   const fromDate = query.fromDate
      ? normalizeDate(new Date(query.fromDate))
      : null;

   const toDate = query.toDate ? normalizeDate(new Date(query.toDate)) : null;

   const skip = (page - 1) * limit;

   return { page, limit, search, fromDate, toDate, skip };
};
