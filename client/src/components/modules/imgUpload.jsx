import React, { useState } from "react";
import { post } from "../../utilities";

const ImgUpload = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    console.log("Selected File:", selectedFile);
    setFile(selectedFile);
  };

  const submitImg = async (event) => {
    event.preventDefault(); // Prevent default form submission
    if (!file) {
      console.log("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await post("/api/imgUp", formData, {});
      console.log(response);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div>
      <h2>Upload an Image</h2>
      <form onSubmit={submitImg}>
        <input type="file" onChange={handleFileChange} accept="video/*" />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default ImgUpload;
