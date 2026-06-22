import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

/*
========================================
STARTUP DEBUG
========================================
*/
console.log("========================================");
console.log("AUDITLY PRO STARTUP DEBUG");
console.log("========================================");
console.log("API KEY EXISTS:", !!process.env.SHOPIFY_API_KEY);
console.log("API SECRET EXISTS:", !!process.env.SHOPIFY_API_SECRET);
console.log("HOST:", process.env.HOST);
console.log("SCOPES:", process.env.SCOPES);
console.log("========================================");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SCOPES,
  HOST,
} = process.env;

/*
========================================
HEALTH CHECK
========================================
*/
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Auditly Pro</title>
      </head>
      <body style="font-family:sans-serif;padding:40px;">
        <h1>🚀 Auditly Pro Server Running</h1>
        <p>Shopify Compliance & Optimization Platform</p>
      </body>
    </html>
  `);
});

/*
========================================
SHOPIFY AUTH
========================================
*/
app.get("/auth", (req, res) => {
  const shop = req.query.shop;

  if (!shop) return res.status(400).send("Missing shop parameter");

  if (!shop.endsWith(".myshopify.com")) {
    return res.status(400).send("Invalid shop");
  }

  const redirectUri = `${HOST}/auth/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  console.log("INSTALL URL:", installUrl);

  res.redirect(installUrl);
});

/*
========================================
OAUTH CALLBACK
========================================
*/
app.get("/auth/callback", async (req, res) => {
  try {
    const { shop, code } = req.query;

    if (!shop || !code) {
      return res.status(400).send("Missing required parameters");
    }

    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("TOKEN ERROR:", tokenData);
      return res.status(500).send("Failed to retrieve access token");
    }

    console.log("ACCESS TOKEN RECEIVED");
    console.log(tokenData.access_token);

    res.redirect(`/?shop=${shop}`);
  } catch (err) {
    console.error("AUTH CALLBACK ERROR:", err);
    res.status(500).send("OAuth callback failed");
  }
});

/*
========================================
API STATUS
========================================
*/
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    app: "Auditly Pro",
    status: "running",
  });
});

/*
========================================
BILLING PLACEHOLDER
========================================
*/
app.get("/billing", (req, res) => {
  res.send("Billing endpoint coming soon 🚀");
});

/*
========================================
START SERVER
========================================
*/
app.listen(PORT, () => {
  console.log(`
========================================
🚀 Auditly Pro Running
========================================
PORT: ${PORT}
HOST: ${HOST}
========================================
`);
});
