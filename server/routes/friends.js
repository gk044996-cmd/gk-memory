import express from "express";
import Friend from "../models/Friend.js";

const router = express.Router();


// ✅ GET ALL FRIEND DATA
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        const friends = await Friend.find({
            status: "accepted",
            $or: [{ requester: userId }, { recipient: userId }]
        }).populate("requester recipient", "name email avatar");

        const sentRequests = await Friend.find({
            requester: userId,
            status: "pending"
        }).populate("recipient", "name email avatar");

        const incomingRequests = await Friend.find({
            recipient: userId,
            status: "pending"
        }).populate("requester", "name email avatar");

        res.json({
            friends,
            sentRequests,
            incomingRequests
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});


// ✅ SEND REQUEST
router.post("/send", async (req, res) => {
    try {
        const { fromId, toId } = req.body;

        // prevent duplicate
        const existing = await Friend.findOne({
            requester: fromId,
            recipient: toId
        });

        if (existing) {
            return res.json({ message: "Already sent" });
        }

        const friend = new Friend({
            requester: fromId,
            recipient: toId
        });

        await friend.save();

        res.json({ message: "Request sent" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});


// ✅ ACCEPT REQUEST
router.post("/accept", async (req, res) => {
    try {
        const { userId, fromId } = req.body;

        const request = await Friend.findOne({
            requester: fromId,
            recipient: userId
        });

        if (!request) {
            return res.json({ message: "Request not found" });
        }

        request.status = "accepted";
        await request.save();

        res.json({ message: "Friend added" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});


// ✅ REJECT REQUEST
router.post("/reject", async (req, res) => {
    try {
        const { userId, fromId } = req.body;

        await Friend.findOneAndDelete({
            requester: fromId,
            recipient: userId
        });

        res.json({ message: "Request rejected" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;