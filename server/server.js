import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import memoryRoutes from "./routes/memory.js";
import friendRoutes from "./routes/friends.js";
import groupRoutes from "./routes/groups.js";

dotenv.config();

const app = express();


// ================= MIDDLEWARE =================

// ✅ CORS (ready for deployment also)
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded images
app.use("/uploads", express.static("uploads"));


// ================= DATABASE =================

// ✅ CONNECT TO MONGODB ATLAS (IMPORTANT FIX)
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Atlas Connected ✅");
        console.log("DB:", mongoose.connection.name); // debug check
    })
    .catch((err) => console.log("MongoDB Error ❌", err));


// ================= ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);


// ================= TEST ROUTE =================

app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});


// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Something went wrong" });
});


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});