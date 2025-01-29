import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { get } from "../../utilities.js";

import "../../utilities.css";
import "./Home.css";
import NovelPreview from "../modules/novelPreview.jsx";

const Home = () => {
  const { userId } = useOutletContext();
  const [novels, setNovels] = useState([]);

  // Fetch novels when the component mounts if the user is logged in
  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const res = await get("/api/publicNovels");
        const publicNovels = res.novels;

        // Create the array of NovelPreview props
        const arr = publicNovels.map((novel) => (
          <NovelPreview novelId={novel} secondId={undefined} userId={userId} type={"play"} />
        ));

        setNovels(arr);
      } catch (error) {
        console.error("Error fetching novels:", error);
      }
    };

    if (userId) {
      fetchNovels();
    }
  }, [userId]);

  return (
    <>
      <h1 className="sectionHeader">Welcome to VNForge!</h1>
      <p className="sectionHeader">
        Sign in above and navigate to your profile to begin making visual novels! Or check out some
        published ones:
      </p>

      <p className="sectionHeader" style={{ color: "#BB8555" }}>
        Make sure to allow audio autoplay on this site so you can hear the novels!
      </p>

      {userId ? (
        <div className="sectionWrapper">
          {novels.length > 0 ? (
            <div className="container">
              {novels.map((novel, index) => (
                <div key={index} className="novelPreview">
                  {novel}
                </div>
              ))}
            </div>
          ) : (
            <p className="notice">No novels available at the moment.</p>
          )}
        </div>
      ) : (
        <p className="notice">Please log in to see published novels.</p>
      )}
    </>
  );
};

export default Home;
