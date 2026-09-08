import React, { useState } from "react";
import {
    Card, CardContent, TextField, Typography, Button, MenuItem,
    InputAdornment, IconButton, Grid
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const rightsOptions = ["Admin", "User"]

const RegistrationForm = ({triggerPopup}) => {
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        password: "",
        rights: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let newErrors = {};
        if (!formData.fullName) newErrors.fullName = "Full Name is required";
        if (!formData.username) newErrors.username = "Username is required";
        if (!formData.password) newErrors.password = "Password is required";
        if (!formData.rights) newErrors.rights = "Select a user right";

        if (Object.keys(newErrors).length === 0) {
            triggerPopup('Registration Success Demo',"success")
        } else {
            setErrors(newErrors);
        }
    };

    return (
        <Grid container justifyContent="center">
            <Grid item xs={12} sm={10} md={8} lg={6}>
                <Card sx={{ mx: "auto", maxWidth: 600, mt: 5, p: 4, boxShadow: 4, borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
                            Create an Account
                        </Typography>
                        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
                            Register with your details below
                        </Typography>

                        {/* Full Name */}
                        <TextField
                            fullWidth
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            error={!!errors.fullName}
                            helperText={errors.fullName}
                            sx={{ mb: 3 }}
                        />

                        {/* Username */}
                        <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            error={!!errors.username}
                            helperText={errors.username}
                            sx={{ mb: 3 }}
                        />

                        {/* Password */}
                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={!!errors.password}
                            helperText={errors.password}
                            sx={{ mb: 3 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleTogglePassword} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* Rights Dropdown */}
                        <TextField
                            select
                            fullWidth
                            label="User Rights"
                            name="rights"
                            value={formData.rights}
                            onChange={handleChange}
                            error={!!errors.rights}
                            helperText={errors.rights}
                            sx={{ mb: 4 }}
                        >
                            {rightsOptions.map((option, index) => (
                                <MenuItem key={index} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* Submit Button */}
                        <Button fullWidth variant="contained" color="primary" onClick={handleSubmit} sx={{ py: 1.5, fontSize: "1.1rem" }}>
                            Register Now
                        </Button>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default RegistrationForm;
