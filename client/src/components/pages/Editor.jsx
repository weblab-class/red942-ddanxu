import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { get, post } from "../../utilities";
import "./Editor.css";
import ImageSelect from "../modules/imageSelect";
import AudioSelect from "../modules/audioSelect";
import TextSelect from "../modules/textSelect";

/*
@TODO add a publish button that changes the public value of the Novel
*/
const Editor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [frame, setFrame] = useState();
  const [novel, setNovel] = useState();

  useEffect(() => {
    console.log("sadhsadhasdhlsajkdljkashd");

    get("/api/novel", { novelId: location.state.novelId }).then((res) => {
      setNovel(res.novel);
      if (typeof location.state.frameId != "undefined") {
        console.log("frame set to " + location.state.frameId);
        get("/api/frame", { frameId: location.state.frameId }).then((res2) => setFrame(res2.frame));
      } else
        get("/api/frame", { frameId: res.novel.startFrameId }).then((res2) => setFrame(res2.frame));
    });
  }, [location.state]);

  const refresh = () => {
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  const nextFrame = async () => {
    if (frame.nextFrame != undefined) {
      refresh();

      navigate("/editor/" + frame.nextFrame, {
        state: {
          novelId: novel._id,
          frameId: frame.nextFrame,
          userId: location.state.userId,
        },
        replace: true,
      });
    } else {
      const next = await post("/api/nextFrame", { oldFrameId: frame._id });

      navigate("/editor/" + next.frameId, {
        state: {
          novelId: novel._id,
          frameId: next.frameId,
          userId: location.state.userId,
        },
        replace: true,
      });
    }
  };

  const prevFrame = async () => {
    if (frame.prevFrames[0] != undefined) {
      refresh();

      navigate("/editor/" + frame.prevFrames[0], {
        state: {
          novelId: novel._id,
          frameId: frame.prevFrames[0],
          userId: location.state.userId,
        },
        replace: true,
      });
    }
  };

  const togglePublic = async () => {
    await post("/api/togglePublic", { novelId: novel._id });
  };

  const play = () => {
    navigate("/player/" + frame._id, {
      state: {
        novelId: novel._id,
        frameId: frame._id,
        userId: location.state.userId,
        saveId: "Editing"
      },
    });
  };

  if (!frame) {
    return <h2>loading...</h2>;
  }

  return (
    <>
      <div className="header">
        <h1>Editing {novel.name}</h1>
      </div>

      <div className="image-selects">
        <span className="image-select">
          <ImageSelect frame={frame} type="bg" />
        </span>
        <span className="image-select">
          <ImageSelect frame={frame} type="left" />
        </span>
        <span className="image-select">
          <ImageSelect frame={frame} type="mid" />
        </span>
        <span className="image-select">
          <ImageSelect frame={frame} type="right" />
        </span>
      </div>

      <div className="audio-selects">
        <span className="audio-select">
          <AudioSelect frame={frame} type="bgm" />
        </span>
        <span className="audio-select">
          <AudioSelect frame={frame} type="onPlay" />
        </span>
      </div>

      <div className="select-group">
        <div className="text-select">
          <TextSelect frame={frame} />
        </div>
        <div className="public-toggle">
          <h1>Toggle Public</h1>
          <button onClick={togglePublic}>toggle</button>
        </div>
      </div>

      <div className="navigation-group">
        <div className="prev-frame">
          <h1>Previous Frame?</h1>
          <button onClick={prevFrame}>back</button>
        </div>

        <div className="next-frame">
          <h1>Next Frame?</h1>
          <button onClick={nextFrame}>next</button>
        </div>
      </div>

      <button className="play-frame" onClick={play}>
        Play this frame
      </button>
    </>
  );
};

export default Editor;
