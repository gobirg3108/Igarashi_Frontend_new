import React from "react";
import { Outlet, Link } from "react-router-dom";
import SideNavBar from "../Sidebar/Sidebar";

const MainLayout = () => {
  return (
    <div className="container-fluid g-0">
      {/* <SideNav /> */}
      <SideNavBar />
    </div>
  );
};

export default MainLayout;
