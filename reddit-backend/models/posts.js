import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
      upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      replies: [
        {
          author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          text: String,
          createdAt: { type: Date, default: Date.now },
          upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        }
      ],
      editedAt: { type: Date },
      isDeleted: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
