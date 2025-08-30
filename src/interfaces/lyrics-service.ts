type GetSongParams = {
  song: string;
  artist: string;
};

type LyricsLine = {
  seconds: number;
  lyrics: string;
};

interface ILyricsService {
  getSong(params: GetSongParams): Promise<LyricsLine[]>;
}

export default ILyricsService;
export { GetSongParams, LyricsLine };
