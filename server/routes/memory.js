import express from "express";
import Memory from "../models/Memory.js";
import Group from "../models/Group.js";
import multer from "multer";

const router = express.Router();


// ================= MULTER CONFIG =================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });


// ================= ADD MEMORY =================

router.post("/add", upload.single("image"), async (req, res) => {
    try {
        const { userId, caption, group, taggedUsers } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }

        const memory = new Memory({
            userId,
            image: req.file.filename,
            caption,
            group: group || "",
            taggedUsers: taggedUsers ? JSON.parse(taggedUsers) : [],
            likes: [],
            likesCount: 0
        });

        await memory.save();

        res.json({ message: "Memory added successfully", memory });
    } catch (error) {
        console.log("Upload error:", error);
        res.status(500).json({ message: "Failed to add memory" });
    }
});


// ================= GET MEMORIES =================

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Find all groups the user is a member of
        const userGroups = await Group.find({ members: userId });
        const groupIds = userGroups.map(g => g._id.toString());
        
        const memories = await Memory.find({
            $or: [
                { userId: userId },             // Memories created by the user
                { taggedUsers: userId },        // Memories where user is tagged
                { group: { $in: groupIds } }    // Memories belonging to user's groups
            ]
        })
            .populate("taggedUsers", "name avatar")
            .populate("userId", "name avatar")
            .sort({ createdAt: -1 });

        res.json(memories || []);
    } catch (error) {
        console.log("Fetch error:", error);
        res.json([]);
    }
});


// ================= DELETE MEMORY =================

router.delete("/:id", async (req, res) => {
    try {
        await Memory.findByIdAndDelete(req.params.id);
        res.json({ message: "Memory deleted successfully" });
    } catch (error) {
        console.log("Delete error:", error);
        res.status(500).json({ message: "Failed to delete memory" });
    }
});


// ================= ❤️ LIKE / UNLIKE =================

router.post("/like/:id", async (req, res) => {
    try {
        const { userId } = req.body;

        const memory = await Memory.findById(req.params.id);

        if (!memory) {
            return res.status(404).json({ message: "Memory not found" });
        }

        const alreadyLiked = memory.likes.includes(userId);

        if (alreadyLiked) {
            memory.likes = memory.likes.filter(
                (id) => id.toString() !== userId
            );
        } else {
            memory.likes.push(userId);
        }

        // ✅ update count
        memory.likesCount = memory.likes.length;

        await memory.save();

        res.json(memory);
    } catch (error) {
        console.log("Like error:", error);
        res.status(500).json({ message: "Like failed" });
    }
});


export default router;