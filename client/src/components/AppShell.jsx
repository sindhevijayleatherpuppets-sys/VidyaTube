import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";

const AppShell = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Navbar onToggleSidebar={() => setCollapsed(!collapsed)} />
      <div className="app-body">
        <Sidebar collapsed={collapsed} />
        <main className="app-content">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default AppShell;
