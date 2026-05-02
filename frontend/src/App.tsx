import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@components/Layout';
import { Home } from '@pages/Home';
import { Pet } from '@pages/Pet';
import { Records } from '@pages/Records';
import { Settings } from '@pages/Settings';
import { Titles } from '@pages/Titles';
import { Reminders } from '@pages/Reminders';
import { Welcome } from '@pages/Welcome';
import { Login } from '@pages/Login';
import { Register } from '@pages/Register';
import { useUserStore } from '@stores/userStore';

// Protected Route - requires authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-bounce">
            <div className="w-12 h-12 mx-auto bg-water-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

// Auth Route - redirects to home if already authenticated
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-bounce">
            <div className="w-12 h-12 mx-auto bg-water-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/welcome"
        element={
          <AuthRoute>
            <Welcome />
          </AuthRoute>
        }
      />
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="pet" element={<Pet />} />
        <Route path="records" element={<Records />} />
        <Route path="titles" element={<Titles />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Redirect unknown routes to welcome */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
