import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { get, post } from "../../utilities";
import "./Player.css";
import AudioPlayer from "../modules/audioPlayer";

const Player = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [frame, setFrame] = useState();
  const [novel, setNovel] = useState();
  const [user, setUser] = useState();
  const [saveId, setSaveId] = useState();
  const [onPlay, setOnPlay] = useState();
  const [bgm, setBgm] = useState();
  const [preloadedBlobs, setPreloadedBlobs] = useState(new Map());

  useEffect(() => {
    let frameId = null;

    get("/api/novel", { novelId: location.state.novelId }).then((res) => {
      document.title = res.novel.name;
      setNovel(res.novel);
      frameId = location.state.frameId || res.novel.startFrameId;
      get("/api/frame", { frameId }).then((res2) => setFrame(res2.frame));
    });

    get(`/api/user`, { userid: location.state.userId }).then((userObj) => {
      const hasPlayed = userObj.playing.some((item) => item.novelId === location.state.novelId);

      if (!hasPlayed) {
        post("/api/userPlayNew", {
          userId: location.state.userId,
          novelId: location.state.novelId,
          frameId,
        }).then((res) => {
          setSaveId(res.saveId);
          console.log("saveId set to " + res.saveId);
        });
      } else {
        setSaveId(location.state.saveId);
        console.log("saveId set to (from l.s)" + location.state.saveId)
      }
      setUser(userObj);
    });

    setTimeout(() => {
      window.scrollTo(0, 200);
    }, 100);
  }, [location.state]);

  useEffect(() => {
    if (!frame) return;

    let isMounted = true;

    get("/api/next5sounds", { frameId: frame._id }).then(({ bgms, onPlays }) => {
      const newBlobs = new Map(preloadedBlobs);

      Promise.all(
        [...bgms, ...onPlays].map((link) =>
          newBlobs.has(link)
            ? Promise.resolve()
            : get("/api/audioAsBlob", { links: [link] }).then((blob) => {
                const blobUrl = URL.createObjectURL(blob);
                newBlobs.set(link, blobUrl);
              })
        )
      ).then(() => {
        if (isMounted) setPreloadedBlobs(new Map(newBlobs));
      });
    });

    return () => {
      isMounted = false;
      preloadedBlobs.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    };
  }, [frame]);

  useEffect(() => {
    if (!frame) return;

    setOnPlay(
      <AudioPlayer
        key={frame._id + "-play"}
        blobUrl={preloadedBlobs.get(frame.onPlayAudio?.[0])}
        loops={false}
      />
    );

    if (bgm?.props.blobUrl !== preloadedBlobs.get(frame.bgm?.[0])) {
      setBgm(
        <AudioPlayer
          key={frame._id + "-bgm"}
          blobUrl={preloadedBlobs.get(frame.bgm?.[0])}
          loops={true}
        />
      );
    }
  }, [frame, preloadedBlobs]);

  const nextFrame = () => {
    if (frame.nextFrame) {
      if (saveId !== "editor")
        post("/api/nextFrameSave", { saveId: saveId, nextFrame: frame.nextFrame });
      navigate("/player/" + frame.nextFrame, {
        state: {
          novelId: novel._id,
          frameId: frame.nextFrame,
        },
        replace: true,
      });
    } else {
      console.log("End of Novel!");
    }
  };

  if (!frame) {
    return <h2>loading...</h2>;
  }

  return (
    <div className="visual-novel" style={{ backgroundImage: `url(${frame.background})` }}>
      {onPlay}
      {bgm}
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
