import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import MainLayout from "./Layout/Mainlayout/MainLayout";

import Login from "./Pages/login";
import Home from "./Pages/Home";
import EncapAssembly from "./Pages/EncapAssembly";
import Settings from "./Pages/Settings";
import RegistrationForm from "./Pages/Registration";
import ExcelEdit from "./Pages/ExcelTemplate";
import Tablenames from "./Pages/Tablenames";
import Assemblynames from "./Pages/Assemblynames";
import BackupTables from "./Pages/BackupTables";
import Traceability from "./Pages/Traceability";
import Popup from "./Pages/Popup";

function App() {
  const [popup, setPopup] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const triggerPopup = (message, type) => {
    setPopup({
      open: true,
      message,
      type,
    });
  };

  return (
    <HashRouter>
      <Routes>
        {/* Login */}
        <Route index element={<Login triggerPopup={triggerPopup} />} />

        {/* Main Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route path="home" element={<Home triggerPopup={triggerPopup} />} />

          <Route
            path="encapAssembly"
            element={<EncapAssembly triggerPopup={triggerPopup} />}
          />

          <Route
            path="assembleTable"
            element={<Assemblynames triggerPopup={triggerPopup} />}
          />

          <Route
            path="backupTables"
            element={<BackupTables triggerPopup={triggerPopup} />}
          />

          <Route
            path="register"
            element={<RegistrationForm triggerPopup={triggerPopup} />}
          />

          <Route
            path="traceability"
            element={<Traceability triggerPopup={triggerPopup} />}
          />

          <Route
            path="settings"
            element={<Settings triggerPopup={triggerPopup} />}
          />

          <Route
            path="excelTemplate"
            element={<ExcelEdit triggerPopup={triggerPopup} />}
          />

          <Route
            path="tablenames"
            element={<Tablenames triggerPopup={triggerPopup} />}
          />
        </Route>
      </Routes>

      {popup.open && (
        <Popup
          message={popup.message}
          type={popup.type}
          duration={3000}
          onClose={() =>
            setPopup((prev) => ({
              ...prev,
              open: false,
            }))
          }
        />
      )}
    </HashRouter>
  );
}

export default App;
