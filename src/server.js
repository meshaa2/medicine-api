const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Medicine Inventory & Expiry Tracking API",
    version: "1.0.0",
    endpoints: [
      "GET /health",
      "GET /medicines",
      "GET /medicines/:id",
      "GET /medicines/:id/batches",
      "GET /medicines/low-stock",
      "GET /medicines/expiring-soon",
      "GET /medicines/expiry-summary",
      "GET /transactions",
      "GET /transactions/:id",
    ],
  });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/", require("./routes"));

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" },
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
