import axios from "axios";

import ILyricsService, {
  GetSongParams,
  LyricsLine,
} from "../interfaces/lyrics-service";

import { LyricsNotFoundError } from "../errors/errors";

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

class LrcLibService implements ILyricsService {
  public async getSong({ song, artist }: GetSongParams): Promise<LyricsLine[]> {
    let foundLyrics: ILrcLibResponseItem[] | undefined = [];

    const paramsTries = [
      {
        track_name: song,
        artist_name: artist,
      },
      {
        track_name: song,
      },
    ];

    for (const paramsTry of paramsTries) {
      try {
        const { data } = await axios.get<ILrcLibResponseItem[]>(
          "https://lrclib.net/api/search",
          {
            params: paramsTry,
          },
        );

        console.log(paramsTry);

        if (data.length === 0 || !data.some((p) => p.syncedLyrics)) {
          continue;
        }

        foundLyrics = data;
        break;
      } catch (error: any) {}
    }

    if (!foundLyrics || foundLyrics.length === 0) {
      throw new LyricsNotFoundError("No lyrics found");
    }

    const lyric = foundLyrics.find((p) => p.syncedLyrics);

    if (!lyric || !lyric.syncedLyrics) {
      throw new LyricsNotFoundError("No lyrics found");
    }

    const lyricsResponse = lyric.syncedLyrics.split("\n").map((line) => {
      const formattedTimestamp = line.slice(
        line.indexOf("[") + 1,
        line.indexOf("]"),
      );

      const minutes = Number(formattedTimestamp.split(":").at(0));

      const seconds = Number(
        formattedTimestamp.split(":").pop()!.split(".").at(0),
      );

      const timestampInSeconds = minutes * 60 + seconds;

      return {
        lyrics: line.slice(line.indexOf("]") + 1).trim(),
        seconds: timestampInSeconds,
      };
    });

    return lyricsResponse;
  }
}

export default LrcLibService;
