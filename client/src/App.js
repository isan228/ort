import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestDetail from './pages/TestDetail';
import TestResult from './pages/TestResult';
import Statistics from './pages/Statistics';
import Ranking from './pages/Ranking';
import Subscription from './pages/Subscription';
import Universities from './pages/Universities';
import AdminPanel from './pages/AdminPanel';
import RepetitorPanel from './pages/RepetitorPanel';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/tests" element={
            <PrivateRoute>
              <Tests />
            </PrivateRoute>
          } />
          
          <Route path="/tests/:id" element={<TestDetail />} />
          
          <Route path="/tests/:id/result" element={<TestResult />} />
          
          <Route path="/statistics" element={
            <PrivateRoute>
              <Statistics />
            </PrivateRoute>
          } />
          
          <Route path="/ranking" element={
            <PrivateRoute>
              <Ranking />
            </PrivateRoute>
          } />
          
          <Route path="/subscription" element={<Subscription />} />
          
          <Route path="/universities" element={<Universities />} />
          
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
          
          <Route path="/repetitor/*" element={
            <AdminRoute>
              <RepetitorPanel />
            </AdminRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          <Toaster position="top-right" />
        </div>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

