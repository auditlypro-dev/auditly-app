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
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Auditly Pro</title>

<style>

body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:#f8fafc;
  color:#111827;
}

.container{
  max-width:1200px;
  margin:auto;
  padding:0 20px;
}

.hero{
  padding:120px 20px;
  text-align:center;
  background:white;
}

.hero h1{
  font-size:56px;
  line-height:1.1;
  margin-bottom:20px;
}

.hero p{
  font-size:20px;
  color:#6b7280;
  max-width:800px;
  margin:auto;
}

.button{
  display:inline-block;
  margin-top:35px;
  background:#2563eb;
  color:white;
  text-decoration:none;
  padding:16px 32px;
  border-radius:10px;
  font-weight:600;
  font-size:18px;
}

.section{
  padding:90px 0;
}

.section-title{
  text-align:center;
  margin-bottom:50px;
}

.section-title h2{
  font-size:38px;
  margin-bottom:15px;
}

.section-title p{
  color:#6b7280;
  font-size:18px;
}

.grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
  gap:25px;
}

.card{
  background:white;
  border-radius:16px;
  padding:30px;
  box-shadow:0 2px 10px rgba(0,0,0,0.05);
}

.card h3{
  margin-top:0;
}

.card p{
  color:#6b7280;
}

.pricing{
  background:white;
  padding:60px;
  border-radius:20px;
  max-width:500px;
  margin:auto;
  text-align:center;
  box-shadow:0 2px 10px rgba(0,0,0,0.05);
}

.price{
  font-size:64px;
  font-weight:bold;
  color:#2563eb;
}

.footer{
  text-align:center;
  padding:40px;
  color:#6b7280;
}

</style>
</head>

<body>

<section class="hero">
  <div class="container">

    <h1>
      AI Compliance & Optimization For Shopify Stores
    </h1>

    <p>
      Auditly Pro automatically scans your Shopify store for
      compliance risks, SEO weaknesses, optimization issues,
      trust problems, and missing policies.
    </p>

    <a class="button" href="/install">
      Install Auditly Pro
    </a>

  </div>
</section>

<section class="section">

  <div class="container">

    <div class="section-title">
      <h2>Everything Your Store Needs To Stay Protected</h2>
      <p>
        Professional-grade compliance monitoring and optimization tools.
      </p>
    </div>

    <div class="grid">

      <div class="card">
        <h3>Policy Detection</h3>
        <p>
          Detect missing privacy policies, refund policies,
          terms of service, and contact information.
        </p>
      </div>

      <div class="card">
        <h3>Product SEO Audits</h3>
        <p>
          Identify weak product descriptions, poor SEO,
          and missing metadata.
        </p>
      </div>

      <div class="card">
        <h3>Theme Compliance</h3>
        <p>
          Scan themes for trust signals, branding issues,
          and potential compliance gaps.
        </p>
      </div>

      <div class="card">
        <h3>AI Recommendations</h3>
        <p>
          Receive actionable AI-powered recommendations
          to improve your store instantly.
        </p>
      </div>

    </div>

  </div>

</section>

<section class="section">

  <div class="container">

    <div class="pricing">

      <h2>Simple Pricing</h2>

      <div class="price">
        $27/mo
      </div>

      <p>
        Full compliance scanning, optimization analysis,
        and AI-powered recommendations.
      </p>

      <a class="button" href="/install">
        Start Free
      </a>

    </div>

  </div>

</section>

<div class="footer">
  © Auditly Pro
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
    <html>
    <head>
      <title>Install Auditly Pro</title>

      <style>

      body{
        font-family:Arial;
        background:#f5f5f5;
        padding:40px;
      }

      .box{
        max-width:500px;
        margin:auto;
        background:white;
        padding:40px;
        border-radius:14px;
      }

      input{
        width:100%;
        padding:14px;
        font-size:16px;
        margin-top:15px;
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
          Enter your Shopify store domain to continue.
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

// ======================================
// OAUTH START
// ======================================
app.get("/auth", (req, res) => {

  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const redirectUri =
    \`\${process.env.HOST}/auth/callback\`;

  const installUrl =
    \`https://\${shop}/admin/oauth/authorize?client_id=\${process.env.SHOPIFY_API_KEY}&scope=\${process.env.SCOPES}&redirect_uri=\${redirectUri}\`;

  res.redirect(installUrl);

});

// ======================================
// OAUTH CALLBACK
// ======================================
app.get("/auth/callback", async (req, res) => {

  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing parameters");
  }

  try {

    const response = await fetch(
      \`https://\${shop}/admin/oauth/access_token\`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({
          client_id:process.env.SHOPIFY_API_KEY,
          client_secret:process.env.SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    const data = await response.json();

    const accessToken = data.access_token;

    // TEMP STORAGE
    global.shopifyStore = {
      shop,
      accessToken
    };

    res.redirect(\`/scan?shop=\${shop}\`);

  } catch(error){

    console.error(error);

    res.status(500).send("OAuth failed");

  }

});

// ======================================
// COMPLIANCE SCANNER
// ======================================
app.get("/scan", async (req, res) => {

  const shop = req.query.shop;

  if(
    !global.shopifyStore ||
    global.shopifyStore.shop !== shop
  ){
    return res.status(400).send("Store not authenticated");
  }

  const accessToken =
    global.shopifyStore.accessToken;

  try {

    // ======================================
    // GET POLICIES
    // ======================================
    const policyResponse = await fetch(
      \`https://\${shop}/admin/api/2024-01/policies.json\`,
      {
        headers:{
          "X-Shopify-Access-Token":accessToken,
          "Content-Type":"application/json",
        },
      }
    );

    const policyData =
      await policyResponse.json();

    // ======================================
    // GET PRODUCTS
    // ======================================
    const productResponse = await fetch(
      \`https://\${shop}/admin/api/2024-01/products.json?limit=20\`,
      {
        headers:{
          "X-Shopify-Access-Token":accessToken,
          "Content-Type":"application/json",
        },
      }
    );

    const productData =
      await productResponse.json();

    // ======================================
    // ANALYSIS
    // ======================================
    const issues = [];

    // POLICY CHECKS
    if(
      !policyData.policies ||
      policyData.policies.length === 0
    ){
      issues.push("❌ No store policies detected");
    }

    // PRODUCT CHECKS
    productData.products.forEach(product => {

      if(
        !product.body_html ||
        product.body_html.length < 100
      ){
        issues.push(
          \`⚠️ "\${product.title}" has a weak product description\`
        );
      }

      if(
        !product.images ||
        product.images.length === 0
      ){
        issues.push(
          \`❌ "\${product.title}" has no product images\`
        );
      }

      if(
        !product.handle
      ){
        issues.push(
          \`⚠️ "\${product.title}" may have SEO issues\`
        );
      }

    });

    // ======================================
    // SCORE CALCULATION
    // ======================================
    let score = 100 - (issues.length * 5);

    if(score < 0){
      score = 0;
    }

    // ======================================
    // REPORT PAGE
    // ======================================
    res.send(\`
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

.header{
  background:white;
  padding:40px;
  border-radius:16px;
  margin-bottom:30px;
}

.score{
  font-size:72px;
  font-weight:bold;
  color:#2563eb;
}

.card{
  background:white;
  border-radius:16px;
  padding:30px;
}

.issue{
  padding:15px 0;
  border-bottom:1px solid #eee;
}

</style>

</head>

<body>

<div class="container">

  <div class="header">

    <h1>Auditly Pro Compliance Report</h1>

    <p>
      Store:
      <strong>\${shop}</strong>
    </p>

    <div class="score">
      \${score}/100
    </div>

  </div>

  <div class="card">

    <h2>Issues Detected</h2>

    \${issues.length === 0
      ? "<p>✅ No major issues detected.</p>"
      : issues.map(issue =>
        \`<div class="issue">\${issue}</div>\`
      ).join("")
    }

  </div>

</div>

</body>
</html>
    \`);

  } catch(error){

    console.error(error);

    res.status(500).send("Scanner failed");

  }

});

// ======================================
// SERVER START
// ======================================
app.listen(PORT, () => {

  console.log(
    \`Auditly Pro running on port \${PORT}\`
  );

});
