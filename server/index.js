const path    = require("path");
const dotenv  = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");

const app  = express();
const PORT = process.env.PORT || 5000;

console.log("🔑 ENV check:");
console.log("   VIRUSTOTAL_API_KEY :", process.env.VIRUSTOTAL_API_KEY ? process.env.VIRUSTOTAL_API_KEY.slice(0,6)+"..." : "❌ NOT SET");
console.log("   URLSCAN_API_KEY    :", process.env.URLSCAN_API_KEY    ? process.env.URLSCAN_API_KEY.slice(0,6)+"..."    : "❌ NOT SET");
console.log("   MONGO_URI          :", process.env.MONGO_URI           ? "✅ SET" : "⚠️  NOT SET (History disabled)");

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/recatron")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.warn("⚠️  MongoDB not connected (scans still work):", err.message));

app.use("/api/scan",    require("./routes/scan"));
app.use("/api/dorks",   require("./routes/dorks"));
app.use("/api/history", require("./routes/history"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "online", version: "1.0.0", name: "Recatron API",
    keys: {
      virustotal: !!process.env.VIRUSTOTAL_API_KEY,
      urlscan:    !!process.env.URLSCAN_API_KEY,
      mongodb:    !!process.env.MONGO_URI,
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Recatron server running on http://localhost:${PORT}`);
});
