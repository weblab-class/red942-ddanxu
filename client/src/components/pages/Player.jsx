import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { get, post } from "../../utilities";
import "./Editor.css";

const Player = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [frame, setFrame] = useState();
  const [novel, setNovel] = useState();
  const [user, setUser] = useState();

  useEffect(() => {

    let frameId = null

    get("/api/novel", { novelId: location.state.novelId }).then((res) => {
      Document.title = res.novel.name;
      setNovel(res.novel);
      if (typeof location.state.frameId != "undefined") {
        frameId = location.state.frameId
        get("/api/frame", { frameId: location.state.frameId }).then((res2) => setFrame(res2.frame));
      } else {
        frameId = location.state.frameId
        get("/api/frame", { frameId: res.novel.startFrameId }).then((res2) => setFrame(res2.frame));
      }
    });

    
    get(`/api/user`, { userid: location.state.userId }).then((userObj) => {
        const hasPlayed = userObj.playing.some(item => item.novelId === location.state.novelId);

        if (!hasPlayed) {
            post('/api/userPlayNew', {userId:location.state.userId, novelId:location.state.novelId, frameId: frameId}).then();
        }

        setUser(userObj)
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

      navigate("/player/" + frame.nextFrame, {
        state: {
          novelId: novel._id,
          frameId: frame.nextFrame,
        }, replace: true
      });
    } else 
      console.log("End of Novel!");
  };



  if (!frame) {
    return <h2>loading...</h2>;
  }

  return (
    <>
      <h1>Playing {novel.name}</h1>
      <h3>Currently looking at frame with id {frame._id}</h3>
      <img src={frame.background}/>
      <img src={frame.spriteLeft}/>
      <img src={frame.spriteMid}/>
      <img src={frame.spriteRight}/>
      <h3>{frame.text}</h3>
      <button onClick={nextFrame}>next</button>
    </>
  );
};

export default Player;
