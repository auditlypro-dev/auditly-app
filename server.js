import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// --------------------
// FIX __dirname (ESM safe)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// MIDDLEWARE
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// SIMPLE IN-MEMORY STORE (temporary)
// --------------------
const storeSessions = {};

// --------------------
// HEALTH CHECK
// --------------------
app.get("/", (req, res) => {
  res.send("Auditly Pro Server Running 🚀");
});

// --------------------
// SHOPIFY INSTALL / OAUTH START
// --------------------
app.get("/auth", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const redirectUri = `${process.env.HOST}/auth/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${process.env.SCOPES}` +
    `&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
});

// --------------------
// OAUTH CALLBACK
// --------------------
app.get("/auth/callback", (req, res) => {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing OAuth parameters");
  }

  // TEMP SESSION STORAGE (replace with DB later)
  storeSessions[shop] = {
    accessToken: "pending",
    billingActive: false
  };

  // redirect to billing step
  res.redirect(`/billing?shop=${shop}`);
});

// --------------------
// BILLING ROUTE (SAFE VERSION)
// --------------------
app.get("/billing", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  // Founder bypass (your store)
  if (shop.includes("voltridge")) {
    storeSessions[shop].billingActive = true;
    return res.redirect(`/app?shop=${shop}`);
  }

  // TEMP: simulate billing approval
  // (real Shopify billing API will replace this next step)
  storeSessions[shop].billingActive = true;

  res.redirect(`/app?shop=${shop}`);
});

// --------------------
// BILLING PROTECTION MIDDLEWARE
// --------------------
function requireBilling(req, res, next) {
  const shop = req.query.shop;

  if (!shop || !storeSessions[shop]) {
    return res.redirect("/auth");
  }

  if (!storeSessions[shop].billingActive) {
    return res.redirect(`/billing?shop=${shop}`);
  }

  next();
}

// --------------------
// EMBEDDED APP DASHBOARD
// --------------------
app.get("/app", requireBilling, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

// --------------------
// API: COMPLIANCE SCAN (SIMPLE VERSION)
// --------------------
app.get("/api/scan", requireBilling, (req, res) => {
  res.json({
    success: true,
    score: 92,
    issues: [
      "Missing privacy policy",
      "SEO title missing on homepage",
      "No refund policy detected"
    ],
    recommendations: [
      "Add privacy policy page",
      "Improve homepage SEO metadata",
      "Add refund/return policy"
    ]
  });
});

// --------------------
// SERVE FRONTEND (React build)
// --------------------
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`Auditly Pro running on port ${PORT}`);
});
