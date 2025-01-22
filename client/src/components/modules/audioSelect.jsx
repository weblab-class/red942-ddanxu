import React, { useState, useEffect } from "react";
import { post, get } from "../../utilities";

/*
props
  type (bgm or onPlay)
  frame

  @TODO changing the drop down doesn't appear to switch the preview audio, but it still works the same in the back end
*/
const AudioSelect = (props) => {
  const frameId = props.frame._id;
  const [file, setFile] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null); // Changed to store the entire option
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null); // To hold the Blob URL
  const [options, setOptions] = useState([]);
  const [audioName, setAudioName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      const list =
        props.type === "bgm"
          ? await get("/api/bgmsFromFrame", { frameId })
          : await get("/api/onPlaysFromFrame", { frameId });
      const parsedOptions = props.type === "bgm" ? list.bgms : list.onPlayAudios;
      setOptions(parsedOptions || []);
    };

    fetchOptions();
  }, [frameId, props.type]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  if (props.type == 'bgm') {
  useEffect(() => {
    const checkAndSetBgm = async () => {
      if (props.frame.bgm && props.frame.bgm.length > 0) {
        try {
          const arr = Array.isArray(props.frame.bgm) ? props.frame.bgm : [props.frame.bgm];
          const blob = await get("/api/audioAsBlob", { links: arr });
          console.log(blob);
          const blobUrl = URL.createObjectURL(blob);
          setPreviewBlobUrl(blobUrl);
        } catch (error) {
          console.error("Error fetching audio Blob for bgm:", error);
        }
      }
    };

    checkAndSetBgm();
  }, [props.frame.bgm]); 
} else {
  useEffect(() => {
    const checkAndSetOnPlay = async () => {
      if (props.frame.onPlayAudio && props.frame.onPlayAudio.length > 0) {
        try {
          const arr = Array.isArray(props.frame.onPlayAudio) ? props.frame.onPlayAudio : [props.frame.onPlayAudio];
          console.log(arr);
          const blob = await get("/api/audioAsBlob", { links: arr });
          console.log(blob);
          const blobUrl = URL.createObjectURL(blob);
          setPreviewBlobUrl(blobUrl);
        } catch (error) {
          console.error("Error fetching audio Blob for onPlay:", error);
        }
      }
    };

    checkAndSetOnPlay();
  }, [props.frame.onPlayAudio]);
}

  const handleDropdownChange = async (event) => {
    const selectedLink = event.target.value;
    const selectedOption = options.find((option) => JSON.stringify(option.links) === selectedLink);
    setSelectedOption(selectedOption); // Store the selected option (containing links)

    setFile(null); // Clear file selection
    setPreviewUrl(null); // Clear the previous preview

    if (selectedLink) {
      // Fetch the Blob for the selected link(s)
      try {
        const blob = await get("/api/audioAsBlob", { links: selectedOption.links });
        console.log(blob);
        const blobUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(blobUrl);

        // Clean up old Blob URL when a new one is set
        return () => URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Error fetching audio Blob:", error);
      }
    } else {
      setPreviewBlobUrl(null);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSelectedOption(null); // Clear dropdown selection
      setPreviewUrl(URL.createObjectURL(selectedFile)); // Create a local preview URL
      setPreviewBlobUrl(null); // Clear Blob URL
    }
  };

  const handleNameChange = (event) => {
    setAudioName(event.target.value);
  };

  const setAudio = (links) => {
    post("/api/set" + props.type, { links, frameId });
  };

  const submitAudio = async (event) => {
    event.preventDefault(); // Prevent default form submission

    if (!file && selectedOption) {
      setAudio(selectedOption.links);
      return;
    }

    if (file) {
      if (!audioName) {
        console.log("Please provide a name for the audio.");
        return;
      }

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("name", audioName);
      formData.append("frameId", frameId);
      formData.append("type", props.type);

      try {
        const response = await post("/api/audioUp", formData, {});

        if (response.links) {
          const newOption = { name: audioName, links: response.links };
          setOptions((prevOptions) => [...prevOptions, newOption]); // Add new option
          setSelectedOption(newOption); // Automatically select the new upload
          setPreviewUrl(response.links); // Update preview with the new audio
          setAudioName(""); // Clear the name input
        }
      } catch (error) {
        console.error("Error uploading audio:", error);
      }
    } else {
      console.log("No audio selected");
    }
  };

  return (
    <div>
      <h2>Select or Upload an Audio</h2>
      <form onSubmit={submitAudio}>
        <div>
          <label>Select an audio file ({props.type}):</label>
          <select
            value={selectedOption ? JSON.stringify(selectedOption.links) : ""}
            onChange={handleDropdownChange}
          >
            <option value="">-- Choose an audio --</option>
            {options.map((option, index) => (
              <option key={index} value={JSON.stringify(option.links)}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Or upload a new audio:</label>
          <input type="file" onChange={handleFileChange} accept="audio/*" />
        </div>

        {file && (
          <div>
            <label>Provide a name for the audio:</label>
            <input
              type="text"
              value={audioName}
              onChange={handleNameChange}
              placeholder="Enter audio name"
            />
          </div>
        )}

        {(previewUrl || previewBlobUrl) && (
          <div>
            <h3>Preview:</h3>
            <audio controls>
              <source src={previewBlobUrl || previewUrl} type={"audio/mpeg"} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AudioSelect;
