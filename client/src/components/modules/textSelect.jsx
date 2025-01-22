import React, { useState, useEffect } from "react";
import { post, get } from "../../utilities";

/*
props
    frame
*/
const TextSelect = (props) => {
    const { frame } = props; // Access the frame from props
    const [text, setText] = useState(""); // State to hold text

    useEffect(() => {
        // Fetch initial text for the frame
        get('/api/text', { frameId: frame._id }).then((res) => setText(res.text));
    }, [frame._id]);

    const handleInputChange = (event) => {
        setText(event.target.value); // Update text as user types for live preview
    };

    const handleSubmit = () => {
        post('/api/setText', { frameId: frame._id, text: text }).then((res) => {
            console.log("Text updated successfully!", res);
        }).catch((err) => {
            console.error("Error updating text:", err);
        });
    };

    return (
        <div>
            <textarea
                value={text}
                onChange={handleInputChange}
                rows="10"
                cols="50"
                placeholder="Edit your text here..."
            />
            <div style={{ marginTop: "1em" }}>
                <button onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};

export default TextSelect;