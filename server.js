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
*/app.get("/auth", (req, res) => {
  console.log("✅ AUTH ROUTE HIT");
console.log("Shop:", req.query.shop);
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const state = Math.random().toString(36).substring(2, 15);

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&state=${state}` +
    `&redirect_uri=${HOST}/auth/callback`;

  res.redirect(installUrl);
});


/*
========================================
*/
app.get("/auth/callback", async (req, res) => {
  try {
    const { shop, code, hmac, state } = req.query;

    // 1. Validate required params
    if (!shop || !code || !hmac || !state) {
      console.error("Missing OAuth params:", req.query);
      return res.status(400).send("Missing required parameters");
    }

    // 2. Validate env vars
    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      console.error("Missing Shopify credentials in env");
      return res.status(500).send("Server misconfigured");
    }

    // 3. OPTIONAL BUT IMPORTANT: verify HMAC (security)
    const crypto = await import("crypto");

    const map = { ...req.query };
    delete map.hmac;

    const message = Object.keys(map)
      .sort()
      .map((key) => `${key}=${map[key]}`)
      .join("&");

    const generatedHash = crypto
      .createHmac("sha256", SHOPIFY_API_SECRET)
      .update(message)
      .digest("hex");

    if (generatedHash !== hmac) {
      console.error("HMAC validation failed");
      return res.status(401).send("Invalid HMAC signature");
    }

    // 4. Exchange code for access token
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
      console.error("Token error:", tokenData);
      return res.status(500).send("Failed to retrieve access token");
    }

    console.log("ACCESS TOKEN RECEIVED:", tokenData.access_token);

    // 5. STORE TOKEN (temporary in memory for now)
    global.shopTokens = global.shopTokens || {};
    global.shopTokens[shop] = tokenData.access_token;

    // 6. Redirect to app
    res.redirect(`/?shop=${shop}`);

  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth failed");
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
