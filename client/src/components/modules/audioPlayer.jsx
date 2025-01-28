import React, { useEffect, useState } from "react";

/*
props:
  blobUrl: Preloaded audio blob URL
  loops: Boolean indicating if audio should loop
*/
const AudioPlayer = ({ blobUrl, loops }) => {
  const [currentBlob, setCurrentBlob] = useState(null);

  useEffect(() => {
    if (currentBlob && currentBlob !== blobUrl) {
      URL.revokeObjectURL(currentBlob); // Clean up old blob
    }
    setCurrentBlob(blobUrl);
  }, [blobUrl]);

  return !blobUrl ? (
    <></>
  ) : loops ? (
    <audio autoPlay loop>
      <source src={blobUrl} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  ) : (
    <audio autoPlay>
      <source src={blobUrl} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
};

export default AudioPlayer;
