import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Post from "../models/posts.js";
import Community from "../models/communities.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const router = express.Router();

// =============================
// SEARCH POSTS AND COMMUNITIES
// =============================
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json({ communities: [], posts: [] });
    }

    const searchTerm = q.trim().toLowerCase();

    const communities = await Community.find({
      name: { $regex: searchTerm, $options: "i" }
    }).limit(10);

    const posts = await Post.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { content: { $regex: searchTerm, $options: "i" } }
      ]
    })
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ communities, posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// CREATE POST
// =============================
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, communityId, imageUrl } = req.body;

    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: "Community not found" });

    const newPost = new Post({
      title,
      content,
      imageUrl: imageUrl || "",
      communityId,
      creatorId: req.user.id,
      upvotes: [],
      downvotes: [],
      comments: [],
    });

    await newPost.save();

    community.posts.push(newPost._id);
    await community.save();

    const user = await User.findById(req.user.id);
    if (user) {
      if (!Array.isArray(user.posts)) user.posts = [];
      user.posts.push(newPost._id);
      await user.save();
    }

    res.json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// GET ALL POSTS
// =============================
router.get("/", async (req, res) => {
  try {
    const { communityId, creatorId } = req.query;
    const filter = {};
    if (communityId) filter.communityId = communityId;
    if (creatorId) filter.creatorId = creatorId;

    const posts = await Post.find(filter)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .sort({ createdAt: -1 });

    const sortedPosts = posts.map(post => {
      const upvotes = post.upvotes?.length || 0;
      const downvotes = post.downvotes?.length || 0;
      const score = upvotes - downvotes;
      return { ...post.toObject(), score };
    });

    res.json(sortedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// GET SINGLE POST
// =============================
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .populate("comments.author", "username")
      .populate("comments.replies.author", "username");

    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// GEMINI SUMMARIZER (GEMINI 2.0 FLASH - WORKING)
// =============================
router.post("/:id/summarize", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const text = (post.content || post.title || "").trim();
    if (!text) return res.status(400).json({ error: "Post has no content" });

    const force = req.query.force === "true";
    if (post.aiSummary && post.aiSummary.text && !force) {
      return res.json({ summary: post.aiSummary.text, source: "gemini-2.0-flash" });
    }

    // -------------------------------
    // Gemini 2.0 Flash API call
    // -------------------------------
    const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Summarize the following post in 2-3 short sentences.
Avoid copying exact sentences. Avoid adding new information.

Text:
${text}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // Debug wrong model / key errors
    if (data.error) {
      console.error("Gemini API error:", data);
      return res.status(500).json({ error: "Gemini summarization failed", details: data.error });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summary) {
      console.error("Gemini response missing summary:", data);
      return res.status(500).json({ error: "No summary returned from Gemini" });
    }

    // Save to DB
    post.aiSummary = { text: summary, source: "gemini-2.0-flash", updatedAt: new Date() };
    await post.save();

    res.json({ summary, source: "gemini-2.0-flash" });

  } catch (error) {
    console.error("Gemini summarize error:", error);
    res.status(500).json({ error: "Failed to summarize post" });
  }
});

// =============================
// UPDATE POST
// =============================
router.put("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.creatorId.toString() !== req.user.id)
      return res.status(403).json({ error: "Not allowed" });

    const { title, content } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;

    await post.save();
    res.json({ message: "Post updated", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// VOTE POST
// =============================
router.put("/:id/vote", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { vote } = req.body;
    const userId = req.user.id;

    post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    post.downvotes = post.downvotes.filter(id => id.toString() !== userId);

    if (vote === 1) post.upvotes.push(userId);
    if (vote === -1) post.downvotes.push(userId);

    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name");

    res.json({ message: "Vote updated", post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// ADD COMMENT
// =============================
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { text, parentCommentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const newComment = {
      author: req.user.id,
      text: text.trim(),
      createdAt: new Date(),
      upvotes: [],
      downvotes: [],
      replies: [],
    };

    if (parentCommentId) {
      const parent = post.comments.id(parentCommentId);
      if (!parent)
        return res.status(404).json({ error: "Parent comment not found" });
      parent.replies.push(newComment);
    } else {
      post.comments.push(newComment);
    }

    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .populate("comments.author", "username")
      .populate("comments.replies.author", "username");

    res.json({ message: "Comment added", post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// DELETE COMMENT
// =============================
router.delete("/:id/comment/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { commentId } = req.params;
    const { isReply, parentCommentId } = req.body;

    let comment;
    if (isReply && parentCommentId) {
      const parent = post.comments.id(parentCommentId);
      if (!parent)
        return res.status(404).json({ error: "Parent comment not found" });
      comment = parent.replies.id(commentId);
    } else {
      comment = post.comments.id(commentId);
    }

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.author.toString() !== req.user.id)
      return res.status(403).json({ error: "Not allowed" });

    comment.isDeleted = true;
    comment.text = "[deleted]";

    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .populate("comments.author", "username")
      .populate("comments.replies.author", "username");

    res.json({ message: "Comment deleted", post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;