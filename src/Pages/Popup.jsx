import React, { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

const Popup = ({ message, type = "info", duration, onClose }) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(false);
      onClose && onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    open && (
      <Snackbar
        open={open}
        autoHideDuration={duration}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          position: "fixed",
          top: "0%",
          left: "50%",
          transform: "translate(-50%, -50%)", // ✅ Ensures exact center positioning
          zIndex: 1400, // Ensures it's above other UI elements
        }}
      >
        <Alert
          severity={type}
          onClose={onClose}
          sx={{
            width: 450, // Fixed width
            height: 60,
            display: "flex",
            justifyContent: "center",
            textAlign: "center", // Ensure text is centered
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    )
  );
};

export default Popup;
