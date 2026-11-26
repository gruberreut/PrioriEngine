// swagger-ui-dist ships no types, and @types/swagger-ui-dist covers v3 only
// (we use v5). Declares just what routes/docs.ts uses.
declare module "swagger-ui-dist" {
  const swaggerUiDist: {
    /** Absolute path to the package's static Swagger UI files. */
    absolutePath(): string;
  };
  export default swaggerUiDist;
}
