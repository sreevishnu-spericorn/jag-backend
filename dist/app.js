import express from "express";
import apiRouter from "./routes/routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger-config";
import swaggerAuth from "./middleware/swaggarAuth";
const app = express();
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));
app.use("/", express.static("public"));
// Swagger
app.use("/api-docs", swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { persistAuthorization: true },
}));
// API routes
app.use("/api", apiRouter);
// Default route
app.get("/", (_req, res) => {
    res.send("Vehicle Rental Platform API is running");
});
export default app;
//# sourceMappingURL=app.js.map