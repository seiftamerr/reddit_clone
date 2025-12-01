import express from "express";
import Post from "../models/posts.js";
import Community from "../models/communities.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// CREATE POST
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, communityId } = req.body;

    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: "Community not found" });

    const newPost = new Post({
      title,
      content,
      communityId,
      creatorId: req.user.id,
      upvotes: [],
      downvotes: [],
      comments: [],
    });

    await newPost.save();

    // Add post to community
    community.posts.push(newPost._id);
    await community.save();

    res.json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL POSTS (optionally by community)
router.get("/", async (req, res) => {
  try {
    const { communityId } = req.query;
    const filter = communityId ? { communityId } : {};
    const posts = await Post.find(filter)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SINGLE POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name");
    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE POST
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.creatorId.toString() !== req.user.id)
      return res.status(403).json({ error: "Not allowed" });

    await post.deleteOne();

    await Community.findByIdAndUpdate(post.communityId, { $pull: { posts: post._id } });

    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE POST
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

export default router;
