import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
app.use(express.json());

// ======================
// ENV VARIABLES
// ======================
const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SCOPES,
  HOST,
  PORT = 3000
} = process.env;

// ======================
// SIMPLE STORAGE (replace with DB later)
// ======================
const sessions = {};

// ======================
// HELPERS
// ======================
function buildInstallUrl(shop) {
  return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${HOST}/auth/callback`;
}

function verifyHmac(query) {
  const { hmac, ...map } = query;

  const message = Object.keys(map)
    .sort()
    .map((key) => `${key}=${map[key]}`)
    .join("&");

  const generated = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return generated === hmac;
}

// ======================
// ROUTES
// ======================

// Home
app.get("/", (req, res) => {
  res.send("Auditly Pro Server Running");
});

// Start OAuth
app.get("/auth", (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const url = buildInstallUrl(shop);
  res.redirect(url);
});

// OAuth callback
app.get("/auth/callback", async (req, res) => {
  const { shop, code, hmac } = req.query;

  if (!verifyHmac(req.query)) {
    return res.status(401).send("HMAC validation failed");
  }

  try {
    const tokenRes = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code
        })
      }
    );

    const tokenData = await tokenRes.json();

    sessions[shop] = {
      accessToken: tokenData.access_token
    };

    // AFTER INSTALL → TRIGGER BILLING
    return res.redirect(`/billing?shop=${shop}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth failed");
  }
});

// ======================
// BILLING ($27/month)
// ======================
app.get("/billing", async (req, res) => {
  const { shop } = req.query;
  const session = sessions[shop];

  if (!session) {
    return res.status(401).send("No session found");
  }

  try {
    const response = await fetch(
      `https://${shop}/admin/api/2023-10/recurring_application_charges.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": session.accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recurring_application_charge: {
            name: "Auditly Pro Plan",
            price: 27.0,
            return_url: `${HOST}/billing/confirm?shop=${shop}`,
            test: false
          }
        })
      }
    );

    const data = await response.json();

    const confirmationUrl = data.recurring_application_charge.confirmation_url;

    return res.redirect(confirmationUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Billing failed");
  }
});

// Billing confirmation
app.get("/billing/confirm", (req, res) => {
  const { shop } = req.query;

  // In production: verify charge status here
  res.send("Billing activated. App is now unlocked for " + shop);
});

// ======================
// EMBEDDED APP ENTRY
// ======================
app.get("/app", (req, res) => {
  const { shop } = req.query;

  if (!sessions[shop]) {
    return res.redirect(`/auth?shop=${shop}`);
  }

  res.send(`
    <html>
      <head>
        <title>Auditly Pro</title>
      </head>
      <body style="font-family: Arial;">
        <h1>Auditly Pro Dashboard</h1>
        <p>Shop: ${shop}</p>
        <p>Status: Active</p>
      </body>
    </html>
  `);
});

// ======================
// COMPLIANCE SCAN (PLACEHOLDER)
// ======================
app.post("/api/scan", (req, res) => {
  const { shop } = req.body;

  if (!sessions[shop]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    status: "ok",
    issues: [
      "Missing privacy policy link",
      "Unoptimized homepage SEO title"
    ],
    score: 72
  });
});

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {
  console.log(`Auditly Pro running on port ${PORT}`);
});
