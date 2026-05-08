const express = require("express");
const fetch = require("node-fetch");

const app = express();

const PORT = process.env.PORT || 10000;

global.shopifyStore = {};

// =====================================================
// HOME PAGE
// =====================================================
app.get("/", (req, res) => {

res.send(`

<!DOCTYPE html>
<html>

<head>

<title>Auditly Pro</title>

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>

*{
box-sizing:border-box;
}

body{
margin:0;
font-family:Arial,sans-serif;
background:#f5f7fb;
color:#111827;
}

.hero{
padding:100px 20px;
text-align:center;
background:white;
}

.hero h1{
font-size:56px;
margin-bottom:20px;
}

.hero p{
font-size:20px;
max-width:700px;
margin:auto;
color:#6b7280;
line-height:1.6;
}

.button{
display:inline-block;
margin-top:35px;
padding:16px 32px;
background:#2563eb;
color:white;
text-decoration:none;
border-radius:12px;
font-weight:bold;
font-size:18px;
}

.section{
max-width:1200px;
margin:auto;
padding:80px 20px;
}

.grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
gap:25px;
}

.card{
background:white;
padding:35px;
border-radius:18px;
box-shadow:0 4px 20px rgba(0,0,0,0.05);
}

.card h3{
margin-top:0;
font-size:24px;
}

.pricing{
max-width:500px;
margin:80px auto;
background:white;
padding:50px;
border-radius:24px;
text-align:center;
box-shadow:0 4px 20px rgba(0,0,0,0.05);
}

.price{
font-size:72px;
font-weight:bold;
color:#2563eb;
}

.footer{
text-align:center;
padding:50px;
color:#6b7280;
}

</style>

</head>

<body>

<div class="hero">

<h1>Auditly Pro</h1>

<p>
AI-powered Shopify compliance and optimization platform.
Automatically detect policy gaps, SEO weaknesses,
trust issues, and optimization opportunities.
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
Identify missing policies,
trust gaps, and legal vulnerabilities.
</p>
</div>

<div class="card">
<h3>SEO Optimization</h3>
<p>
Find weak product descriptions,
missing metadata, and ranking issues.
</p>
</div>

<div class="card">
<h3>AI Recommendations</h3>
<p>
Receive intelligent store improvement suggestions
instantly.
</p>
</div>

</div>

</div>

<div class="pricing">

<h2>Professional Plan</h2>

<div class="price">
$27/mo
</div>

<p>
Unlimited compliance scans and optimization reports.
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

// =====================================================
// INSTALL PAGE
// =====================================================
app.get("/install", (req, res) => {

res.send(`

<!DOCTYPE html>
<html>

<head>

<title>Install Auditly Pro</title>

<style>

body{
background:#f5f7fb;
font-family:Arial;
padding:40px;
}

.box{
max-width:500px;
margin:auto;
background:white;
padding:40px;
border-radius:20px;
box-shadow:0 4px 20px rgba(0,0,0,0.05);
}

input{
width:100%;
padding:16px;
border:1px solid #ddd;
border-radius:12px;
font-size:16px;
margin-top:20px;
}

button{
width:100%;
padding:16px;
margin-top:20px;
background:#2563eb;
color:white;
border:none;
border-radius:12px;
font-size:16px;
font-weight:bold;
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

// =====================================================
// START OAUTH
// =====================================================
app.get("/auth", (req, res) => {

const shop = req.query.shop;

if(!shop){
return res.status(400).send("Missing shop");
}

const redirectUri =
`${process.env.HOST}/auth/callback`;

const installUrl =
`https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
`&scope=${process.env.SCOPES}` +
`&redirect_uri=${redirectUri}`;

res.redirect(installUrl);

});

// =====================================================
// OAUTH CALLBACK
// =====================================================
app.get("/auth/callback", async (req, res) => {

const { shop, code } = req.query;

if(!shop || !code){
return res.status(400).send("OAuth failed");
}

try{

const response = await fetch(
`https://${shop}/admin/oauth/access_token`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
client_id:process.env.SHOPIFY_API_KEY,
client_secret:process.env.SHOPIFY_API_SECRET,
code
})
}
);

const data = await response.json();

global.shopifyStore = {
shop,
accessToken:data.access_token
};

res.redirect(`/billing?shop=${shop}`);

}catch(err){

console.error(err);

res.status(500).send("OAuth error");

}

});

// =====================================================
// BILLING
// =====================================================
app.get("/billing", async (req, res) => {

const shop = req.query.shop;

if(
!global.shopifyStore ||
global.shopifyStore.shop !== shop
){
return res.status(400).send("Store not authenticated");
}

const accessToken =
global.shopifyStore.accessToken;

try{

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
amount: 27.0
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
method:"POST",
headers:{
"Content-Type":"application/json",
"X-Shopify-Access-Token":accessToken
},
body:JSON.stringify({ query })
}
);

const data = await response.json();

console.log(data);

const confirmationUrl =
data.data.appSubscriptionCreate.confirmationUrl;

res.redirect(confirmationUrl);

}catch(err){

console.error(err);

res.status(500).send("Billing failed");

}

});

// =====================================================
// BILLING CALLBACK
// =====================================================
app.get("/billing/callback", (req, res) => {

const shop = req.query.shop;

res.redirect(`/dashboard?shop=${shop}`);

});

// =====================================================
// DASHBOARD
// =====================================================
app.get("/dashboard", async (req, res) => {

const shop = req.query.shop;

if(
!global.shopifyStore ||
global.shopifyStore.shop !== shop
){
return res.status(400).send("Store not authenticated");
}

const accessToken =
global.shopifyStore.accessToken;

try{

// PRODUCTS
const productResponse = await fetch(
`https://${shop}/admin/api/2024-01/products.json?limit=20`,
{
headers:{
"X-Shopify-Access-Token":accessToken
}
}
);

const productData =
await productResponse.json();

// POLICIES
const policyResponse = await fetch(
`https://${shop}/admin/api/2024-01/policies.json`,
{
headers:{
"X-Shopify-Access-Token":accessToken
}
}
);

const policyData =
await policyResponse.json();

const issues = [];

// POLICY CHECKS
if(
!policyData.policies ||
policyData.policies.length === 0
){
issues.push(
"Missing store policies"
);
}

// PRODUCT CHECKS
productData.products.forEach(product => {

if(
!product.body_html ||
product.body_html.length < 100
){
issues.push(
`Weak description: ${product.title}`
);
}

if(
!product.images ||
product.images.length === 0
){
issues.push(
`Missing images: ${product.title}`
);
}

});

let score =
100 - (issues.length * 5);

if(score < 0){
score = 0;
}

res.send(`

<!DOCTYPE html>
<html>

<head>

<title>Auditly Pro Dashboard</title>

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>

*{
box-sizing:border-box;
}

body{
margin:0;
font-family:Arial,sans-serif;
background:#f3f4f6;
color:#111827;
}

.layout{
display:flex;
min-height:100vh;
}

.sidebar{
width:260px;
background:#111827;
color:white;
padding:30px 20px;
}

.logo{
font-size:28px;
font-weight:bold;
margin-bottom:40px;
}

.nav a{
display:block;
padding:14px 18px;
margin-bottom:10px;
border-radius:12px;
color:white;
text-decoration:none;
background:rgba(255,255,255,0.05);
}

.nav a:hover{
background:rgba(255,255,255,0.1);
}

.content{
flex:1;
padding:40px;
}

.topbar{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:30px;
}

.button{
background:#2563eb;
color:white;
padding:14px 24px;
border-radius:12px;
text-decoration:none;
font-weight:bold;
}

.grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:20px;
margin-bottom:30px;
}

.card{
background:white;
padding:30px;
border-radius:20px;
box-shadow:0 4px 20px rgba(0,0,0,0.05);
}

.score{
font-size:64px;
font-weight:bold;
color:#2563eb;
}

.issue{
padding:16px 0;
border-bottom:1px solid #eee;
}

.issue:last-child{
border-bottom:none;
}

.ai{
background:linear-gradient(135deg,#2563eb,#4f46e5);
color:white;
}

.ai p{
opacity:0.9;
line-height:1.6;
}

.badge{
display:inline-block;
padding:6px 12px;
background:#dcfce7;
color:#166534;
border-radius:999px;
font-size:14px;
font-weight:bold;
margin-top:12px;
}

</style>

</head>

<body>

<div class="layout">

<div class="sidebar">

<div class="logo">
Auditly Pro
</div>

<div class="nav">

<a href="#">
Dashboard
</a>

<a href="#">
Compliance
</a>

<a href="#">
SEO
</a>

<a href="#">
Policies
</a>

<a href="#">
Billing
</a>

<a href="#">
Settings
</a>

</div>

</div>

<div class="content">

<div class="topbar">

<div>

<h1>
Dashboard
</h1>

<p>
Store:
<strong>${shop}</strong>
</p>

</div>

<a class="button" href="#">
Run Scan
</a>

</div>

<div class="grid">

<div class="card">

<p>
Compliance Score
</p>

<div class="score">
${score}
</div>

</div>

<div class="card">

<p>
Issues Detected
</p>

<div class="score">
${issues.length}
</div>

</div>

<div class="card">

<p>
Products Scanned
</p>

<div class="score">
${productData.products.length}
</div>

</div>

</div>

<div class="card ai">

<h2>
AI Recommendation
</h2>

<p>
Auditly Pro detected opportunities to improve
product SEO, strengthen trust signals,
and increase compliance coverage.
</p>

<div class="badge">
Optimization Available
</div>

</div>

<br/>

<div class="card">

<h2>
Compliance Issues
</h2>

${
issues.length === 0
?
"<p>No major issues detected.</p>"
:
issues.map(issue =>
`<div class="issue">${issue}</div>`
).join("")
}

</div>

</div>

</div>

</body>

</html>

`);

}catch(err){

console.error(err);

res.status(500).send("Dashboard failed");

}

});

// =====================================================
// SERVER
// =====================================================
app.listen(PORT, () => {

console.log(
`Auditly Pro running on port ${PORT}`
);

});
