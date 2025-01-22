import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./Skeleton.css";
import { UserContext } from "../App";

//temporary
import { post } from "../../utilities.js";
import AudioUpload from "../modules/audioUpload.jsx";


const Skeleton = () => {
  return (
    <>
      <h1>Good luck on your project </h1>
      <h2> What you need to change in this skeleton</h2>
      <ul>
        <li>
          Change the Frontend CLIENT_ID (index.jsx) to your team's CLIENT_ID (obtain this at
          http://weblab.is/clientid)
        </li>
        <li>Change the Server CLIENT_ID to the same CLIENT_ID (auth.js)</li>
        <li>
          Change the Database SRV (mongoConnectionURL) for Atlas (server.js). You got this in the
          MongoDB setup.
        </li>
        <li>Change the Database Name for MongoDB to whatever you put in the SRV (server.js)</li>
      </ul>
      <h2>How to go from this skeleton to our actual app</h2>
      <a href="https://docs.google.com/document/d/110JdHAn3Wnp3_AyQLkqH2W8h5oby7OVsYIeHYSiUzRs/edit?usp=sharing">
        Check out this getting started guide
      </a>

      <button onClick = {() => {post("/api/imgUp");}}>
        imgTest
      </button>

      <AudioUpload/>
    </>
  );
};

export default Skeleton;
