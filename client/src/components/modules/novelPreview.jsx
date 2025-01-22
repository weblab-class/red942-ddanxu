import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "../../utilities";
/*
props:
    type (play, edit)
    {novelId, secondId}
        == {novelId, saveId} or {novelId, frameId}

@TODO
make this
 */

const NovelPreview = (props) => {
    const [novel, setNovel] = useState();
    const navigate = useNavigate();

    const {novelId, secondId} = props;

    useEffect(() => {
        get('/api/novel', {novelId: novelId}).then((res) => setNovel(res.novel));
    }, [])

    const clicked = (props.type == "edit")? () => {
        console.log("clicked has run!")
        navigate('/editor/' + secondId, {
            state: {
                novelId: novelId,
                frameId: secondId
            }
        });
    } : () => {
        navigate('/api/player', {
            state: {
                novelId: novelId,
                frameId: secondId
            }
        });
    };


    return (!novel)? (<>Loading...</>):(
        <div onClick={clicked}>
            <img src = {novel.thumbnail}></img>
            <h4>{novel.name}</h4>
        </div>
    );
}

export default NovelPreview;