import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        image: {
            type: String,
            required: true
        },

        caption: {
            type: String,
            default: ""
        },

        // 🆕 GROUP (for now string, later can convert to Group model)
        group: {
            type: String,
            default: ""
        },

        // 👥 Tagged users
        taggedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        // ❤️ LIKE SYSTEM (NEW)
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        // 📊 (optional but useful for performance later)
        likesCount: {
            type: Number,
            default: 0
        },

        date: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

export default mongoose.model("Memory", memorySchema);