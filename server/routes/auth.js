import express from "express";
import User from "../models/User.js";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ✅ REGISTER
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // ✅ Gmail validation
        if (!email.endsWith("@gmail.com")) {
            return res.status(400).json({ message: "Email must be @gmail.com" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = new User({ name, email, password });
        await user.save();

        res.json({ message: "Registered successfully" });

    } catch (err) {
        res.status(500).json({ error: "Signup failed" });
    }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({ user });

    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// ✅ GET ALL USERS (for dropdown)
router.get("/users", async (req, res) => {
    const users = await User.find().select("name _id avatar");
    res.json(users);
});

// ✅ UPDATE PROFILE
router.post("/updateProfile", upload.single("avatar"), async (req, res) => {
    try {
        const { userId, name } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name;
        if (req.file) user.avatar = req.file.filename;

        await user.save();
        res.json({ message: "Profile updated successfully", user });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Update failed" });
    }
});

export default router;