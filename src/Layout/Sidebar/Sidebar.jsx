import React, { useState, useEffect } from "react";
import { Link, Outlet, NavLink } from "react-router-dom";
import "./Sidebar_style.css";
import { sideMenu } from "../menuconfig/menu_config";
import IgarashiLogo from "../../assets/igarishi_logo.png";
import IntechLogo from "../../assets/intech_logo.svg";
import { Button, Grid, Box, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";

const SideNavBar = () => {
  const [isActive, setIsActive] = useState(true);
  const [getMenuAccess, setMenuaccess] = useState([]);
  const navigate = useNavigate();

  function handleClick() {
    setIsActive(!isActive);
  }

  const handleLogout = () => {
    navigate("/");
    sessionStorage?.removeItem("menuPages");
  };

  const menuCalling = () => {
    const menuAccess = sessionStorage?.getItem("menuPages");
    const allowedMenus = menuAccess?.split(",") || [];

    const filteredMenu = sideMenu?.filter((item) =>
      allowedMenus?.includes(item?.label),
    );

    setMenuaccess(filteredMenu || []);
  };

  useEffect(() => {
    menuCalling();
  }, []);

  return (
    <>
      <div className="sidenav-container">
        <div className="header">
          <div className="toggle" onClick={handleClick}>
            <span className="icon">
              {isActive ? (
                <i className="fa fa-times"></i>
              ) : (
                <i className="fa fa-bars"></i>
              )}
            </span>
          </div>
          <h3 className="mb-0 project-name text-center">
            <img src={IgarashiLogo} alt="igarishi logo" />
          </h3>
        </div>

        <nav className={isActive ? "active" : ""}>
          <ul>
            <li>
              <a
                className="toggle"
                onClick={handleClick}
                style={{ position: "relative" }}
              >
                <span className="icon">
                  <i className="fa fa-bars"></i>
                </span>
                <span className="project-name title">
                  <img src={IgarashiLogo} alt="igarishi logo" />
                </span>
              </a>
            </li>
            {getMenuAccess?.map((item, index) => {
              return (
                <li key={`${item.label}-${index}`}>
                  <NavLink
                    to={item.to}
                    className={(navData) =>
                      navData.isActive ? "menu-active" : "none"
                    }
                    // onClick={handleClick}
                  >
                    {/* <span className="icon">
                                            <i className={item.Icon}></i>
                                        </span> */}
                    <span className="icon">
                      {typeof item.Icon === "string" ? (
                        <i className={item.Icon}></i> // Font Awesome Icon
                      ) : (
                        <item.Icon /> // MUI Icon
                      )}
                    </span>
                    <span className="title">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="sidebar-footer">
            <img src={IntechLogo} alt="footer logo" className="footer-logo" />
          </div>
        </nav>
      </div>
      {/* <section for content to display for that specific route */}
      <section
        className={`home-section pt-2 ${isActive ? "content-active" : ""}`}
      >
        <div className="content" style={{ marginLeft: "6px" }}>
          <Grid container>
            <Grid
              item
              xs={12}
              display={"flex"}
              alignContent={"end"}
              justifyContent={"end"}
            >
              <Box
                sx={{
                  backgroundColor: "#ffffff",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "end",
                  padding: "11px 19px",
                  marginBottom: "14px ",
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  sx={{ fontSize: "13px" }}
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Outlet />
        </div>
      </section>
    </>
  );
};

export default SideNavBar;
