import React from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "./navBar.css"

/*
props:
    userId
    handleLogout
    handleLogin
 */
const NavBar = (props) => {
  return (
    <nav className="NavBar-container">
      <div className="NavBar u-inlineBlock">VNForge</div>
      <div className="NavBar-linkContainer u-inlineBlock">
        <Link to="/" className="NavBar-link">
          Home
        </Link>
        {props.userId && (
          <Link to={`/profile/${props.userId}`} className="NavBar-link">
            Profile
          </Link>
        )}

        {props.userId ? (
          <button onClick={props.handleLogout}>
            Sign out
          </button>
        ) : (
          <GoogleLogin
            text="signin_with"
            onSuccess={props.handleLogin}
            onFailure={(err) => console.log(err)}
            containerProps= {{'className': "NavBar-link NavBar-login u-inlineBlock"}}
          />
        )}
      </div>
    </nav>
  );
};

export default NavBar;
