import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Settings() {
  const [shift_time, setShift_time] = useState({
    "Shift A": { from_time: "", to_time: "" },
    "Shift B": { from_time: "", to_time: "" },
    "Shift C": { from_time: "", to_time: "" },
  });
  const [shift, setShift] = useState("Shift A");
  const [emails, setEmails] = useState([]);
  const shift_types = useMemo(() => ["Shift A", "Shift B", "Shift C"], []);

  useEffect(() => {
    const time = localStorage.getItem("shift_time");
    if (time) {
      setShift_time(JSON.parse(time));
    }
  }, []);

  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = () => {
    setShowDetails(!showDetails);
  };
  const handletimechange = useCallback(
    (e) => {

      setShift_time((p) => {
        const temp = {
          ...p,
          [shift]: { ...p[shift], [e.target.name]: e.target.value },
        };
        localStorage.setItem("shift_time", JSON.stringify(temp));
        return temp;
      });
    },
    [shift]
  );
  const handleAddRow = () => {
    setEmails([...emails, { id: emails.length + 1, address: "" }]);
  };

  const handleRemoveRow = (id) => {
    setEmails(emails.filter((email) => email.id !== id));
  };

  const handleEmailChange = (id, value) => {
    setEmails(
      emails.map((email) =>
        email.id === id ? { ...email, address: value } : email
      )
    );
  };

  return (
    <>
      <Card sx={{ m: 3, mx: "auto", mt: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom mb={"20px"}>
            Shift Timing Settings
          </Typography>
          <Grid container spacing={3}>
            {/* From Time */}{" "}
            <Grid item xs={12} sm={4}>
              <Typography>Shift</Typography>
              <FormControl fullWidth>
                <Select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  label="Shift"
                >
                  {shift_types.map((item) => (
                    <MenuItem value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography>{shift} - From time</Typography>
              <TextField
                fullWidth
                type="time"
                name="from_time"
                value={shift_time?.[shift]?.from_time || ""}
                onChange={handletimechange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }} // 5 min interval
              />
            </Grid>
            {/* To Time */}
            <Grid item xs={12} sm={4}>
              <Typography>{shift} - To time</Typography>
              <TextField
                fullWidth
                type="time"
                name="to_time"
                value={shift_time?.[shift]?.to_time || ""}
                onChange={handletimechange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }} // 5 min interval
              />
            </Grid>
            {/* Shift Selection */}
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mx: "auto", mt: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom mb={"20px"}>
            Mail Settings
          </Typography>

          <Grid container spacing={3}>
            {emails.map((email, index) => (
              <React.Fragment key={email.id}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`Mail Address ${index + 1}`}
                    value={email.address}
                    onChange={(e) =>
                      handleEmailChange(email.id, e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <IconButton onClick={() => handleRemoveRow(email.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddRow}
              >
                Add Email
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Privacy Settings
          </Typography>

          {/* Toggle Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleToggle}
            sx={{ mb: 2, textTransform: "none" }}
          >
            {showDetails ? "Hide Privacy Details" : "Open Privacy Details"}
          </Button>

          {/* Collapsible Details Section */}
          <Collapse in={showDetails}>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {[
                { label: "DB Name", value: "igarashi" },
                { label: "Server Name", value: "Desktop e-23723476523746" },
                { label: "Date", value: "2025-03-20" },
                { label: "Username", value: "admin_user" },
                { label: "Password", value: "******" },
                { label: "Login Name", value: "admin_login" },
                { label: "Login Password", value: "******" },
              ].map((item, index) => (
                <>
                  <Grid item xs={12} sm={2} key={index}>
                    <Typography fontWeight="bold">{item.label}:</Typography>
                  </Grid>
                  <Grid item xs={12} sm={10}>
                    <Typography>{item.value}</Typography>
                  </Grid>
                </>
              ))}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    </>
  );
}
