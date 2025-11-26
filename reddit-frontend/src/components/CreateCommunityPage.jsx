import React, { useState } from "react";
import "./CreateCommunity.css";

const CreateCommunityPage = ({ onCreate }) => {
  const [name, setName] = useState("");

  return (
    <div className="page">
      <h2>Create a Community</h2>

      <input
        type="text"
        placeholder="Community name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={() => name && onCreate(name)}>Create</button>
    </div>
  );
};

export default CreateCommunityPage;
