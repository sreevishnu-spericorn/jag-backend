// config/swagger-config.ts
import swaggerJsdoc, { Options } from "swagger-jsdoc";

const options: Options = {
   definition: {
      openapi: "3.0.0",
      info: {
         title: "API Documentations",
         version: "1.0.0",
         description: "These are the API documentation for the web app side.",
      },
      components: {
         securitySchemes: {
            bearerAuth: {
               type: "http",
               scheme: "bearer",
               bearerFormat: "JWT",
            },
         },
      },
      security: [{ bearerAuth: [] }],
      paths: {},
   },
   apis: ["./api/**/*.ts"], // change to .ts for TypeScript files
};

const swaggerSpec = await swaggerJsdoc(options);

export default swaggerSpec;
