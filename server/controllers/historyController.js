const ScanResult = require("../models/ScanResult");

exports.getHistory = async (req, res) => {
  try {
    const scans = await ScanResult.find({}, "url domain modules status createdAt")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(scans);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteScan = async (req, res) => {
  try {
    await ScanResult.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
