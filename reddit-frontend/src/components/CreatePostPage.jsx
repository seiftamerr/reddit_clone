import React, { useState } from "react";
import "./CreatePostPage.css";

const CreatePostPage = ({ community, onCreate }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="page">
      <h2>Create Post in r/{community.name}</h2>

      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Post content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={() =>
          title && content && onCreate(community._id, title, content)
        }
      >
        Post
      </button>
    </div>
  );
};

export default CreatePostPage;
