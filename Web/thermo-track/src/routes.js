import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import CadUser from './pages/CadUser';
import CadCopo from './pages/CadCopo';
import CoposCadastrados from './pages/CoposCadastrados';
import Dashboard from './pages/Dashboard';
import { useAuth } from './contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cad-user" element={<CadUser />} />
      
      <Route 
        path="/cad-copo" 
        element={
          <PrivateRoute>
            <CadCopo />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/copos-cadastrados" 
        element={
          <PrivateRoute>
            <CoposCadastrados />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
