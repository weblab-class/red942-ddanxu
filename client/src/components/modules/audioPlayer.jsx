import React, { useState, useEffect } from "react";
import { get } from "../../utilities";

/*
props
    links: the array to the audio
*/
const AudioPlayer = (props) => {
  const [blobUrl, setBlobUrl] = useState(null); // To hold the Blob URL

  useEffect(() => {
    console.log("setting new audio");
    get("/api/audioAsBlob", { links: props.links }).then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      setBlobUrl(blobUrl);
      console.log(blob);
    });
  }, []);

  return !blobUrl ? (
    <></>
  ) : props.loops ? (
    <audio autoPlay loop>
      <source src={blobUrl} type={"audio/mpeg"} />
      Your browser does not support the audio element.
    </audio>
  ) : (
    <audio autoPlay>
      <source src={blobUrl} type={"audio/mpeg"} />
      Your browser does not support the audio element.
    </audio>
  );
};

export default AudioPlayer;
