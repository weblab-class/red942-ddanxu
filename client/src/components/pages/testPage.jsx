import React, { useState } from "react";
import { post } from "../../utilities";

const FileUploader = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await post("/api/testGoogUp", formData, {});

    const data = await response.fileId;
    alert(`File uploaded! File ID: ${data}`);
  };

  return (
    <div>
      <h2>Upload File to Google Drive</h2>
      <input type="file" onChange={handleFileChange} accept="audio/*" />
      <button onClick={uploadFile}>Upload</button>
    </div>
  );
};

export default FileUploader;
