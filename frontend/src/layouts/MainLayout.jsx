import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// Bootstrap JS needs to be imported for dropdowns
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="d-flex">
      <Sidebar collapsed={collapsed} />
      <div className={`main-content flex-grow-1 ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
        <div style={{ padding: '1.5rem', flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
