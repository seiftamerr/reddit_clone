import express from "express";
import Post from "../models/posts.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// CREATE POST
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, imageUrl, communityId } = req.body;

    const newPost = new Post({
      title,
      content,
      imageUrl: imageUrl || "",
      communityId,
      creatorId: req.user.id,
    });

    await newPost.save();
    res.json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SINGLE POST
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
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

    const { title, content, imageUrl } = req.body;

    post.title = title || post.title;
    post.content = content || post.content;
    post.imageUrl = imageUrl || post.imageUrl;

    await post.save();

    res.json({ message: "Post updated", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;