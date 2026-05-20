import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// =======================
// Health Check Route
// =======================
app.get("/", (req, res) => {
  res.send("Auditly Pro server is running 🚀");
});

// =======================
// Shopify OAuth Start
// =======================
app.get("/auth", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const installUrl =
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}&` +
    `scope=${process.env.SHOPIFY_SCOPES}&` +
    `redirect_uri=${process.env.SHOPIFY_REDIRECT_URI}`;

  res.redirect(installUrl);
});

// =======================
// OAuth Callback
// =======================
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing required parameters");
  }

  try {
    const response = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    const data = await response.json();

    req.session.accessToken = data.access_token;
    req.session.shop = shop;

    // Redirect into embedded app
    res.redirect(`/?shop=${shop}`);
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("OAuth failed");
  }
});

// =======================
// Example Protected API Route
// =======================
app.get("/api/data", (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).send("Not authenticated");
  }

  res.json({
    message: "Secure data from Auditly Pro",
    shop: req.session.shop,
  });
});

// =======================
// Start Server
// =======================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
