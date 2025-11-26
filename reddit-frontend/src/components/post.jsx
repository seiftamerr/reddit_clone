import React from 'react';

const Post = ({ title, content, author }) => {
  return (
    <div className="post">
      <h2>{title}</h2>
      <p>{content}</p>
      <small>Posted by {author}</small>
    </div>
  );
};

export default Post;
