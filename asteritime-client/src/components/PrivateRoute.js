import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/auth';

/**
 * Private route component
 * If user is not logged in, redirect to login page
 */
function PrivateRoute({ children }) {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;

