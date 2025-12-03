import express from "express";
import Post from "../models/posts.js";
import Community from "../models/communities.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// SEARCH POSTS AND COMMUNITIES
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json({ communities: [], posts: [] });
    }

    const searchTerm = q.trim().toLowerCase();

    // Search communities
    const communities = await Community.find({
      name: { $regex: searchTerm, $options: "i" }
    }).limit(10);

    // Search posts
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

    // Add post to user's posts array (ensure array exists for older users)
    const user = await User.findById(req.user.id);
    if (user) {
      if (!Array.isArray(user.posts)) {
        user.posts = [];
      }
      user.posts.push(newPost._id);
      await user.save();
    }

    res.json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL POSTS (optionally by community or creator, with sorting)
router.get("/", async (req, res) => {
  try {
    const { communityId, creatorId, sort = "new" } = req.query;
    const filter = {};
    if (communityId) filter.communityId = communityId;
    if (creatorId) filter.creatorId = creatorId;
    
    let sortOption = { createdAt: -1 }; // Default: New
    
    if (sort === "hot") {
      // Hot: combination of votes and recency
      sortOption = { createdAt: -1 }; // Will calculate hot score in application
    } else if (sort === "top") {
      // Top: most upvotes minus downvotes
      sortOption = { createdAt: -1 }; // Will calculate in application
    } else if (sort === "controversial") {
      // Controversial: high engagement but mixed votes
      sortOption = { createdAt: -1 }; // Will calculate in application
    } else if (sort === "new") {
      sortOption = { createdAt: -1 };
    }
    
    const posts = await Post.find(filter)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .sort(sortOption);
    
    // Calculate scores for sorting
    let sortedPosts = posts.map(post => {
      const upvotes = post.upvotes?.length || 0;
      const downvotes = post.downvotes?.length || 0;
      const score = upvotes - downvotes;
      const totalVotes = upvotes + downvotes;
      const commentsCount = post.comments?.length || 0;
      const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      
      let hotScore = 0;
      let controversialScore = 0;
      
      if (sort === "hot") {
        // Reddit's hot algorithm approximation
        hotScore = Math.log10(Math.max(Math.abs(score), 1)) * Math.sign(score) + ageInHours / 12;
      } else if (sort === "controversial" && totalVotes > 0) {
        // Controversial: high engagement but close vote ratio
        const voteRatio = Math.min(upvotes, downvotes) / totalVotes;
        controversialScore = voteRatio * totalVotes;
      }
      
      return {
        ...post.toObject(),
        score,
        hotScore,
        controversialScore,
        totalVotes
      };
    });
    
    // Sort based on selected method
    if (sort === "hot") {
      sortedPosts.sort((a, b) => b.hotScore - a.hotScore);
    } else if (sort === "top") {
      // Sort by total engagement: votes + comments
      sortedPosts.sort((a, b) => {
        const engagementA = a.score + (a.comments?.length || 0);
        const engagementB = b.score + (b.comments?.length || 0);
        // Primary sort by total engagement, secondary by score
        if (engagementB !== engagementA) {
          return engagementB - engagementA;
        }
        return b.score - a.score;
      });
    } else if (sort === "controversial") {
      sortedPosts.sort((a, b) => b.controversialScore - a.controversialScore);
    }
    
    res.json(sortedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SINGLE POST
router.get("/:id", async (req, res) => {
  try {
    const { sort = "new" } = req.query;
    const post = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .populate("comments.author", "username")
      .populate("comments.replies.author", "username");
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Sort comments
    if (post.comments && post.comments.length > 0) {
      post.comments = post.comments.filter(c => !c.isDeleted);
      
      if (sort === "top") {
        post.comments.sort((a, b) => {
          // Calculate score based on votes, replies, and total engagement
          const votesA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
          const votesB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
          const repliesA = (a.replies?.filter(r => !r.isDeleted).length || 0);
          const repliesB = (b.replies?.filter(r => !r.isDeleted).length || 0);
          const totalEngagementA = votesA + repliesA;
          const totalEngagementB = votesB + repliesB;
          
          // Primary sort by total engagement (votes + replies), secondary by votes
          if (totalEngagementB !== totalEngagementA) {
            return totalEngagementB - totalEngagementA;
          }
          return votesB - votesA;
        });
      } else if (sort === "controversial") {
        post.comments.sort((a, b) => {
          const totalA = (a.upvotes?.length || 0) + (a.downvotes?.length || 0);
          const totalB = (b.upvotes?.length || 0) + (b.downvotes?.length || 0);
          const ratioA = totalA > 0 ? Math.min(a.upvotes?.length || 0, a.downvotes?.length || 0) / totalA : 0;
          const ratioB = totalB > 0 ? Math.min(b.upvotes?.length || 0, b.downvotes?.length || 0) / totalB : 0;
          return ratioB * totalB - ratioA * totalA;
        });
      } else {
        // New (default)
        post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      // Sort replies within each comment
      post.comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = comment.replies.filter(r => !r.isDeleted);
          comment.replies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SUMMARIZE POST WITH AI (or fallback)
router.post("/:id/summarize", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const text = (post.content || post.title || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Post has no content to summarize" });
    }

    let summary;

    // Simple built-in "AI-like" summarizer (no external API):
    // 1) Split into sentences
    // 2) Score sentences by word frequency (ignoring common stopwords)
    // 3) Take the best 2 sentences as the summary
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length === 0) {
      summary = text.slice(0, 250) + (text.length > 250 ? "..." : "");
    } else {
      const stopwords = new Set([
        "the","a","an","and","or","but","if","then","else","for","on","in","at","to",
        "of","is","are","am","was","were","be","been","being","it","this","that",
        "with","as","by","from","about","into","over","after","before","between",
        "up","down","out","off","again","further","here","there","when","where",
        "why","how","all","any","both","each","few","more","most","other","some",
        "such","no","nor","not","only","own","same","so","than","too","very","can",
        "will","just"
      ]);

      // Build word frequency table
      const wordFreq = {};
      const addWords = (str) => {
        str
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean)
          .forEach(w => {
            if (stopwords.has(w)) return;
            wordFreq[w] = (wordFreq[w] || 0) + 1;
          });
      };

      addWords(text);

      // Score each sentence by sum of word frequencies
      const scored = sentences.map((s, idx) => {
        let score = 0;
        s
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean)
          .forEach(w => {
            if (wordFreq[w]) score += wordFreq[w];
          });
        // Slight bonus to earlier sentences
        score += Math.max(0, sentences.length - idx) * 0.1;
        return { s, score, idx };
      });

      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, Math.min(2, scored.length)).sort((a, b) => a.idx - b.idx);
      summary = top.map(t => t.s).join(" ");
    }

    // Safety: clamp very long summaries
    if (!summary) {
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      if (sentences.length === 0) {
        summary = text.slice(0, 250) + (text.length > 250 ? "..." : "");
      } else if (sentences.length === 1) {
        summary = sentences[0];
      } else {
        summary = sentences.slice(0, 2).join(" ");
      }
    }

    res.json({ summary });
  } catch (error) {
    console.error("Summarize error:", error);
    res.status(500).json({ error: "Failed to summarize post" });
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

    // Remove post from user's posts array
    await User.findByIdAndUpdate(post.creatorId, { $pull: { posts: post._id } });

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

// VOTE POST
router.put("/:id/vote", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { vote } = req.body; // vote should be 1 (upvote), -1 (downvote), or 0 (remove vote)
    const userId = req.user.id;

    // Remove user from both arrays first
    post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    post.downvotes = post.downvotes.filter(id => id.toString() !== userId);

    // Add to appropriate array based on vote
    if (vote === 1) {
      post.upvotes.push(userId);
    } else if (vote === -1) {
      post.downvotes.push(userId);
    }
    // If vote === 0, we just removed the vote (already done above)

    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .populate("comments.author", "username");
    
    res.json({ message: "Vote updated", post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD COMMENT
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
      replies: []
    };

    if (parentCommentId) {
      // Reply to a comment
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) return res.status(404).json({ error: "Parent comment not found" });
      parentComment.replies.push(newComment);
    } else {
      // Top-level comment
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

// VOTE COMMENT
router.put("/:id/comment/:commentId/vote", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { commentId } = req.params;
    const { vote, isReply, parentCommentId } = req.body;
    const userId = req.user.id;

    let comment;
    if (isReply && parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) return res.status(404).json({ error: "Parent comment not found" });
      comment = parentComment.replies.id(commentId);
    } else {
      comment = post.comments.id(commentId);
    }

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Remove user from both arrays
    comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
    comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);

    // Add to appropriate array
    if (vote === 1) {
      comment.upvotes.push(userId);
    } else if (vote === -1) {
      comment.downvotes.push(userId);
    }

    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .populate("comments.author", "username")
      .populate("comments.replies.author", "username");
    
    res.json({ message: "Comment vote updated", post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EDIT COMMENT
router.put("/:id/comment/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { commentId } = req.params;
    const { text, isReply, parentCommentId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    let comment;
    if (isReply && parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) return res.status(404).json({ error: "Parent comment not found" });
      comment = parentComment.replies.id(commentId);
    } else {
      comment = post.comments.id(commentId);
    }

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not allowed" });
    }

    comment.text = text.trim();
    comment.editedAt = new Date();

    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate("creatorId", "username")
      .populate("communityId", "name")
      .populate("comments.author", "username")
      .populate("comments.replies.author", "username");
    
    res.json({ message: "Comment updated", post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE COMMENT
router.delete("/:id/comment/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { commentId } = req.params;
    const { isReply, parentCommentId } = req.body;

    let comment;
    if (isReply && parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) return res.status(404).json({ error: "Parent comment not found" });
      comment = parentComment.replies.id(commentId);
    } else {
      comment = post.comments.id(commentId);
    }

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Soft delete
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
