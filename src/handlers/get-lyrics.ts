import axios from "axios";
import { Request, Response } from "express";

interface ILrcLibResponseItem {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

interface ILyricsLine {
  seconds: number;
  lyrics: string;
}

async function getLyricsHandler(request: Request, response: Response) {
  const { artist, song } = request.query;

  if (!artist || !song) {
    return response.status(400).json({
      error:
        "The artist and song are query params. But what the hell u expect me to do without them???",
    });
  }

  try {
    const { data: foundLyrics } = await axios.get<ILrcLibResponseItem[]>(
      "https://lrclib.net/api/search",
      {
        params: {
          track_name: song,
          artist_name: artist,
        },
      }
    );

    if (foundLyrics.length === 0) {
      return response.status(404).json({ error: "No lyrics found" });
    }

    const lyric = foundLyrics.at(0);

    const lyricsResponse = lyric?.syncedLyrics
      .split("\n[")
      .map<ILyricsLine>((line) => {
        const formattedTimestamp = line.startsWith("[")
          ? line.slice(line.indexOf("[") + 1, line.indexOf("]"))
          : line.slice(0, line.indexOf("]"));

        const minutes = Number(formattedTimestamp.split(":").at(0));

        const seconds = Number(
          formattedTimestamp.split(":").pop()!.split(".").at(0)
        );

        const timestampInSeconds = minutes * 60 + seconds;

        return {
          lyrics: line.slice(line.indexOf("]") + 2),
          seconds: timestampInSeconds,
        };
      });

    return response.json(lyricsResponse);
  } catch (error: any) {
    console.log(error);

    return response.status(500).json({ error: error.message });
  }
}

export default getLyricsHandler;
