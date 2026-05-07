const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 10000;

// ======================================
// HOME PAGE
// ======================================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Auditly Pro</title>
<style>
body {
  font-family: Arial;
  margin: 0;
  background: #f6f7fb;
  color: #111;
}
.hero {
  padding: 100px 20px;
  text-align: center;
  background: white;
}
.hero h1 {
  font-size: 48px;
}
.hero p {
  color: #666;
  max-width: 700px;
  margin: auto;
}
.btn {
  display: inline-block;
  margin-top: 30px;
  padding: 14px 28px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 8px;
}
.section {
  padding: 60px 20px;
  max-width: 1000px;
  margin: auto;
}
.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 15px;
}
</style>
</head>
<body>

<div class="hero">
  <h1>Auditly Pro</h1>
  <p>AI-powered Shopify compliance + optimization scanner</p>
  <a class="btn" href="/install">Install App</a>
</div>

<div class="section">
  <div class="card">✔ Compliance scanning</div>
  <div class="card">✔ Product optimization analysis</div>
  <div class="card">✔ SEO + trust audits</div>
</div>

</body>
</html>
  `);
});

// ======================================
// INSTALL PAGE
// ======================================
app.get("/install", (req, res) => {
  res.send(`
    <form action="/auth" style="padding:40px;font-family:Arial;">
      <h2>Install Auditly Pro</h2>
      <input name="shop" placeholder="your-store.myshopify.com" style="padding:10px;width:300px;" />
      <button type="submit" style="padding:10px 20px;margin-left:10px;">
        Continue
      </button>
    </form>
  `);
});

// ======================================
// START OAUTH
// ======================================
app.get("/auth", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const redirectUri = `${process.env.HOST}/auth/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${process.env.SCOPES}` +
    `&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
});

// ======================================
// OAUTH CALLBACK
// ======================================
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing OAuth parameters");
  }

  try {
    const response = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })
      }
    );

    const data = await response.json();

    global.shopifyStore = {
      shop,
      accessToken: data.access_token
    };

    res.redirect(`/scan?shop=${shop}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth failed");
  }
});

// ======================================
// COMPLIANCE SCANNER
// ======================================
app.get("/scan", async (req, res) => {
  const shop = req.query.shop;

  if (!global.shopifyStore || global.shopifyStore.shop !== shop) {
    return res.status(400).send("Store not authenticated");
  }

  const accessToken = global.shopifyStore.accessToken;

  try {
    // GET PRODUCTS
    const productRes = await fetch(
      `https://${shop}/admin/api/2024-01/products.json?limit=20`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken
        }
      }
    );

    const productData = await productRes.json();

    // GET POLICIES
    const policyRes = await fetch(
      `https://${shop}/admin/api/2024-01/policies.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken
        }
      }
    );

    const policyData = await policyRes.json();

    const issues = [];

    // POLICY CHECK
    if (!policyData.policies || policyData.policies.length === 0) {
      issues.push("Missing store policies");
    }

    // PRODUCT CHECKS
    productData.products.forEach(p => {
      if (!p.body_html || p.body_html.length < 100) {
        issues.push(`Weak description: ${p.title}`);
      }

      if (!p.images || p.images.length === 0) {
        issues.push(`No images: ${p.title}`);
      }
    });

    const score = Math.max(0, 100 - issues.length * 5);

    res.send(`
      <h1>Auditly Pro Report</h1>
      <h2>Score: ${score}/100</h2>
      <h3>Issues</h3>
      <ul>
        ${issues.map(i => `<li>${i}</li>`).join("")}
      </ul>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Scan failed");
  }
});

// ======================================
// START SERVER
// ======================================
app.listen(PORT, () => {
  console.log(`Auditly Pro running on port ${PORT}`);
});
