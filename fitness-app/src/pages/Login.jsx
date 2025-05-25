// src/pages/Login.jsx
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import "../scss/pages/_login.scss";

export default function Login() {
  const { user, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  // If already logged in, send to admin area (or dashboard)
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  return (
    <div className="site-login"> 
      <div className="site-login__modal modal">
        <div className="site-login__logo">
            <img
            src="/images/k-fitness-dark.svg"
            alt="K Fitness"
            className="site-login__logo-dark"
          />
          <img
            src="/images/k-fitness-light.svg"
            alt="K Fitness"
            className="site-login__logo-light"
          />
        </div>
        
        <h1>Welcome to <strong>K Fitness</strong></h1>
        <p>Track your progress. Stay accountable. Get results.</p>
        <button className="button site-login__button" onClick={loginWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
