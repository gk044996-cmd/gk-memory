import express from "express";
import Group from "../models/Group.js";

const router = express.Router();

// CREATE GROUP
router.post("/create", async (req, res) => {
    try {
        const { groupName, createdBy, members } = req.body;
        
        const newGroup = new Group({
            groupName,
            createdBy,
            members: members.includes(createdBy) ? members : [...members, createdBy]
        });

        await newGroup.save();
        res.json({ message: "Group created successfully", group: newGroup });
    } catch (err) {
        console.error("Create group error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET USER'S GROUPS
router.get("/:userId", async (req, res) => {
    try {
        const groups = await Group.find({ members: req.params.userId }).populate("members", "name");
        res.json(groups);
    } catch (err) {
        console.error("Get groups error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
