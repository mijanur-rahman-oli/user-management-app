// IMPORTANT: PrivateRoute component to protect dashboard from unauthorized access
import React from 'react';
import { Navigate } from 'react-router-dom';

// NOTE: Check if user is authenticated by verifying token exists
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  
  // NOTA BENE: If no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // IMPORTANT: If authenticated, render the protected component
  return children;
}

export default PrivateRoute;