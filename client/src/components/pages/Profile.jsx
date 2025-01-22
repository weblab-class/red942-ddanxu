import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { get } from "../../utilities";
import NovelPreview from "../modules/novelPreview";
import PopupForm from "../modules/newNovelForm";

/*
Props:
    userId as stored in mongo

@TODO
make the load more and go back buttons do stuff, use a useState for playing and editing
check if the viewer is the actual user the page belongs to and change layout based on that
*/
const Profile = () => {
  let props = useParams();
  const [user, setUser] = useState();

  useEffect(() => {
    document.title = "Profile Page";
    get(`/api/user`, { userid: props.userId }).then((userObj) => setUser(userObj));
  }, []);

  if (!user) {
    return <div> Loading!</div>;
  }

  const grab5 = (startindex, source, editing) => {
    let arr = [];
    for (let i = startindex; i < source.length; i++) {
      if (i >= startindex + 5) break;
      arr.push(source[i]);
    }
    for (let i = 0; i < arr.length; i++) {
      if (!editing)
        arr[i] = <NovelPreview novelId={arr[i].novelId} secondId={arr[i].saveId} userId = {props.userId} type="play" />;
      else
        arr[i] = (
          <NovelPreview novelId={arr[i].novelId} secondIdId={arr[i].frameId} userId = {props.userId} type={"edit"} />
        );
    }

    return { array: arr, endIndex: startindex + arr.length };
  };

  let { array: playing, endIndex: playingIndex } = grab5(0, user.playing, false);

  if (playing.length === 0) playing = <p>Looks like you haven't started any!</p>;

  let { array: editing, endIndex: editIndex } = grab5(0, user.editing, true);

  if (editing.length === 0) editing = <p>Looks like you haven't started any!</p>;

  return (
    <div>
      <h1>Hello {user.name}!</h1>
      <section>
        <h3>You are currently playing:</h3>
        <span>{playing}</span>
        {playingIndex > 5 ? <button>Go Back</button> : <></>}
        {user.playing.length > playingIndex ? <button>Next page</button> : <></>}
      </section>

      <section>
        <h3>You are currently editing:</h3>
        <span>{editing}</span>
        {editIndex > 5 ? <button>Go Back</button> : <></>}
        {user.editing.length > editIndex ? <button>Next page</button> : <></>}

        <h2>Start your next visual novel:</h2>
        <PopupForm userId={props.userId} />
      </section>
    </div>
  );
};

export default Profile;
