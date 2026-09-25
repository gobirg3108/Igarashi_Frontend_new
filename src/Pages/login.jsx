import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const Login = ({ triggerPopup }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({ username: false, password: false });
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError({ username: !username, password: !password });
      return;
    }


    try {
      const res = await window.versions.userlogin({
        username: username,
        password: password,
      });

      if (username === res?.username && res.status === true) {
        triggerPopup("Login Success", "success");

        sessionStorage.setItem("menuPages", res?.page === "" ? "" : res?.page);

        setTimeout(() => {
          let defaultPage = sessionStorage.getItem("menuPages");

          navigate(`${defaultPage?.split(",")[0] || []}`);
        }, 100);
      } else {
        triggerPopup("Invalid Username / Password", "error");
      }

    } catch (error) {
      console.error("Error in Login user", error);
      triggerPopup("Unable to login. Please try again.", "error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f4f6f8",
      }}
    >
      <Card sx={{ width: 450, p: 4, boxShadow: 5, borderRadius: 3 }}>
        <CardContent>
          <form onSubmit={handleLogin}>
          <Typography
            variant="h5"
            fontWeight="bold"
            align="center"
            gutterBottom
          >
            Login
          </Typography>

          {/* Username Field */}
          <TextField
            fullWidth
            value={username}
            onChange={(e) => {
              let value = e.target.value;
              setUsername(value);

              if (value?.trim() === "") {
                setError((prev) => ({ ...prev, username: true }));
              } else {
                setError((prev) => ({ ...prev, username: false }));
              }
            }}
            error={error.username}
            helperText={error.username ? "Username is required" : ""}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />

          {/* Password Field */}
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              let value = e.target.value;
              setPassword(value);
              if (value?.trim() === "") {
                setError((prev) => ({ ...prev, password: true }));
              } else {
                setError((prev) => ({ ...prev, password: false }));
              }
            }}
            error={error.password}
            helperText={error.password ? "Password is required" : ""}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Login Button */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, py: 1.2, fontSize: "1rem" }}
            type="submit"
          >
            Login
          </Button>

          {/* Footer */}
          {/* <Typography
            align="center"
            sx={{ mt: 2, fontSize: "0.9rem", color: "gray" }}
          >
            Forgot Password? | Create Account
          </Typography> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
