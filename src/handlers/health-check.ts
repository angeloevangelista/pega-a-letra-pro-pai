import { Request, Response } from "express";

function healthCheckHandler(request: Request, response: Response) {
  return response.status(200).json({
    ok: true,
  });
}

export default healthCheckHandler;
