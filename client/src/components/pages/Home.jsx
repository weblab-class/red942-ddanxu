import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { get } from "../../utilities.js";

import "../../utilities.css";
import "./Skeleton.css";
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
        const arr = publicNovels.map((novel) => (<NovelPreview novelId={novel} secondId={undefined} userId={userId} type={"play"}/>));

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
      <h1>Welcome to VNForge!</h1>
      <p>
        Sign in above and navigate to your profile to begin making visual
        novels! Or check out some published ones:
      </p>

      {/* Show novels only if the user is logged in */}
      {userId ? (
        <div>
          {novels.length > 0 ? (
             novels
          ) : (
            <p>No novels available at the moment.</p>
          )}
        </div>
      ) : (
        <p>Please log in to see published novels.</p>
      )}
    </>
  );
};

export default Home;
