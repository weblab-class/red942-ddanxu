import React, { useState } from "react";
import { post } from "../../utilities";

const AudioUpload = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    console.log("Selected File:", selectedFile);
    setFile(selectedFile);
  };

  const submitAudio = async (event) => {
    event.preventDefault(); // Prevent default form submission
    if (!file) {
      console.log("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await post("/api/audioUp", formData, {});
      console.log(response);
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  return (
    <div>
      <h2>Upload an Audio File</h2>
      <form onSubmit={submitAudio}>
        <input type="file" onChange={handleFileChange} accept="audio/*" />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default AudioUpload;
