import React, { useState, useEffect, useCallback, useRef } from "react";
import "./PostPage.css";
import { API_URL } from "../config";

const PostPage = ({ post, onBack, onAddComment, user, onDeletePost, onEditPost, onViewUserProfile }) => {
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentPost, setCurrentPost] = useState(post);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [commentSort, setCommentSort] = useState("new");
  const [showEditPost, setShowEditPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const editTitleRef = useRef(null);
  const replyTextareaRefs = useRef({});
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Focus textarea when reply form opens
  useEffect(() => {
    if (replyingTo && replyTextareaRefs.current[replyingTo]) {
      replyTextareaRefs.current[replyingTo].focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setCurrentPost(post);
    if (post) {
      setEditPostTitle(post.title || "");
      setEditPostContent(post.content || "");
    }
  }, [post]);

  useEffect(() => {
    const refreshPost = async () => {
      if (!currentPost?._id) return;
      try {
        const res = await fetch(`${API_URL}/posts/${currentPost._id}?sort=${commentSort}`);
        const data = await res.json();
        if (res.ok) {
          setCurrentPost(data);
        }
      } catch (err) {
        console.error("Error refreshing post:", err);
      }
    };
    refreshPost();
  }, [commentSort]);

  // Focus the title input when entering edit mode
  useEffect(() => {
    if (showEditPost && editTitleRef.current) {
      editTitleRef.current.focus();
      editTitleRef.current.select && editTitleRef.current.select();
    }
  }, [showEditPost]);

  if (!currentPost) return <p>Loading post...</p>;

  const voteCount = (currentPost.upvotes?.length || 0) - (currentPost.downvotes?.length || 0);
  const isPostOwner = user && currentPost.creatorId && 
    (currentPost.creatorId._id?.toString() === user._id?.toString() || 
     currentPost.creatorId.toString() === user._id?.toString());

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in to comment");
      return;
    }
    if (!commentText.trim()) {
      alert("Please enter a comment");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/posts/${currentPost._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPost(data.post);
        setCommentText("");
      } else {
        alert(data.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleReply = async (parentCommentId, text) => {
    if (!isLoggedIn) {
      alert("Please log in to reply");
      return;
    }
    if (!text.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/posts/${currentPost._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, parentCommentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPost(data.post);
        setReplyText({ ...replyText, [parentCommentId]: "" });
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error replying:", error);
    }
  };

  const handleCommentVote = async (commentId, vote, isReply = false, parentCommentId = null) => {
    if (!isLoggedIn) {
      alert("Please log in to vote");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/posts/${currentPost._id}/comment/${commentId}/vote`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote, isReply, parentCommentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPost(data.post);
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleEditComment = async (commentId, newText, isReply = false, parentCommentId = null) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/posts/${currentPost._id}/comment/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newText, isReply, parentCommentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPost(data.post);
        setEditingComment(null);
      }
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  const handleDeleteComment = async (commentId, isReply = false, parentCommentId = null) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/posts/${currentPost._id}/comment/${commentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isReply, parentCommentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPost(data.post);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    if (onDeletePost) {
      await onDeletePost(currentPost._id);
    }
  };

  const handleSummarize = async () => {
    if (!currentPost?._id) return;
    setSummaryError("");
    setIsSummarizing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/posts/${currentPost._id}/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSummaryError(data.error || "Failed to summarize post");
      } else {
        setSummary(data.summary || "");
      }
    } catch (err) {
      console.error("Summarize error:", err);
      setSummaryError("Failed to summarize post");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleEditPost = async () => {
    if (!editPostTitle.trim() || !editPostContent.trim()) {
      alert("Title and content are required");
      return;
    }
    if (onEditPost) {
      await onEditPost(currentPost._id, editPostTitle, editPostContent);
      setShowEditPost(false);
    }
  };

  const Comment = ({ comment, isReply = false, parentCommentId = null }) => {
    if (comment.isDeleted) {
      return (
        <div className="comment deleted">
          <div className="comment-text">[deleted]</div>
        </div>
      );
    }

    const commentVoteCount = (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0);
    const userVote = user ? 
      (comment.upvotes?.some(id => id.toString() === user._id || id._id === user._id) ? 1 :
       comment.downvotes?.some(id => id.toString() === user._id || id._id === user._id) ? -1 : 0)
      : 0;
    const isCommentOwner = user && comment.author && 
      (comment.author._id?.toString() === user._id?.toString() || 
       comment.author.toString() === user._id?.toString());
    const isEditing = editingComment === comment._id;

    return (
      <div className={`comment ${isReply ? "reply" : ""}`}>
        <div className="comment-header">
          <span className="comment-author">
            {comment.author?._id ? (
              <button
                className="username-link"
                onClick={() => {
                  if (onViewUserProfile && comment.author._id) {
                    onViewUserProfile(comment.author._id);
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0079d3",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  font: "inherit",
                }}
              >
                {comment.author.username || "Unknown"}
              </button>
            ) : (
              <span>{comment.author?.username || "Unknown"}</span>
            )}
          </span>
          <span className="comment-date">
            {new Date(comment.createdAt).toLocaleDateString()}
            {comment.editedAt && " (edited)"}
          </span>
        </div>
        
        {isEditing ? (
          <div className="comment-edit">
            <textarea
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
            />
            <div className="comment-edit-actions">
              <button onClick={() => {
                handleEditComment(comment._id, editCommentText, isReply, parentCommentId);
                setEditingComment(null);
                setEditCommentText("");
              }}>Save</button>
              <button onClick={() => {
                setEditingComment(null);
                setEditCommentText("");
              }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="comment-text">{comment.text}</div>
        )}

        <div className="comment-actions">
          <div className="comment-voting">
            <button
              className="comment-vote-btn"
              onClick={() => {
                const newVote = userVote === 1 ? 0 : 1;
                handleCommentVote(comment._id, newVote, isReply, parentCommentId);
              }}
              style={{
                backgroundColor: userVote === 1 ? "#ff4500" : "transparent",
                color: userVote === 1 ? "white" : "black",
              }}
            >
              ▲
            </button>
            <span className="comment-vote-count">{commentVoteCount}</span>
            <button
              className="comment-vote-btn"
              onClick={() => {
                const newVote = userVote === -1 ? 0 : -1;
                handleCommentVote(comment._id, newVote, isReply, parentCommentId);
              }}
              style={{
                backgroundColor: userVote === -1 ? "#7193ff" : "transparent",
                color: userVote === -1 ? "white" : "black",
              }}
            >
              ▼
            </button>
          </div>
          
          {!isReply && (
            <button
              className="comment-action-btn"
              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
            >
              Reply
            </button>
          )}
          
          {isCommentOwner && !isEditing && (
            <>
              <button
                className="comment-action-btn"
                onClick={() => {
                  setEditingComment(comment._id);
                  setEditCommentText(comment.text || "");
                }}
              >
                Edit
              </button>
              <button
                className="comment-action-btn delete"
                onClick={() => handleDeleteComment(comment._id, isReply, parentCommentId)}
              >
                Delete
              </button>
            </>
          )}
        </div>

        {replyingTo === comment._id && (
          <div key={`reply-form-${comment._id}`} className="reply-form">
            <textarea
              dir="ltr"
              ref={(el) => {
                if (el) {
                  replyTextareaRefs.current[comment._id] = el;
                }
              }}
              value={replyText[comment._id] || ""}
              onChange={(e) => {
                const textarea = e.target;
                const cursorPosition = textarea.selectionStart;
                const value = textarea.value;
                
                setReplyText(prev => {
                  const newState = { ...prev };
                  newState[comment._id] = value;
                  return newState;
                });
                
                // Restore cursor position after state update
                setTimeout(() => {
                  if (replyTextareaRefs.current[comment._id]) {
                    const ref = replyTextareaRefs.current[comment._id];
                    ref.focus();
                    ref.setSelectionRange(cursorPosition, cursorPosition);
                  }
                }, 0);
              }}
              placeholder="Write a reply..."
              autoFocus
            />
            <div className="reply-actions">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleReply(comment._id, replyText[comment._id] || "");
                }}
              >
                Reply
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setReplyingTo(null);
                  setReplyText(prev => {
                    const newReplyText = { ...prev };
                    newReplyText[comment._id] = "";
                    return newReplyText;
                  });
                  delete replyTextareaRefs.current[comment._id];
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="replies">
            {comment.replies.map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                isReply={true}
                parentCommentId={comment._id}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`post-page ${showEditPost ? "post-editing" : ""}`}>
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="post-content-wrapper">
        <div className="post-content">
          {showEditPost ? (
            <div className="edit-post-form">
              <input
                ref={editTitleRef}
                type="text"
                value={editPostTitle}
                onChange={(e) => setEditPostTitle(e.target.value)}
                placeholder="Post title"
              />
              <textarea
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                placeholder="Post content"
              />
              <div className="edit-post-actions">
                <button onClick={handleEditPost}>Save</button>
                <button onClick={() => setShowEditPost(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="post-header">
                <h2>{currentPost.title}</h2>
              </div>
              <p className="post-author">
                By{" "}
                {currentPost.creatorId?._id ? (
                  <button
                    className="username-link"
                    onClick={() => {
                      if (onViewUserProfile && currentPost.creatorId._id) {
                        onViewUserProfile(currentPost.creatorId._id);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0079d3",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                      font: "inherit",
                    }}
                  >
                    {currentPost.creatorId.username || "Unknown"}
                  </button>
                ) : (
                  <span>{currentPost.creatorId?.username || "Unknown"}</span>
                )}{" "}
                • r/{currentPost.communityId?.name || "Unknown"}
              </p>
              <div className="post-content-actions">
                <div className="post-content-main">
                  {currentPost.content && <p>{currentPost.content}</p>}
                  {currentPost.imageUrl && (
                    <div className="post-image-container">
                      <img src={currentPost.imageUrl} alt={currentPost.title} className="post-image" />
                    </div>
                  )}
                </div>
                <div className="post-actions">
                  {isPostOwner && (
                    <>
                      <button className="edit-btn" onClick={() => setShowEditPost(true)}>Edit</button>
                      <button className="delete-btn" onClick={handleDeletePost}>Delete</button>
                    </>
                  )}
                  <button
                    type="button"
                    className="ai-summary-btn"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    {isSummarizing ? "Summarizing..." : "Summarize with AI"}
                  </button>
                </div>
              </div>
              <div className="post-stats">
                <span className="vote-count-display">{voteCount} votes</span>
                <span>{currentPost.comments?.filter(c => !c.isDeleted).length || 0} comments</span>
              </div>
              {summaryError && <p className="error-message">{summaryError}</p>}
              {summary && (
                <div className="ai-summary-box">
                  <h4>AI Summary</h4>
                  <p>{summary}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="comment-input-box">
        <h3>Add a Comment</h3>
        <form onSubmit={handleAddComment}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What are your thoughts?"
            disabled={!isLoggedIn}
          />
          <button type="submit" className="comment-submit-btn" disabled={!isLoggedIn}>
            Comment
          </button>
        </form>
      </div>

      <div className="comments-section">
        <div className="comments-header">
          <h3>Comments ({currentPost.comments?.filter(c => !c.isDeleted).length || 0})</h3>
          <select
            value={commentSort}
            onChange={(e) => setCommentSort(e.target.value)}
            className="comment-sort"
          >
            <option value="new">New</option>
            <option value="top">Top (Most Votes)</option>
          </select>
        </div>
        {!currentPost.comments || currentPost.comments.filter(c => !c.isDeleted).length === 0 ? (
          <p>No comments yet. Be the first to comment!</p>
        ) : (
          currentPost.comments
            .filter(c => !c.isDeleted)
            .map((comment) => (
              <Comment key={comment._id} comment={comment} />
            ))
        )}
      </div>
    </div>
  );
};

export default PostPage;
