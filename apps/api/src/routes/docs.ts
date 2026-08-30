import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUiDist from "swagger-ui-dist";
import { setCorsHeaders } from "../lib/http.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPENAPI_PATH = resolve(__dirname, "../../openapi.yaml");
const SWAGGER_UI_PATH = swaggerUiDist.absolutePath();

const SWAGGER_INITIALIZER = `window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: "/openapi.yaml",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: "StandaloneLayout",
  });
};
`;

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".map": "application/json",
};

function send(res: ServerResponse, status: number, contentType: string, body: string | Buffer): void {
  setCorsHeaders(res);
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

export function createDocsHandler() {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    method: string
  ): Promise<boolean> => {
    if (method !== "GET") return false;

    if (pathname === "/openapi.yaml") {
      const spec = await readFile(OPENAPI_PATH, "utf8");
      send(res, 200, "application/yaml", spec);
      return true;
    }

    if (pathname === "/docs") {
      setCorsHeaders(res);
      res.writeHead(302, { Location: "/docs/" });
      res.end();
      return true;
    }

    if (pathname === "/docs/") {
      const html = await readFile(join(SWAGGER_UI_PATH, "index.html"), "utf8");
      send(res, 200, "text/html", html);
      return true;
    }

    if (pathname === "/docs/swagger-initializer.js") {
      send(res, 200, "application/javascript", SWAGGER_INITIALIZER);
      return true;
    }

    if (pathname.startsWith("/docs/")) {
      const file = pathname.slice("/docs/".length);
      const contentType = CONTENT_TYPES[extname(file)];
      if (!contentType) return false;
      const filePath = join(SWAGGER_UI_PATH, file);
      if (!filePath.startsWith(SWAGGER_UI_PATH)) return false;
      try {
        const data = await readFile(filePath);
        send(res, 200, contentType, data);
      } catch {
        return false;
      }
      return true;
    }

    return false;
  };
}
