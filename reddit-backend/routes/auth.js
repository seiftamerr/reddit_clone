import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      passwordHash: hashedPassword,
      bio: "",
      joinedCommunities: [],
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        joinedCommunities: user.joinedCommunities,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN (accept email or username)
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // find user by email OR username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) return res.status(400).json({ error: "User not found" });

    // check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Wrong password" });

    // create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        joinedCommunities: user.joinedCommunities || [],
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET logged-in user
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        joinedCommunities: user.joinedCommunities || [],
        following: user.following || [],
        followers: user.followers || [],
      },
    });
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
});
// UPDATE BIO
router.put("/update-bio", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.bio = req.body.bio;
    await user.save();

    res.json({
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        joinedCommunities: user.joinedCommunities,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE USERNAME / PASSWORD
router.put("/update-profile", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { username, currentPassword, newPassword } = req.body;

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update username if provided and changed
    if (username && username.trim() !== user.username) {
      const existingUser = await User.findOne({
        username: username.trim(),
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      user.username = username.trim();
    }

    // Update password if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to change password" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.passwordHash = hashedPassword;
    }

    await user.save();

    res.json({
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        joinedCommunities: user.joinedCommunities || [],
        following: user.following || [],
        followers: user.followers || [],
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// FOLLOW/UNFOLLOW USER
router.put("/follow/:userId", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    const targetUser = await User.findById(req.params.userId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const isFollowing = currentUser.following.some(id => id.toString() === targetUser._id.toString());

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Follow
      if (!currentUser.following.includes(targetUser._id)) {
        currentUser.following.push(targetUser._id);
      }
      if (!targetUser.followers.includes(currentUser._id)) {
        targetUser.followers.push(currentUser._id);
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? "Unfollowed user" : "Followed user",
      following: currentUser.following,
      followers: currentUser.followers
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET USER PROFILE
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-passwordHash")
      .populate("following", "username")
      .populate("followers", "username");
    
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        bio: user.bio || "",
        joinedCommunities: user.joinedCommunities || [],
        following: user.following || [],
        followers: user.followers || [],
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// SEARCH USERS
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json({ users: [] });
    }

    const searchTerm = q.trim().toLowerCase();

    // Search users by username
    const users = await User.find({
      username: { $regex: searchTerm, $options: "i" }
    })
      .select("-passwordHash")
      .limit(10);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
