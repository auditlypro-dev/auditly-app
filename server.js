const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ TEST ROUTE (IMPORTANT)
app.get("/", (req, res) => {
  res.send("Auditly Pro is LIVE 🚀");
});

// ✅ SHOPIFY AUTH START
app.get("/auth", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const redirectUri = `${process.env.HOST}/auth/callback`;

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SCOPES}&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
});

// ✅ SHOPIFY CALLBACK
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const data = await response.json();

    res.send("✅ App successfully installed!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error installing app");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
