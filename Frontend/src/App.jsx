import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/sections/Navbar';
import LoadingScreen from './components/LoadingScreen';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for performance
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const LenderLogin = lazy(() => import('./pages/LenderLogin'));
const LenderDashboard = lazy(() => import('./pages/LenderDashboard'));
const AAVerification = lazy(() => import('./pages/AAVerification'));
const ScoreDashboard = lazy(() => import('./pages/ScoreDashboard'));
const LenderPool = lazy(() => import('./pages/LenderPool'));
const Ledger = lazy(() => import('./pages/Ledger'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Page loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#4F8EF7] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/lender-login" element={<LenderLogin />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/score" element={
          <ProtectedRoute>
            <ScoreDashboard />
          </ProtectedRoute>
        } />
        <Route path="/pool" element={
          <ProtectedRoute>
            <LenderPool />
          </ProtectedRoute>
        } />
        <Route path="/ledger" element={
          <ProtectedRoute>
            <Ledger />
          </ProtectedRoute>
        } />
        <Route path="/aa-verify" element={
          <ProtectedRoute>
            <AAVerification />
          </ProtectedRoute>
        } />
        <Route path="/lender-dashboard" element={
          <ProtectedRoute>
            <LenderDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Initial Loading Screen */}
          {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
          
          {/* Noise Overlay */}
          <div className="noise-overlay" />
          
          {/* Navigation - Hide on login page */}
          {!isLoading && <Navbar />}
          
          {/* Page Content */}
          {!isLoading && (
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          )}
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
