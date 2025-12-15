import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Timeline from './components/Timeline';
import Pomodoro from './components/Pomodoro';
import Analytics from './components/Analytics';
import Journal from './components/Journal';
import PrivateRoute from './components/PrivateRoute';
import { isAuthenticated } from './api/auth';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <PrivateRoute>
              <Layout>
                <Timeline />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/pomodoro"
          element={
            <PrivateRoute>
              <Layout>
                <Pomodoro />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Layout>
                <Analytics />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <PrivateRoute>
              <Layout>
                <Journal />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

