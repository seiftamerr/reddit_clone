import express from "express";
import Community from "../models/communities.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// CREATE COMMUNITY
router.post("/", auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Community.findOne({ name });
    if (exists) return res.status(400).json({ error: "Community already exists" });

    const newComm = new Community({
      name,
      description,
      creatorId: req.user.id,
      members: [req.user.id],
      posts: [],
    });

    await newComm.save();

    // Add community to creator's joinedCommunities
    const user = await User.findById(req.user.id);
    if (user) {
      if (!user.joinedCommunities.includes(name)) {
        user.joinedCommunities.push(name);
        await user.save();
      }
    }

    res.json({
      _id: newComm._id,
      name: newComm.name,
      description: newComm.description,
      creatorId: newComm.creatorId,
      members: newComm.members,
      posts: newComm.posts,
      createdAt: newComm.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL COMMUNITIES
router.get("/", async (req, res) => {
  try {
    const communities = await Community.find().sort({ createdAt: -1 });
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SINGLE COMMUNITY
router.get("/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate({
        path: "posts",
        populate: [
          { path: "creatorId", select: "username" },
          { path: "comments.author", select: "username" }
        ]
      })
      .populate("members", "username");
    if (!community) return res.status(404).json({ error: "Community not found" });

    res.json({
      _id: community._id,
      name: community.name,
      description: community.description,
      creatorId: community.creatorId,
      members: community.members, // array of users
      posts: community.posts,
      createdAt: community.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// JOIN / LEAVE COMMUNITY
router.put("/:id/join", auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: "Community not found" });

    const isMember = community.members.some(m => m.toString() === req.user.id);

    if (isMember) {
      community.members = community.members.filter((id) => id.toString() !== req.user.id);
    } else {
      community.members.push(req.user.id);
    }

    await community.save();

    // Update user's joinedCommunities
    const user = await User.findById(req.user.id);
    if (user) {
      if (isMember) {
        user.joinedCommunities = user.joinedCommunities.filter(name => name !== community.name);
      } else {
        if (!user.joinedCommunities.includes(community.name)) {
          user.joinedCommunities.push(community.name);
        }
      }
      await user.save();
    }

    // Populate members and posts before returning
    await community.populate("members", "username");
    await community.populate("creatorId", "username");
    await community.populate({
      path: "posts",
      populate: [
        { path: "creatorId", select: "username" },
        { path: "comments.author", select: "username" }
      ]
    });

    res.json({ message: isMember ? "Left community" : "Joined community", community });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE COMMUNITY
router.delete("/:id", auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: "Community not found" });

    if (community.creatorId.toString() !== req.user.id)
      return res.status(403).json({ error: "Not allowed" });

    await community.deleteOne();
    res.json({ message: "Community deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
