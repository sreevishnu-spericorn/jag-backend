// types/swagger-jsdoc.d.ts
declare module 'swagger-jsdoc' {
    import type { OpenAPIV3 } from 'openapi-types';
  
    export interface Options {
      definition: OpenAPIV3.Document;
      apis: string[];
    }
  
    export interface SwaggerSpec extends OpenAPIV3.Document {}
  
    function swaggerJsdoc(options: Options): SwaggerSpec | Promise<SwaggerSpec>;
  
    export default swaggerJsdoc;
  }
  