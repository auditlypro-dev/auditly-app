import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// --------------------
// BASIC HEALTH CHECK
// --------------------
app.get("/", (req, res) => {
  res.send("Auditly Pro Backend Running 🚀");
});

// --------------------
// SHOPIFY AUTH PLACEHOLDER (we expand later)
// --------------------
app.get("/auth", (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.redirect("/auth");
}
  res.sendFile(
    path.join(__dirname, "frontend/dist/index.html")
  );const redirectUrl =
    `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=read_products,write_products` +
    `&redirect_uri=${process.env.HOST}/auth/callback`;

  res.redirect(redirectUrl);
});

app.get("/auth/callback", (req, res) => {
  res.send("OAuth callback working ✅ (next step: token exchange)");
});

// --------------------
// SERVE FRONTEND BUILD
// --------------------
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

// --------------------
app.listen(PORT, () => {
  console.log(`Auditly Pro running on port ${PORT}`);
});
