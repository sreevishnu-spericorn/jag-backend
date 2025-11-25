import express, { Application, Request, Response } from "express";
import apiRouter from "./routes/routes.ts";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger-config.ts";
import swaggerAuth from "./middleware/swaggarAuth.ts";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app: Application = express();

app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));
app.use("/", express.static("public"));

app.use(
   "/api-docs",
   swaggerAuth,
   swaggerUi.serve,
   swaggerUi.setup(swaggerSpec, {
      swaggerOptions: { persistAuthorization: true },
   })
);

app.use(
   cors({
      origin: "http://localhost:3000",
      credentials: true,
   })
);

app.use(cookieParser());

app.use("/api", apiRouter);

app.get("/", (req: Request, res: Response) => {
   res.send("Vehicle Rental Platform API is running");
});

export default app;