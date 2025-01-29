import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { get } from "../../utilities";
import NovelPreview from "../modules/novelPreview";
import PopupForm from "../modules/newNovelForm";
import "./Profile.css";

const Profile = () => {
  let props = useParams();
  const [user, setUser] = useState();
  const [playingIndex, setPlayingIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState(0);

  useEffect(() => {
    document.title = "Profile Page";
    get(`/api/user`, { userid: props.userId }).then((userObj) => setUser(userObj));
  }, [props.userId]);

  if (!user) {
    return <div> Loading!</div>;
  }

  const grab5 = (startIndex, source, editing) => {
    let arr = [];
    for (let i = startIndex; i < source.length; i++) {
      if (i >= startIndex + 5) break;
      arr.push(source[i]);
    }
    for (let i = 0; i < arr.length; i++) {
      if (!editing)
        arr[i] = (
          <NovelPreview
            novelId={arr[i].novelId}
            secondId={arr[i].saveId}
            userId={props.userId}
            type="play"
            key={arr[i].novelId}
          />
        );
      else
        arr[i] = (
          <NovelPreview
            novelId={arr[i].novelId}
            secondId={arr[i].frameId}
            userId={props.userId}
            type="edit"
            key={arr[i].novelId}
          />
        );
    }

    return { array: arr, endIndex: startIndex + arr.length };
  };

  let { array: playing, endIndex: newPlayingIndex } = grab5(playingIndex, user.playing, false);
  let { array: editing, endIndex: newEditingIndex } = grab5(editingIndex, user.editing, true);

  if (playing.length === 0) playing = <p>Looks like you haven't started any!</p>;
  if (editing.length === 0) editing = <p>Looks like you haven't started any!</p>;

  const handleNextPlaying = () => {
    if (newPlayingIndex < user.playing.length) {
      setPlayingIndex(newPlayingIndex);
    }
  };

  const handlePreviousPlaying = () => {
    if (playingIndex > 0) {
      setPlayingIndex(playingIndex - 5);
    }
  };

  const handleNextEditing = () => {
    if (newEditingIndex < user.editing.length) {
      setEditingIndex(newEditingIndex);
    }
  };

  const handlePreviousEditing = () => {
    if (editingIndex > 0) {
      setEditingIndex(editingIndex - 5);
    }
  };

  return (
    <div>
      <h1>Hello {user.name}!</h1>

      <section className="group-container">
        <h3>You are currently playing:</h3>
        <span className="horizontal-group">
          {playing && playing.length > 0 ? (
            playing.map((item, index) => <span key={index}>{item}</span>)
          ) : (
            <span>Not playing any novels yet</span>
          )}
        </span>
        <div className="button-container">
          {playingIndex > 0 && <button onClick={handlePreviousPlaying}>Go Back</button>}
          {playing && user.playing.length > newPlayingIndex && (
            <button onClick={handleNextPlaying}>Next page</button>
          )}
        </div>
      </section>

      <section className="group-container">
        <h3>You are currently editing:</h3>
        <span className="horizontal-group">
          {editing && editing.length > 0 ? (
            editing.map((item, index) => <span key={index}>{item}</span>)
          ) : (
            <span>Not editing any novels yet</span>
          )}
        </span>
        <div className="button-container">
          {editingIndex > 0 && <button onClick={handlePreviousEditing}>Go Back</button>}
          {editing && user.editing.length > newEditingIndex && (
            <button onClick={handleNextEditing}>Next page</button>
          )}
        </div>

        <h2>Start your next visual novel:</h2>
        <PopupForm userId={props.userId} />
      </section>
    </div>
  );
};

export default Profile;
