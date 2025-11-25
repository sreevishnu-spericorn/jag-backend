import { Request, Response, NextFunction } from "express";
import basicAuth from "express-basic-auth";

export function swaggerAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "staging"
  ) {
    basicAuth({
      users: { prodSwagger: process.env.SWAGGER_PASSWORD as string },
      challenge: true,
    })(req, res, next);
  } else {
    next();
  }
}

export default swaggerAuth;
