export default class BadRequest extends Error {
   public code?: number | string;
   public statusCode: number;

   constructor(message: string, code: string | number) {
      super(message);
      this.code = code;
      this.statusCode = 400;
      this.name = "BadRequest";
      Object.setPrototypeOf(this, BadRequest.prototype);
   }
}
