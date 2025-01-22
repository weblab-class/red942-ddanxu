import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "../../utilities";
import './novelPreview.css'
/*
props:
    type (play, edit)
    {novelId, secondId}
        == {novelId, saveId} or {novelId, frameId}
    userId

 */

const NovelPreview = (props) => {
    const [novel, setNovel] = useState();
    const navigate = useNavigate();

    const {novelId, secondId, userId} = props;

    useEffect(() => {
        get('/api/novel', {novelId: novelId}).then((res) => setNovel(res.novel));
    }, [])

    const clicked = (props.type == "edit")? () => {
        console.log("clicked has run!")
        navigate('/editor/' + secondId, {
            state: {
                novelId: novelId,
                frameId: secondId,
                userId: userId
            }
        });
    } : () => {
        if (secondId === null) {
            navigate('/player/' + secondId, {
                state: {
                    novelId: novelId,
                    frameId: undefined,
                    userId: userId
                }
            });
        } else {
            navigate('/player/' + secondId, {
                state: {
                    novelId: novelId,
                    frameId: secondId,
                    userId: userId
                }
            });
        }
        
    };


    return (!novel)? (<>Loading...</>):(
        <div onClick={clicked} className="card">
            <img src={novel.thumbnail} alt={novel.name}></img>
            <h4>{novel.name}</h4>
        </div>
    );
}

export default NovelPreview;