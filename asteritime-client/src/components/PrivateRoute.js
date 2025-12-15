import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/auth';

/**
 * Private route component
 * If user is not logged in, redirect to login page
 */
function PrivateRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check authentication status
    setAuthenticated(isAuthenticated());
    setChecked(true);

    // Listen for logout events
    const handleLogout = () => {
      setAuthenticated(false);
    };

    window.addEventListener('logout', handleLogout);

    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  // Don't render anything until we've checked authentication
  if (!checked) {
    return null;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;

