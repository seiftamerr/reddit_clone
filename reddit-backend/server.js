import dotenv from "dotenv";
dotenv.config();
console.log("DEBUG ENV CHECK GEMINI:", process.env.GEMINI_API_KEY ? "YES" : "NO");

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import communityRoutes from "./routes/communities.js";

console.log("DEBUG ENV CHECK:", process.env.GROQ_API_KEY ? "GROQ KEY LOADED" : "NO KEY");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://reddit-clone-gamma-livid.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/communities", communityRoutes);

app.get("/", (req, res) => res.send("Backend running!"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));