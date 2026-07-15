import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware for API requests
  app.use(express.json({ limit: "10mb" }));

  // Load Firebase Config from file
  let firebaseConfig = {};
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load firebase-applet-config.json in server:", err);
  }

  // Initialize Firebase Firestore on the server side (bypasses adblockers!)
  let db: any = null;
  if (Object.keys(firebaseConfig).length > 0) {
    try {
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp);
      console.log("Firebase Firestore successfully initialized on Node.js Server.");
    } catch (err) {
      console.error("Failed to initialize Firebase Firestore on server:", err);
    }
  }

  // Local storage cache on the server filesystem as a fallback
  const DATA_FILE = path.join(process.cwd(), "sandbox_store.json");

  function readLocalCache() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      }
    } catch (err) {
      console.error("Error reading local cache file:", err);
    }
    return {};
  }

  function writeLocalCache(data: any) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing local cache file:", err);
    }
  }

  // API Endpoints for Sandbox Mode
  // 1. Roles
  app.get("/api/sandbox/roles", async (req, res) => {
    try {
      if (db) {
        const docRef = doc(db, "sheetflow_sandbox", "roles");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().list) {
          const list = docSnap.data().list;
          const cache = readLocalCache();
          cache.roles = list;
          writeLocalCache(cache);
          return res.json({ list });
        }
      }
    } catch (err) {
      console.warn("Firebase server-side roles fetch failed, returning cache:", err);
    }
    const cache = readLocalCache();
    res.json({ list: cache.roles || [] });
  });

  app.post("/api/sandbox/roles", async (req, res) => {
    const { list } = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: "Invalid body, list must be an array" });
    }

    const cache = readLocalCache();
    cache.roles = list;
    writeLocalCache(cache);

    try {
      if (db) {
        const docRef = doc(db, "sheetflow_sandbox", "roles");
        await setDoc(docRef, { list, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn("Firebase server-side roles save failed:", err);
    }
    res.json({ success: true });
  });

  // 2. Tasks
  app.get("/api/sandbox/tasks", async (req, res) => {
    try {
      if (db) {
        const docRef = doc(db, "sheetflow_sandbox", "tasks");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().list) {
          const list = docSnap.data().list;
          const cache = readLocalCache();
          cache.tasks = list;
          writeLocalCache(cache);
          return res.json({ list });
        }
      }
    } catch (err) {
      console.warn("Firebase server-side tasks fetch failed, returning cache:", err);
    }
    const cache = readLocalCache();
    res.json({ list: cache.tasks || [] });
  });

  app.post("/api/sandbox/tasks", async (req, res) => {
    const { list } = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: "Invalid body, list must be an array" });
    }

    const cache = readLocalCache();
    cache.tasks = list;
    writeLocalCache(cache);

    try {
      if (db) {
        const docRef = doc(db, "sheetflow_sandbox", "tasks");
        await setDoc(docRef, { list, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn("Firebase server-side tasks save failed:", err);
    }
    res.json({ success: true });
  });

  // 3. Department Mappings
  app.get("/api/sandbox/mappings", async (req, res) => {
    try {
      if (db) {
        const docRef = doc(db, "sheetflow_sandbox", "mappings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().list) {
          const list = docSnap.data().list;
          const cache = readLocalCache();
          cache.mappings = list;
          writeLocalCache(cache);
          return res.json({ list });
        }
      }
    } catch (err) {
      console.warn("Firebase server-side mappings fetch failed, returning cache:", err);
    }
    const cache = readLocalCache();
    res.json({ list: cache.mappings || [] });
  });

  app.post("/api/sandbox/mappings", async (req, res) => {
    const { list } = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: "Invalid body, list must be an array" });
    }

    const cache = readLocalCache();
    cache.mappings = list;
    writeLocalCache(cache);

    try {
      if (db) {
        const docRef = doc(db, "sheetflow_sandbox", "mappings");
        await setDoc(docRef, { list, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn("Firebase server-side mappings save failed:", err);
    }
    res.json({ success: true });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for dev mode, or express.static for prod mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
