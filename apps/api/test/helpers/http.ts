import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";

export function mockReq(body = ""): IncomingMessage {
  const stream = new Readable({ read() {} });
  stream.push(body);
  stream.push(null);
  return stream as unknown as IncomingMessage;
}

type MockRes = ServerResponse & { statusCode: number; body(): unknown };

export function mockRes(): MockRes {
  let status = 0;
  let rawBody = "";

  const res = {
    statusCode: 0,
    setHeader() {},
    writeHead(s: number) {
      status = s;
      res.statusCode = s;
    },
    end(data: string) {
      rawBody = data;
    },
    body() {
      return JSON.parse(rawBody);
    },
  };

  return res as unknown as MockRes;
}
