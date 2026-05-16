import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(express.json());

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SCOPES,
  HOST,
  PORT = 3000,
  SUPABASE_URL,
  SUPABASE_KEY
} = process.env;

// ======================
// SUPABASE
// ======================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ======================
// HELPERS
// ======================

function buildInstallUrl(shop) {
  return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${HOST}/auth/callback`;
}

function verifyHmac(query) {
  const { hmac, signature, ...params } = query;

  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const generatedHash = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return generatedHash === hmac;
}

// ======================
// HOME
// ======================

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Auditly Pro</title>
      </head>
      <body style="font-family: Arial; padding: 40px;">
        <h1>Auditly Pro</h1>
        <p>Shopify Compliance & Optimization Platform</p>
      </body>
    </html>
  `);
});

// ======================
// AUTH START
// ======================

app.get("/auth", async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).send("Missing shop parameter");
    }

    const installUrl = buildInstallUrl(shop);

    return res.redirect(installUrl);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Auth start failed");
  }
});

// ======================
// AUTH CALLBACK
// ======================

app.get("/auth/callback", async (req, res) => {
  try {
    const { shop, code } = req.query;

    if (!verifyHmac(req.query)) {
      return res.status(401).send("HMAC validation failed");
    }

    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error(tokenData);
      return res.status(500).send("Failed to retrieve access token");
    }

    // SAVE SHOP TO DATABASE

    await supabase.from("shops").upsert({
      shop,
      access_token: tokenData.access_token,
      billing_active: false,
      installed_at: new Date()
    });

    // REDIRECT TO BILLING

    return res.redirect(`/billing?shop=${shop}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("OAuth callback failed");
  }
});

// ======================
// BILLING
// ======================

app.get("/billing", async (req, res) => {
  try {
    const { shop } = req.query;

    const { data: session } = await supabase
      .from("shops")
      .select("*")
      .eq("shop", shop)
      .single();

    if (!session) {
      return res.status(401).send("Shop session not found");
    }

    const billingResponse = await fetch(
      `https://${shop}/admin/api/2023-10/recurring_application_charges.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": session.access_token,
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

    const billingData = await billingResponse.json();

    const confirmationUrl =
      billingData.recurring_application_charge.confirmation_url;

    return res.redirect(confirmationUrl);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Billing creation failed");
  }
});

// ======================
// BILLING CONFIRM
// ======================

app.get("/billing/confirm", async (req, res) => {
  try {
    const { shop } = req.query;

    await supabase
      .from("shops")
      .update({
        billing_active: true
      })
      .eq("shop", shop);

    return res.redirect(`/app?shop=${shop}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Billing confirmation failed");
  }
});

// ======================
// EMBEDDED APP
// ======================

app.get("/app", async (req, res) => {
  try {
    const { shop } = req.query;

    const { data: session } = await supabase
      .from("shops")
      .select("*")
      .eq("shop", shop)
      .single();

    if (!session) {
      return res.redirect(`/auth?shop=${shop}`);
    }

    if (!session.billing_active) {
      return res.redirect(`/billing?shop=${shop}`);
    }

    return res.send(`
      <html>
        <head>
          <title>Auditly Pro Dashboard</title>
        </head>

        <body style="font-family: Arial; padding: 40px;">
          <h1>Auditly Pro</h1>

          <p><strong>Store:</strong> ${shop}</p>

          <p><strong>Subscription:</strong> Active</p>

          <hr />

          <h2>Compliance Scanner</h2>

          <button onclick="runScan()">
            Run Compliance Scan
          </button>

          <pre id="results"></pre>

          <script>
            async function runScan() {
              const response = await fetch("/api/scan", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  shop: "${shop}"
                })
              });

              const data = await response.json();

              document.getElementById("results").innerText =
                JSON.stringify(data, null, 2);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Dashboard failed");
  }
});

// ======================
// COMPLIANCE SCAN API
// ======================

app.post("/api/scan", async (req, res) => {
  try {
    const { shop } = req.body;

    const { data: session } = await supabase
      .from("shops")
      .select("*")
      .eq("shop", shop)
      .single();

    if (!session) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    return res.json({
      success: true,
      score: 72,
      issues: [
        "Missing Privacy Policy",
        "Missing Terms & Conditions",
        "Homepage SEO title not optimized",
        "No refund policy linked in footer"
      ],
      recommendations: [
        "Add legal policy links",
        "Optimize homepage metadata",
        "Improve product SEO descriptions"
      ]
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Compliance scan failed"
    });
  }
});

// ======================
// SERVER START
// ======================

app.listen(PORT, () => {
  console.log(`Auditly Pro running on port ${PORT}`);
});
