const mongoose = require("mongoose");

const ScanResultSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    domain: { type: String, required: true },
    modules: [String],
    results: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["running", "complete", "error"], default: "running" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScanResult", ScanResultSchema);
