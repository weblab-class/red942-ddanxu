import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { get, post } from "../../utilities";
import "./Player.css";

const Player = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [frame, setFrame] = useState();
  const [novel, setNovel] = useState();
  const [user, setUser] = useState();

  useEffect(() => {
    let frameId = null;

    get("/api/novel", { novelId: location.state.novelId }).then((res) => {
      document.title = res.novel.name;
      setNovel(res.novel);
      if (typeof location.state.frameId != "undefined") {
        frameId = location.state.frameId;
        get("/api/frame", { frameId: location.state.frameId }).then((res2) => setFrame(res2.frame));
      } else {
        frameId = location.state.frameId;
        get("/api/frame", { frameId: res.novel.startFrameId }).then((res2) => setFrame(res2.frame));
      }
    });

    get(`/api/user`, { userid: location.state.userId }).then((userObj) => {
      const hasPlayed = userObj.playing.some((item) => item.novelId === location.state.novelId);

      if (!hasPlayed) {
        post("/api/userPlayNew", {
          userId: location.state.userId,
          novelId: location.state.novelId,
          frameId: frameId,
        }).then();
      }

      setUser(userObj);
    });

window.scrollTo(0, 200);
  }, [location.state]);

  const nextFrame = async () => {
    if (frame.nextFrame != undefined) {
      navigate("/player/" + frame.nextFrame, {
        state: {
          novelId: novel._id,
          frameId: frame.nextFrame,
        },
        replace: true,
      });
    } else console.log("End of Novel!");
  };

  if (!frame) {
    return <h2>loading...</h2>;
  }

  return (
    <div className="visual-novel" style={{ backgroundImage: `url(${frame.background})` }}>
      {frame.spriteLeft && <img src={frame.spriteLeft} className="sprite-left" alt="sprite" />}
      {frame.spriteMid && <img src={frame.spriteMid} className="sprite-mid" alt="sprite" />}
      {frame.spriteRight && <img src={frame.spriteRight} className="sprite-right" alt="sprite" />}
      {frame.text && (
        <h3>
          {frame.text.split("\n").map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </h3>
      )}
      <button onClick={nextFrame}>next</button>
    </div>
  );
};

export default Player;
