import React, { useState, useEffect } from "react";
import { post, get } from "../../utilities";

/*
props
    frame
    type (bg, left, mid, right)

    @TODO shouldn't store the stuff in the db if it doesn't have an associated link when it fails
    @TODO selector should change upon loading in to previously saved
      harder than it sounds as currently just storing the link and don't know what name it is
    @TODO make names unique
*/

const ImageSelect = (props) => {
  const frameId = props.frame._id;
  const [file, setFile] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  let prevTemp;
  switch (props.type) {
    case "bg":
      prevTemp = props.frame.background;
      break;
    case "left":
      prevTemp = props.frame.spriteLeft;
      break;
    case "mid":
      prevTemp = props.frame.spriteMid;
      break;
    case "right":
      prevTemp = props.frame.spriteRight;
      break;
  }
  const [previewUrl, setPreviewUrl] = useState(prevTemp);
  const [options, setOptions] = useState([]); // Local options state
  const [imageName, setImageName] = useState("");

  useEffect(() => {
    let list;
    const fetchOptions = async () => {
      list =
        props.type === "bg"
          ? await get("/api/bgsFromFrame", { frameId: frameId })
          : await get("/api/spritesFromFrame", { frameId: frameId });
      list = props.type === "bg" ? list.backgrounds : list.sprites;

      setOptions(list || []);
    };

    fetchOptions();
  }, []);

  const handleDropdownChange = (event) => {
    const selectedLink = event.target.value;
    setSelectedOption(selectedLink);
    setFile(null); // Clear file selection if dropdown is used
    setPreviewUrl(selectedLink); // Update the preview
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSelectedOption(""); // Clear dropdown selection if file is uploaded
      setPreviewUrl(URL.createObjectURL(selectedFile)); // Create a local preview URL
    }
  };

  const handleNameChange = (event) => {
    setImageName(event.target.value);
  };

  const setImage = (link) => {
    post("/api/set" + props.type, { link: link, frameId: frameId });
  };

  const submitImg = async (event) => {
    event.preventDefault(); // Prevent default form submission

    if (!file && selectedOption) {
      setImage(selectedOption);
      return;
    }

    if (file) {
      if (!imageName) {
        console.log("Please provide a name for the image.");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", imageName);
      formData.append("frameId", frameId);
      formData.append("type", props.type);

      try {
        const response = await post("/api/imgUp", formData, {});
        console.log(response);

        // Assuming the response contains the new image's name and link
        if (response.link) {
          const newOption = { name: imageName, link: response.link };
          setOptions((prevOptions) => [...prevOptions, newOption]); // Add new option
          setSelectedOption(response.link); // Automatically select the new upload
          setPreviewUrl(response.link); // Update preview with the new image
          setImageName(""); // Clear the name input
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    } else {
      console.log("No image selected");
    }
  };

  return (
    <div>
      <h2>Select or Upload an Image</h2>
      <form onSubmit={submitImg}>
        <div>
          <label>Select an image ({props.type}):</label>
          <select value={selectedOption} onChange={handleDropdownChange}>
            <option value="">-- Choose an image --</option>
            {options.map((option, index) => (
              <option key={index} value={option.link}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Or upload a new image:</label>
          <input type="file" onChange={handleFileChange} accept="image/*" />
        </div>

        {file && (
          <div>
            <label>Provide a name for the image:</label>
            <input
              type="text"
              value={imageName}
              onChange={handleNameChange}
              placeholder="Enter image name"
            />
          </div>
        )}

        {previewUrl && (
          <div>
            <h3>Preview:</h3>
            <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", height: "auto" }} />
          </div>
        )}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ImageSelect;
