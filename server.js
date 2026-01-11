import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import animeApi from "@justalk/anime-api";

const app = express();
const cache = new NodeCache({ stdTTL: 600 });

app.use(cors());
app.use(express.json());

// Rate-limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests, slow down" }
});
app.use("/api/", limiter);

// API Key middleware
app.use("/api", (req, res, next) => {
  if(req.query.key !== process.env.API_KEY){
    return res.status(403).json({ error: "Invalid API Key" });
  }
  next();
});

// Stream endpoint
app.get("/api/stream", async (req, res) => {
  const { name, ep } = req.query;
  if(!name || !ep) return res.status(400).json({ error: "Missing name or episode" });

  const cacheKey = `${name}-${ep}`;
  if(cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const data = await animeApi.stream(name, Number(ep));
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stream" });
  }
});

// Health check
app.get("/", (req,res)=> res.send("Anime API running 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
