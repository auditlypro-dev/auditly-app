import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();console.log("API KEY EXISTS:", !!process.env.SHOPIFY_API_KEY);
console.log("HOST:", process.env.HOST);
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
SHOPIFY INSTALL ROUTE
========================================
*/

app.get("/auth", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  // basic validation
  if (!shop.endsWith(".myshopify.com")) {
    return res.status(400).send("Invalid shop");
  }

  const redirectUri = `${HOST}/auth/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  console.log("SHOP INSTALL URL:");
  console.log(installUrl);

  res.redirect(installUrl);
});

/*
========================================
SHOPIFY OAUTH CALLBACK
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    console.log("SHOPIFY TOKEN RESPONSE:");
    console.log(tokenData);

    if (!tokenData.access_token) {
      return res.status(500).send("Failed to retrieve access token");
    }

    const accessToken = tokenData.access_token;

    /*
    ========================================
    STORE TOKEN HERE (DB LATER)
    ========================================
    */

    console.log("ACCESS TOKEN:");
    console.log(accessToken);

    /*
    ========================================
    REDIRECT TO EMBEDDED APP
    ========================================
    */

    res.redirect(`/?shop=${shop}`);
  } catch (error) {
    console.error("AUTH CALLBACK ERROR:");
    console.error(error);

    res.status(500).send("OAuth callback failed");
  }
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
API TEST ROUTE
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
