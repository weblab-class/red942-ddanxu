import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { get, post } from "../../utilities";
import "./Editor.css";
import ImageSelect from "../modules/imageSelect";
import AudioSelect from "../modules/audioSelect";
import TextSelect from "../modules/textSelect";

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

  const nextFrame = async () => {
    if (frame.nextFrame) {
      setFrame(frame.nextFrame);
    } else {
      const next = await post("/api/nextFrame", {oldFrameId: frame._id});
      setFrame(next.frame);
    }
  };

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
      <div>
        <TextSelect frame={frame}/>
      </div>
      <div>
        <h1>Next Frame?</h1>
        <button onClick={nextFrame}>next</button>
      </div>
      
    </>
  );
};

export default Editor;
