import axios from "axios";
import { JSDOM } from "jsdom";

import ILyricsService, {
  GetSongParams,
  LyricsLine,
} from "../interfaces/lyrics-service";
import { LyricsNotFoundError } from "../errors/errors";

interface IGeniusSearchResponse {
  response: {
    hits: Array<{
      result: {
        id: number;
        path: string;
        api_path: string;
        lyrics_state: string;
      };
    }>;
  };
}

type SearchSongOutput = {
  path: string;
  id: number;
};

class GeniusService implements ILyricsService {
  private async _searchSong(searchTerm: string): Promise<SearchSongOutput> {
    const {
      data: {
        response: { hits },
      },
    } = await axios.get<IGeniusSearchResponse>(
      "https://api.genius.com/search",
      {
        params: {
          q: searchTerm,
        },
        headers: {
          Authorization: `Bearer ${process.env.GENIUS_API_ACCESS_TOKEN}`,
        },
      }
    );

    if (hits.length === 0) {
      throw new LyricsNotFoundError("No lyrics found");
      // TODO: return response.status(404).json({ error: "No lyrics found" });
    }

    const foundSong = hits.at(0);

    if (!foundSong) {
      throw new LyricsNotFoundError("No lyrics found");
    }

    if (foundSong.result?.lyrics_state !== "complete") {
      throw new LyricsNotFoundError("No lyrics found");
    }

    return { path: foundSong.result.path, id: foundSong.result.id };
  }

  private async _getSongDurationInSeconds(songId: number): Promise<number> {
    const { data: applePlayerPage } = await axios.get(
      `https://genius.com/songs/${songId}/apple_music_player`
    );

    const lyricsPageDocument = new JSDOM(applePlayerPage).window.document;

    const remainingTime = JSON.parse(
      lyricsPageDocument
        ?.querySelector("apple-music-player")
        ?.getAttribute("preview_track") ?? '{"duration":0}'
    ).duration;

    return remainingTime;
  }

  public async getSong({ song, artist }: GetSongParams): Promise<LyricsLine[]> {
    const foundSong = await this._searchSong(`${song} | ${artist}`);

    const { data: lyricsPage } = await axios.get(
      "https://genius.com" + foundSong.path,
      {
        headers: {
          Authorization: `Bearer ${process.env.GENIUS_API_ACCESS_TOKEN}`,
        },
      }
    );

    const songDurationInSeconds = await this._getSongDurationInSeconds(
      foundSong.id
    );

    const lyricsPageDocument = new JSDOM(lyricsPage).window.document;

    const lyricsContainerContent = lyricsPageDocument.querySelector(
      "[data-lyrics-container=true]"
    )?.innerHTML;

    if (!lyricsContainerContent) {
      throw new LyricsNotFoundError("No lyrics found");
    }

    const rawLyrics = lyricsContainerContent
      .slice(lyricsContainerContent.lastIndexOf("</div>") + "</div>".length)
      .split("<br>")
      .filter(
        (p) =>
          p.trim() &&
          !p.toLowerCase().includes("verse") &&
          !p.toLowerCase().includes("chorus")
      );

    const lyricsSlicesAmount = songDurationInSeconds / rawLyrics.length;

    const lyricsLines: LyricsLine[] = rawLyrics.map((p, index) => ({
      lyrics: p,
      seconds: index * lyricsSlicesAmount,
    }));

    return lyricsLines;
  }
}

export default GeniusService;
