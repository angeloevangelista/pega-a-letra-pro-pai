import { Request, Response } from "express";

import LrcLibService from "../services/lrclib-service";
import { LyricsLine } from "../interfaces/lyrics-service";
import { LyricsNotFoundError } from "../errors/errors";
import GeniusService from "../services/genius-service";

async function getLyricsHandler(request: Request, response: Response) {
  const { artist, song } = request.query as { song: string; artist: string };

  if (!artist || !song) {
    return response.status(400).json({
      error:
        "The artist and song are query params. But what the hell u expect me to do without them???",
    });
  }

  let lyricsResponse: LyricsLine[] = [];

  try {
    const lyricsLines = await new LrcLibService().getSong({
      song,
      artist,
    });

    lyricsResponse = lyricsLines;
  } catch (error: any) {
    if (!(error instanceof LyricsNotFoundError)) {
      console.log(error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (lyricsResponse.length === 0) {
    try {
      const lyricsLines = await new GeniusService().getSong({
        song,
        artist,
      });

      lyricsResponse = lyricsLines;
    } catch (error: any) {
      console.log(error);
      return response.status(500).json({ error: error.message });
    }
  }

  return response.json(lyricsResponse);
}

export default getLyricsHandler;
