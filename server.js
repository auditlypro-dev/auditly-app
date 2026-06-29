import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Route imports
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import apiRoutes from "./routes/api.js";
import billingRoutes from "./routes/billing.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
========================================
MIDDLEWARE
========================================
*/

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
========================================
STATIC FILES
========================================
*/

app.use(express.static(path.join(__dirname, "public")));

/*
========================================
VIEW ROUTES
========================================
*/

app.use("/", dashboardRoutes);
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/billing", billingRoutes);

/*
========================================
404
========================================
*/

app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

/*
========================================
START SERVER
========================================
*/

app.listen(PORT, () => {

    console.log(`
========================================
🚀 AUDITLY PRO
========================================
Server Running Successfully

Port : ${PORT}

Environment : ${process.env.NODE_ENV || "development"}

Host : ${process.env.HOST}

========================================
`);

});
