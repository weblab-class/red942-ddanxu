import React, { useState } from "react";
import { post } from "../../utilities";
import { useNavigate } from "react-router-dom";

/*
@TODO
make a loading text appear whenever you press the create button
*/
const PopupForm = (props) => {
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("thumbnail", thumbnail);
    formData.append("userId", props.userId);

    const response = await post("/api/newNovel", formData, {});

    navigate("/editor/" + props.userId, {
      state: {
        novelId: response.novelId,
      },
    });
  };

  return (
    <div>
      <button
        onClick={() => {
          setShowPopup(true);
          setTimeout(() => {
            window.scrollTo(0, 500);
          }, 100);
        }}
      >
        Create new project!
      </button>

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <button onClick={() => setShowPopup(false)}>back</button>
            <form onSubmit={handleSubmit}>
              <div>
                <label>
                  Name:
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Thumbnail:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setThumbnail(event.target.files[0])}
                    required
                  />
                </label>
              </div>
              <button type="submit">Create!</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupForm;
