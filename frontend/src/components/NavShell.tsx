import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const NavShell: React.FC = () => {
  const location = useLocation();

  // routes where you don't want the TopBar
  const hideTopBarRoutes = ["/collection", "/trends", "/bag"];
  const hideTopBar = hideTopBarRoutes.includes(location.pathname);

  // when TopBar is visible, offset the fixed header height (≈56px + safe-area)
  const mainTopPadding = hideTopBar
    ? ""
    : "pt-[calc(56px+env(safe-area-inset-top))]";

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {!hideTopBar && <TopBar />}
      <main className={`flex-1 pb-20 ${mainTopPadding}`}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default NavShell;
