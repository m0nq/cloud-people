import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Office } from './pages/Office';
import { Store } from './pages/Store';
import { Ranking } from './pages/Ranking';
import { Keys } from './pages/Keys';
import { Earn } from './pages/Earn';
import { useAuthStore } from './store/auth';

function App() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration issues by not rendering until client-side
  if (!mounted) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <Layout requireAuth={false}>
            <Login />
          </Layout>
        } />
        
        <Route path="/" element={
          <Layout>
            <Home />
          </Layout>
        } />
        
        <Route path="/office" element={
          <Layout>
            <Office />
          </Layout>
        } />
        
        <Route path="/store" element={
          <Layout>
            <Store />
          </Layout>
        } />
        
        <Route path="/ranking" element={
          <Layout>
            <Ranking />
          </Layout>
        } />
        
        <Route path="/keys" element={
          <Layout>
            <Keys />
          </Layout>
        } />

        <Route path="/earn" element={
          <Layout>
            <Earn />
          </Layout>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;