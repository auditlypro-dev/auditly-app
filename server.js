const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ LANDING PAGE (INLINE HTML)
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Auditly Pro</title>
<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
  background: #ffffff;
  color: #111827;
}
.container {
  max-width: 1100px;
  margin: auto;
  padding: 40px 20px;
}
.hero {
  text-align: center;
  padding: 100px 20px;
}
h1 { font-size: 48px; margin-bottom: 20px; }
h2 { font-size: 32px; margin-bottom: 20px; }
p { color: #6b7280; }
.btn {
  background: #2563eb;
  color: white;
  padding: 14px 28px;
  border-radius: 8px;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
  font-weight: 600;
}
.section { padding: 80px 0; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
.card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
}
.pricing {
  text-align: center;
  border: 1px solid #e5e7eb;
  padding: 40px;
  border-radius: 10px;
  max-width: 400px;
  margin: auto;
}
</style>
</head>
<body>

<section class="hero">
  <div class="container">
    <h1>Make Your Shopify Store Fully Compliant — Automatically</h1>
    <p>Auditly Pro scans, detects, and fixes compliance issues so your store stays protected and optimized.</p>
    <a href="/auth" class="btn">Install Auditly Pro</a>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>Running a Shopify store shouldn’t feel risky</h2>
    <div class="grid">
      <div class="card">Missing policies</div>
      <div class="card">App conflicts</div>
      <div class="card">Compliance issues</div>
      <div class="card">Performance risks</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>Auditly Pro handles it for you</h2>
    <div class="grid">
      <div class="card">Scans your store</div>
      <div class="card">Finds compliance issues</div>
      <div class="card">AI-powered fixes</div>
      <div class="card">Ongoing monitoring</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <h2>How it works</h2>
    <div class="grid">
      <div class="card">1. Connect your store</div>
      <div class="card">2. Scan for issues</div>
      <div class="card">3. Review fixes</div>
      <div class="card">4. Stay compliant</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="pricing">
      <h2>$27/month</h2>
      <p>Full compliance scanning, AI fixes, and monitoring.</p>
      <a href="/auth" class="btn">Start Now</a>
    </div>
  </div>
</section>

</body>
</html>
  `);
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

    console.log("Access token:", data.access_token);

    res.send("✅ App successfully installed!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error installing app");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
