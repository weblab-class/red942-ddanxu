import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { get } from "../../utilities";
import "./Editor.css";
import ImageSelect from "../modules/imageSelect";
import AudioSelect from "../modules/audioSelect";

const Editor = () => {
  const location = useLocation();
  const [frame, setFrame] = useState();
  const [novel, setNovel] = useState();

  useEffect(() => {
    get("/api/novel", { novelId: location.state.novelId }).then((res) => {
      setNovel(res.novel);
      get("/api/frame", { frameId: res.novel.startFrameId }).then((res2) => setFrame(res2.frame));
    });
  }, []);

  if (!frame) {
    return <h2>loading...</h2>;
  }

  return (
    <>
      <h1>Editing {novel.name}</h1>
      <h3>Currently looking at frame with id {frame._id}</h3>
      <img src={novel.thumbnail} />
      <span>
        <ImageSelect frame={frame} type="bg" />
        <ImageSelect frame={frame} type="left" />
        <ImageSelect frame={frame} type="mid" />
        <ImageSelect frame={frame} type="right" />
      </span>
      <span>
        <AudioSelect frame={frame} type="bgm"/>
        <AudioSelect frame={frame} type="onPlay"/>
      </span>
    </>
  );
};

export default Editor;
