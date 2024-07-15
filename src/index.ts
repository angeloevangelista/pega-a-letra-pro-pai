import cors from "cors";
import https from "https";
import axios from "axios";
import express from "express";

const app = express();

app.use(cors());

app.get("/api/health", (request, response) => response.json({ ok: true }));

app.get("/api/lyrics", async (request, response) => {
  const { artist, song } = request.query;

  try {
    const lyricsResponse = await axios.get("https://api.textyl.co/api/lyrics", {
      params: {
        q: `${artist} ${song}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    return response.json(lyricsResponse.data);
  } catch (error: any) {
    console.log(error);

    return response.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3333);
