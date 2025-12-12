import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Landing from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';
import ClientUpload from './pages/ClientUpload';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen font-sans">
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/upload" element={<ClientUpload />} />
        </Routes>
        
        <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Bill Layne Insurance. All rights reserved.</p>
          <p className="mt-2 text-xs">MyInsurancePhoto.com - Powered by Secure Static Tech</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
