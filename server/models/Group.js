import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        groupName: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model("Group", groupSchema);
