const express = require("express");
const fetch = require("node-fetch");

const app = express();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  HOST,
  SCOPES
} = process.env;

// Step 1: Install route
app.get("/auth", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.send("Missing shop parameter");
  }

  const redirectUri = `${HOST}/auth/callback`;

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
});

// Step 2: Callback route
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;

  const tokenRequestUrl = `https://${shop}/admin/oauth/access_token`;

  const response = await fetch(tokenRequestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  const data = await response.json();

  res.send("🎉 Auditly installed successfully!");
});

// Test route
app.get("/", (req, res) => {
  res.send("Auditly is running 🚀");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
