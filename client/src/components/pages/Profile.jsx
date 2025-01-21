import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { get } from "../../utilities";
import NovelPreview from "../modules/novelPreview";

/*
Props:
    user._id as stored in mongo

@TODO
make the load more and go back buttons do stuff, use a useState for playing and editing
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
    arr = [];
    for (let i = startindex; i < source.length; i++) {
      if (i >= startindex + 5) break;
      arr.push(source[i]);
    }
    for (let i = 0; i < arr.length; i++) {
      if (!editing) arr[i] = <NovelPreview novelId={arr[i].novelId} saveId={arr[i].saveId} />;
      else
        arr[i] = <NovelPreview novelId={arr[i].novelId} frameId={arr[i].frameId} editor={true} />;
    }

    return { array: arr, endIndex: startindex + arr.length };
  };

  let { arr: playing, endIndex: playingIndex } = JSON.parse(grab5(0, user.playing, false));

  if (playing.length === 0) playing = <h4>Looks like you haven't started any!</h4>;

  let { arr: editing, endIndex: editIndex } = JSON.parse(grab5(0, user.editing, true));

  if (editing.length === 0) editing = <h4>Looks like you haven't started any!</h4>;

  return (
    <div>
      <h1>Hello {user.name}!</h1>
      <section>
        <h3>You are currently playing:</h3>
        {playing}
        {playingIndex > 5 ? <Button>Go Back</Button> : <></>}
        {user.playing.length > playingIndex ? <Button>Next page</Button> : <></>}
      </section>

      <section>
        <h3>You are currently editing:</h3>
        {editing}
        {editIndex > 5 ? <Button>Go Back</Button> : <></>}
        {user.editing.length > editIndex ? <Button>Next page</Button> : <></>}
      </section>
    </div>
  );
};

export default Profile;
