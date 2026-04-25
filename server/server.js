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

// ✅ CORS (FIXED for Netlify + Local)
const allowedOrigins = [
    "http://localhost:3000",
    "https://gkmemory.netlify.app"
];

app.use(cors({
    origin: function (origin, callback) {
        // allow tools like Postman or same-origin
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(null, false); // ❗ don't throw error
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

// ✅ IMPORTANT: handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded images
app.use("/uploads", express.static("uploads"));


// ================= DATABASE =================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Atlas Connected ✅");
        console.log("DB:", mongoose.connection.name);
    })
    .catch((err) => {
        console.error("MongoDB Error ❌", err);
        process.exit(1);
    });


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
    console.error("Server Error:", err.message);
    res.status(500).json({ error: err.message || "Something went wrong" });
});


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});