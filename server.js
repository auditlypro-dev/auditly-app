const express = require("express");
const fetch = require("node-fetch");

const app = express();

const PORT = process.env.PORT || 10000;

// ==========================================
// TEMP STORE MEMORY
// ==========================================
global.shopifyStore = {};

// ==========================================
// HOME PAGE
// ==========================================
app.get("/", (req, res) => {

  res.send(`
<!DOCTYPE html>
<html>

<head>

<title>Auditly Pro</title>

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>

body{
  margin:0;
  font-family:Arial,sans-serif;
  background:#f5f7fb;
  color:#111827;
}

.hero{
  background:white;
  padding:100px 20px;
  text-align:center;
}

.hero h1{
  font-size:56px;
  margin-bottom:20px;
}

.hero p{
  max-width:700px;
  margin:auto;
  font-size:20px;
  color:#6b7280;
}

.button{
  display:inline-block;
  margin-top:35px;
  padding:16px 30px;
  background:#2563eb;
  color:white;
  text-decoration:none;
  border-radius:10px;
  font-size:18px;
  font-weight:bold;
}

.section{
  max-width:1100px;
  margin:auto;
  padding:80px 20px;
}

.grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:20px;
}

.card{
  background:white;
  padding:30px;
  border-radius:16px;
  box-shadow:0 2px 10px rgba(0,0,0,0.05);
}

.card h3{
  margin-top:0;
}

.pricing{
  max-width:500px;
  margin:60px auto;
  background:white;
  padding:50px;
  border-radius:20px;
  text-align:center;
}

.price{
  font-size:64px;
  color:#2563eb;
  font-weight:bold;
}

.footer{
  text-align:center;
  padding:40px;
  color:#6b7280;
}

</style>

</head>

<body>

<div class="hero">

  <h1>Auditly Pro</h1>

  <p>
    AI-powered Shopify compliance and optimization platform.
    Detect policy gaps, SEO weaknesses, trust issues,
    and store optimization problems automatically.
  </p>

  <a class="button" href="/install">
    Install Auditly Pro
  </a>

</div>

<div class="section">

  <div class="grid">

    <div class="card">
      <h3>Compliance Detection</h3>
      <p>
        Detect missing policies, legal gaps,
        and store trust issues automatically.
      </p>
    </div>

    <div class="card">
      <h3>SEO Optimization</h3>
      <p>
        Identify weak product descriptions,
        missing metadata, and optimization issues.
      </p>
    </div>

    <div class="card">
      <h3>AI Recommendations</h3>
      <p>
        Receive intelligent recommendations
        to improve your store immediately.
      </p>
    </div>

  </div>

</div>

<div class="pricing">

  <h2>Simple Pricing</h2>

  <div class="price">
    $27/mo
  </div>

  <p>
    Full compliance scanning and AI optimization tools.
  </p>

  <a class="button" href="/install">
    Start Now
  </a>

</div>

<div class="footer">
  © Auditly Pro
</div>

</body>

</html>
  `);

});

// ==========================================
// INSTALL PAGE
// ==========================================
app.get("/install", (req, res) => {

  res.send(`
<!DOCTYPE html>
<html>

<head>

<title>Install Auditly Pro</title>

<style>

body{
  background:#f5f5f5;
  font-family:Arial;
  padding:40px;
}

.box{
  background:white;
  max-width:500px;
  margin:auto;
  padding:40px;
  border-radius:14px;
}

input{
  width:100%;
  padding:14px;
  margin-top:20px;
  font-size:16px;
  border-radius:8px;
  border:1px solid #ddd;
}

button{
  width:100%;
  margin-top:20px;
  padding:14px;
  background:#2563eb;
  color:white;
  border:none;
  border-radius:8px;
  font-size:16px;
  cursor:pointer;
}

</style>

</head>

<body>

<div class="box">

  <h1>Install Auditly Pro</h1>

  <p>
    Enter your Shopify store domain.
  </p>

  <form action="/auth">

    <input
      type="text"
      name="shop"
      placeholder="your-store.myshopify.com"
      required
    />

    <button type="submit">
      Continue
    </button>

  </form>

</div>

</body>

</html>
  `);

});

// ==========================================
// START OAUTH
// ==========================================
app.get("/auth", (req, res) => {

  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const redirectUri =
    `${process.env.HOST}/auth/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${process.env.SCOPES}` +
    `&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);

});

// ==========================================
// OAUTH CALLBACK
// ==========================================
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

    res.redirect(`/billing?shop=${shop}`);

  } catch (err) {

    console.error(err);

    res.status(500).send("OAuth failed");

  }

});

// ==========================================
// BILLING
// ==========================================
app.get("/billing", async (req, res) => {

  const shop = req.query.shop;

  if (
    !global.shopifyStore ||
    global.shopifyStore.shop !== shop
  ) {
    return res.status(400).send("Store not authenticated");
  }

  const accessToken =
    global.shopifyStore.accessToken;

  try {

    const returnUrl =
      `${process.env.HOST}/billing/callback?shop=${shop}`;

    const query = `
      mutation {
        appSubscriptionCreate(
          name: "Auditly Pro Monthly Plan"
          returnUrl: "${returnUrl}"
          test: true
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: {
                    amount: 27.0,
                    currencyCode: USD
                  }
                  interval: EVERY_30_DAYS
                }
              }
            }
          ]
        ) {
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken
        },
        body: JSON.stringify({ query })
      }
    );

    const data = await response.json();

    console.log(data);

    const confirmationUrl =
      data.data.appSubscriptionCreate.confirmationUrl;

    res.redirect(confirmationUrl);

  } catch (err) {

    console.error(err);

    res.status(500).send("Billing setup failed");

  }

});

// ==========================================
// BILLING CALLBACK
// ==========================================
app.get("/billing/callback", async (req, res) => {

  const shop = req.query.shop;

  res.redirect(`/scan?shop=${shop}`);

});

// ==========================================
// COMPLIANCE SCANNER
// ==========================================
app.get("/scan", async (req, res) => {

  const shop = req.query.shop;

  if (
    !global.shopifyStore ||
    global.shopifyStore.shop !== shop
  ) {
    return res.status(400).send("Store not authenticated");
  }

  const accessToken =
    global.shopifyStore.accessToken;

  try {

    // ======================================
    // GET PRODUCTS
    // ======================================
    const productResponse = await fetch(
      `https://${shop}/admin/api/2024-01/products.json?limit=20`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken
        }
      }
    );

    const productData =
      await productResponse.json();

    // ======================================
    // GET POLICIES
    // ======================================
    const policyResponse = await fetch(
      `https://${shop}/admin/api/2024-01/policies.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken
        }
      }
    );

    const policyData =
      await policyResponse.json();

    const issues = [];

    // ======================================
    // POLICY CHECKS
    // ======================================
    if (
      !policyData.policies ||
      policyData.policies.length === 0
    ) {
      issues.push(
        "❌ No store policies detected"
      );
    }

    // ======================================
    // PRODUCT CHECKS
    // ======================================
    productData.products.forEach(product => {

      if (
        !product.body_html ||
        product.body_html.length < 100
      ) {
        issues.push(
          `⚠️ Weak description: ${product.title}`
        );
      }

      if (
        !product.images ||
        product.images.length === 0
      ) {
        issues.push(
          `❌ Missing images: ${product.title}`
        );
      }

    });

    // ======================================
    // SCORE
    // ======================================
    let score =
      100 - (issues.length * 5);

    if (score < 0) {
      score = 0;
    }

    // ======================================
    // REPORT PAGE
    // ======================================
    res.send(`
<!DOCTYPE html>
<html>

<head>

<title>Auditly Pro Report</title>

<style>

body{
  margin:0;
  background:#f3f4f6;
  font-family:Arial;
}

.container{
  max-width:1000px;
  margin:auto;
  padding:40px 20px;
}

.card{
  background:white;
  padding:30px;
  border-radius:16px;
  margin-bottom:20px;
}

.score{
  font-size:72px;
  font-weight:bold;
  color:#2563eb;
}

.issue{
  padding:15px 0;
  border-bottom:1px solid #eee;
}

</style>

</head>

<body>

<div class="container">

  <div class="card">

    <h1>Auditly Pro Compliance Report</h1>

    <p>
      Store:
      <strong>${shop}</strong>
    </p>

    <div class="score">
      ${score}/100
    </div>

  </div>

  <div class="card">

    <h2>Issues Detected</h2>

    ${
      issues.length === 0
      ? "<p>✅ No major issues detected.</p>"
      : issues.map(issue =>
          `<div class="issue">${issue}</div>`
        ).join("")
    }

  </div>

</div>

</body>

</html>
    `);

  } catch (err) {

    console.error(err);

    res.status(500).send("Scanner failed");

  }

});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {

  console.log(
    `Auditly Pro running on port ${PORT}`
  );

});
