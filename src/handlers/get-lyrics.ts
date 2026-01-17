import { Request, Response } from "express";

import LrcLibService from "../services/lrclib-service";
import { LyricsLine } from "../interfaces/lyrics-service";
import { LyricsNotFoundError } from "../errors/errors";
import GeniusService from "../services/genius-service";
import { AxiosError } from "axios";

async function getLyricsHandler(request: Request, response: Response) {
  const { artist, song } = request.query as { song: string; artist: string };

  if (!artist || !song) {
    return response.status(400).json({
      error:
        "The artist and song are query params. But what the hell u expect me to do without them???",
    });
  }

  let lyricsResponse: LyricsLine[] | undefined;

  const fetchers: Array<() => Promise<LyricsLine[]>> = [];

  fetchers.push(
    ...[
      () =>
        new LrcLibService().getSong({
          song,
          artist,
        }),
      () =>
        new GeniusService().getSong({
          song,
          artist,
        }),
    ],
  );

  const fetchErrors: any[] = [];

  for (const fetch of fetchers) {
    try {
      lyricsResponse = await fetch();
      break;
    } catch (error: any) {
      fetchErrors.push(error);

      if (error instanceof LyricsNotFoundError) {
        continue;
      }
    }
  }

  if (!lyricsResponse) {
    console.error(
      "ERRORS:\n" +
        JSON.stringify(
          fetchErrors.map((p) => ({
            message: p.message,
            code: p.code,
            axios:
              p instanceof AxiosError
                ? {
                    request: {
                      method: p.request.method,
                      url: p.config?.url + p.request.path,
                    },
                    response: {
                      status: p.response?.status,
                      data: p.response?.data,
                    },
                  }
                : {},
          })),
          null,
          2,
        ),
    );

    return response.status(500).json({ error: fetchErrors.at(-1).message });
  }

  return response.json(lyricsResponse);
}
export default getLyricsHandler;
