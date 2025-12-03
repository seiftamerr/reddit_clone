import React, { useState, useEffect, useRef } from "react";
import "./CreatePostPage.css";

const CreatePostPage = ({ community, onCreate }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [pasteIndicator, setPasteIndicator] = useState(false);
  const pageRef = useRef(null);

  const processImage = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please paste an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
        setImagePreview(reader.result);
        setPasteIndicator(true);
        setTimeout(() => setPasteIndicator(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    processImage(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        processImage(file);
        break;
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
  };

  return (
    <div className="page" ref={pageRef} onPaste={handlePaste} tabIndex={0}>
      {pasteIndicator && (
        <div className="paste-indicator">
          ✓ Image pasted!
        </div>
      )}
      <h2>Create Post in r/{community.name}</h2>

      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Post content... (optional)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="image-upload-section">
        <label className="image-upload-label">
          {imagePreview ? "Change Image" : "Upload Image (optional)"}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </label>
        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button type="button" onClick={handleRemoveImage} className="remove-image-btn">
              Remove
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-tertiary)" }}>
        {imageUrl && !content && <span>✓ Image ready to post</span>}
        {!title && <span>Enter a title to post</span>}
        {title && !content && !imageUrl && <span>Add content or an image to post</span>}
      </div>
      <button
        onClick={() => {
          if (title && (content || imageUrl)) {
            onCreate(community._id, title, content || "", imageUrl || "");
            // Reset form after posting
            setTitle("");
            setContent("");
            setImageUrl("");
            setImagePreview("");
          }
        }}
        disabled={!title || (!content && !imageUrl)}
        style={{ marginTop: "12px" }}
      >
        Post
      </button>
    </div>
  );
};

export default CreatePostPage;
