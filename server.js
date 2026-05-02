const express = require("express");
const app = express();

/**
 * Basic health check route
 * This fixes the "Page Not Found" issue
 */
app.get("/", (req, res) => {
  res.send("Auditly Pro is running 🚀");
});

/**
 * Shopify OAuth callback route (placeholder for now)
 * This is required for app installation flow
 */
app.get("/auth/callback", (req, res) => {
  res.send("OAuth callback reached successfully ✅");
});

/**
 * Optional test route
 */
app.get("/status", (req, res) => {
  res.json({ status: "ok", app: "Auditly Pro" });
});

/**
 * Start server
 * Render requires process.env.PORT
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
