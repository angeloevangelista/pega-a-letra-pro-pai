import cors from "cors";
import https from "https";
import axios from "axios";
import express from "express";

const app = express();

app.use(cors());

app.get("/api/health", (request, response) => response.json({ ok: true }));

app.get("/api/lyrics", async (request, response) => {
  const { artist = "", song = "" } = request.query as {
    [key: string]: string | undefined;
  };

  if (!artist || !song) {
    return response.status(400).json({
      error:
        "The artist and song are query params. But what the hell u expect me to do without them???",
    });
  }

  const possibilities = [
    {
      artist,
      song,
    },
    {
      artist:
        artist.slice(
          0,
          artist.indexOf("(") != 1 ? artist.indexOf("(") - 1 : 0
        ) ?? "",
      song:
        song.slice(0, song.indexOf("(") != 1 ? song.indexOf("(") - 1 : 0) ?? "",
    },
  ];

  const requests = possibilities.map((p) =>
    axios.get("https://api.textyl.co/api/lyrics", {
      params: {
        q: `${p.artist} ${p.song}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    })
  );

  try {
    const lyricsResponse = await Promise.any(requests);

    return response.json(lyricsResponse.data);
  } catch (error: any) {
    console.log(error);

    return response.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3333);
