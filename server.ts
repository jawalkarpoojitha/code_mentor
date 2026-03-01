import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/minimentor";
const JWT_SECRET = process.env.JWT_SECRET || "mini-mentor-secret-key-123";

// --- MongoDB Models ---

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skillLevel: { type: String, default: 'beginner' },
  preferredLanguage: { type: String, default: 'javascript' },
  learningHistory: [{
    mode: String,
    code: String,
    analysis: mongoose.Schema.Types.Mixed,
    created_at: { type: Date, default: Date.now }
  }],
  mistakeTracking: [{
    concept: String,
    count: { type: Number, default: 1 },
    last_seen: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // In a real app, you might want to exit, but for demo purposes we'll continue
  }

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---

  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password, skillLevel, preferredLanguage } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        skillLevel,
        preferredLanguage
      });
      await user.save();
      
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
      res.json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          skillLevel: user.skillLevel, 
          preferredLanguage: user.preferredLanguage 
        } 
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password" });

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
      res.json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          skillLevel: user.skillLevel, 
          preferredLanguage: user.preferredLanguage 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // --- History & Tracking ---

  app.get("/api/history", authenticateToken, async (req: any, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user.learningHistory.sort((a: any, b: any) => b.created_at - a.created_at).slice(0, 20));
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/history", authenticateToken, async (req: any, res) => {
    const { mode, code, analysis } = req.body;
    try {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          learningHistory: {
            mode,
            code,
            analysis
          }
        }
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/mistakes", authenticateToken, async (req: any, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user.mistakeTracking);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/mistakes", authenticateToken, async (req: any, res) => {
    const { concept } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const mistakeIndex = user.mistakeTracking.findIndex((m: any) => m.concept === concept);
      if (mistakeIndex > -1) {
        user.mistakeTracking[mistakeIndex].count += 1;
        user.mistakeTracking[mistakeIndex].last_seen = new Date();
      } else {
        user.mistakeTracking.push({ concept });
      }
      await user.save();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
