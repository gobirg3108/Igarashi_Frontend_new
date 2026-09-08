import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Collapse,
  Select,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { MaterialReactTable } from "material-react-table";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import { debounce } from "lodash";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const names = [
  "Home",
  "Encap Assembly",
  "Motor Assembly",
  "Armature Assembly",
  "Settings",
  "Excel Template",
  "All Table Names",
  "Assembly Table Names",
  "Backup Tables",
  "Traceability",
];

console.log("names", names);

export default function Settings({ triggerPopup }) {
  const [shift_time, setShift_time] = useState({
    "Shift A": { from_time: "", to_time: "" },
    "Shift B": { from_time: "", to_time: "" },
    "Shift C": { from_time: "", to_time: "" },
    General: { from_time: "", to_time: "" },
    All: { from_time: "00:00", to_time: "23:59" },
    Custom: { from_time: "", to_time: "" },
  });
  const [shift, setShift] = useState("Shift A");
  const [emails, setEmails] = useState([]);
  const shift_types = useMemo(() => ["Shift A", "Shift B", "Shift C"], []);
  const [getPage, setPage] = React.useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [getUser, setUser] = useState({
    fullname: "",
    username: "",
    password: "",
  });
  const [showDetails, setShowDetails] = useState(false);
  const [showUsers, hideUsers] = useState(false);
  const [getData, setData] = useState([]);
  const [getBtnType, setBtnType] = useState("");
  const [getExeUser, setExeUser] = useState("");

  const handleSubmit = async () => {
    if (getExeUser === "Exists") {
      return triggerPopup("Username already exists", "warning");
    }

    if (
      getUser?.fullname?.trim() === "" ||
      getUser?.username?.trim() === "" ||
      getUser?.password?.trim() === "" ||
      getPage?.length === 0
    ) {
      return triggerPopup("Please fill the required fields", "warning");
    }

    const paramData = {
      ...getUser,
      page: getPage?.toString(),
    };

    try {
      const res = await window.versions.adduser(paramData);

      if (res?.success && res?.message === "User Added Successfully") {
        setUser({
          fullname: "",
          username: "",
          password: "",
          id: "",
        });

        setPage([]);
        handleCloseAdd();
        await getUSersDeatils();

        return triggerPopup("User Added Successfully", "success");
      }

      triggerPopup(res?.message || "Failed to add user", "error");
    } catch (error) {
      console.error("Add user failed:", error);
      triggerPopup("Failed to add user", "error");
    }
  };

  const handleOpenAdd = () => setOpenAddModal(true);
  const handleCloseAdd = () => {
    setOpenAddModal(false);
    setExeUser("");
  };

  const getUSersDeatils = async () => {
    try {
      const res = await window.versions.getusers();
      setData(res?.recordsets || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      triggerPopup("Failed to load users", "error");
    }
  };

  useEffect(() => {
    const time = localStorage.getItem("shift_time");
    if (time) {
      setShift_time(JSON.parse(time));
    }

    setBtnType("save");

    getUSersDeatils();
  }, []);

  const handleToggle = () => {
    setShowDetails(!showDetails);
  };

  const handleToggleUsers = () => {
    hideUsers(!showUsers);
  };

  const handletimechange = useCallback(
    (shift1, name, value) => {
      setShift_time((p) => {
        const temp = { ...p, [shift1]: { ...p[shift1], [name]: value } };
        localStorage.setItem("shift_time", JSON.stringify(temp));
        return temp;
      });
    },
    [shift],
  );

  const debouncedCheck = useCallback(
    debounce(async (value, id) => {
      if (value.trim() !== "") {
        const res = await window.versions.checkexistuser({
          username: value,
          id: id || 0,
        });

        setExeUser(res === "Exists" ? "Exists" : "");
      } else {
        setExeUser("");
      }
    }, 500),
    [],
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
        email.id === id ? { ...email, address: value } : email,
      ),
    );
  };

  const columns = useMemo(
    () => [
      { accessorKey: "fullname", header: "Full Name" },
      { accessorKey: "username", header: "User Name" },
      { accessorKey: "page", header: "page" },
    ],
    [],
  );

  const handleEdit = (row) => {
    setOpenAddModal(true);

    setUser({
      fullname: row?.original?.fullname || "",
      username: row?.original?.username || "",
      password: "",
      id: row?.original?.id,
    });

    setPage(row?.original?.page ? row.original.page.split(",") : []);

    setBtnType("edit");
  };
  const handleUpdate = async () => {
    if (getExeUser === "Exists") {
      return triggerPopup("Username already exists", "warning");
    }

    if (
      getUser?.fullname?.trim() === "" ||
      getUser?.username?.trim() === "" ||
      getPage?.length === 0
    ) {
      return triggerPopup("Please fill the required fields", "warning");
    }
    try {
      const res = await window.versions.updateuser({
        id: getUser?.id,
        fullname: getUser?.fullname,
        username: getUser?.username,
        password: getUser?.password,
        page: getPage?.toString(),
      });

      if (res?.success && res?.message === "User Updated Successfully") {
        await getUSersDeatils();
        handleCloseAdd();

        return triggerPopup("User Updated Successfully", "success");
      }

      triggerPopup(res?.message || "Failed to update user", "error");
    } catch (error) {
      console.error("Update failed:", error);
      triggerPopup("Failed to update user", "error");
    }
  };

  const handleDelete = async (row) => {
    const selectid = row?.original?.id;

    if (!selectid) {
      return;
    }

    if (window.confirm("Delete this user?")) {
      try {
        const result = await window.versions.deleteuser({
          id: selectid,
        });

        if (
          result?.success &&
          result?.message === "User deleted successfully"
        ) {
          await getUSersDeatils();

          return triggerPopup("User Deleted Successfully", "success");
        }

        triggerPopup(result?.message || "Failed to delete user", "error");
      } catch (error) {
        console.error("Delete failed:", error);
        triggerPopup("Failed to delete user", "error");
      }
    }
  };

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setPage(typeof value === "string" ? value.split(",") : value);
  };
  return (
    <>
      {/*  <Card sx={{ m: 3, mx: "auto", mt: 4, boxShadow: 3, borderRadius: 2 }}>
                 <CardContent>
                    <Typography variant="h6" gutterBottom mb={'20px'}>
                        Shift Timing Settings
                    </Typography>
                  <Grid container spacing={3}>
                       {// From Time }
                           <Grid item xs={12} sm={4}>
                            <Typography>Shift</Typography>
                            <FormControl fullWidth>

                                <Select value={shift} onChange={(e) => setShift(e.target.value)} label="Shift">
                                    {shift_types.map((item, index) => <MenuItem value={item} key={index}>{item}</MenuItem>)}

                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography>{shift} - From time</Typography>
                            <TextField
                                fullWidth
                                type="time"
                                name='from_time'
                                value={shift_time?.[shift]?.from_time || ""}
                                onChange={handletimechange}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }} // 5 min interval
                            />
                        </Grid>

                      {//  To Time }
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

                       </CardContent> Shift Selection 

                    </Grid>
                </CardContent>
            </Card>*/}
      <Card sx={{ m: 3, mt: 0, mx: "auto", boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom mb={2}>
            Shift Timing Settings
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(shift_time).map(
              ([shift, times], index) =>
                shift !== "All" &&
                shift !== "Custom" && (
                  <Grid
                    item
                    xs={12}
                    xl={10}
                    key={index}
                    container
                    spacing={2}
                    alignItems="center"
                  >
                    <Grid item xs={12} sm={2}>
                      <Typography fontWeight="bold">{shift}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="time"
                        label={`${shift} - From Time`}
                        value={times.from_time || ""}
                        onChange={(e) =>
                          handletimechange(shift, "from_time", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }} // 5 min interval
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="time"
                        label={`${shift} - To Time`}
                        value={times.to_time || ""}
                        onChange={(e) =>
                          handletimechange(shift, "to_time", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }} // 5 min interval
                      />
                    </Grid>
                  </Grid>
                ),
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card
        sx={{ marginTop: 4, mx: "auto", mt: 4, boxShadow: 3, borderRadius: 2 }}
      >
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

      <Card sx={{ marginTop: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
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
                // { label: "Date", value: "2025-03-20" },
                // { label: "Username", value: "admin_user" },
                // { label: "Password", value: "******" },
                // { label: "Login Name", value: "admin_login" },
                // { label: "Login Password", value: "******" }
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12} sm={2} key={index}>
                    <Typography fontWeight="bold">{item.label}:</Typography>
                  </Grid>
                  <Grid item xs={12} sm={10}>
                    <Typography>{item.value}</Typography>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      <Card sx={{ marginTop: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Registration
          </Typography>

          {/* Toggle Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleToggleUsers}
            sx={{ mb: 2, textTransform: "none" }}
          >
            {showUsers ? "Hide User" : "Add User"}
          </Button>

          {/* Collapsible Details Section */}
          <Collapse in={showUsers}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={12}>
                <MaterialReactTable
                  columns={columns}
                  data={getData[0] || []}
                  enablePagination={true}
                  enableRowActions={true}
                  enableColumnFilters={true}
                  enableGlobalFilter={true}
                  enableSorting={true}
                  enableTopToolbar={true}
                  positionActionsColumn="last"
                  renderTopToolbarCustomActions={() => (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        handleOpenAdd();
                        setBtnType("save");
                        setUser({
                          fullname: "",
                          username: "",
                          password: "",
                          id: "",
                        });
                        setPage([]);
                      }}
                    >
                      Add User
                    </Button>
                  )}
                  renderRowActions={({ row }) => (
                    <>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(row)}
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                />
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      <Dialog open={openAddModal} onClose={handleCloseAdd}>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Add User
          <IconButton
            aria-label="close"
            onClick={handleCloseAdd}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <Grid container>
            <Grid item sm={4}>
              <Typography>Full Name</Typography>
            </Grid>

            <Grid item sm={8}>
              <TextField
                value={getUser.fullname}
                onChange={(e) =>
                  setUser({ ...getUser, fullname: e.target.value })
                }
                fullWidth
              />
            </Grid>

            <Grid item sm={4} mt={2}>
              <Typography>User Name</Typography>
            </Grid>

            <Grid item sm={8} mt={2}>
              <TextField
                value={getUser.username}
                onChange={(e) => {
                  const value = e.target.value;

                  setUser({
                    ...getUser,
                    username: value,
                  });

                  debouncedCheck(
                    value,
                    getBtnType === "edit" ? getUser?.id : 0,
                  );
                }}
                fullWidth
              />

              <Typography sx={{ color: "red" }}>
                {getExeUser === "Exists"
                  ? "This username Already Assigned"
                  : ""}
              </Typography>
            </Grid>

            <Grid item sm={4} mt={2}>
              <Typography>Password</Typography>
            </Grid>

            <Grid item sm={8} mt={2}>
              <TextField
                type="password"
                value={getUser.password}
                onChange={(e) =>
                  setUser({ ...getUser, password: e.target.value })
                }
                helperText={
                  getBtnType === "edit"
                    ? "Leave blank to keep the existing password"
                    : ""
                }
                fullWidth
              />
            </Grid>

            <Grid sm={4} mt={2}>
              <Typography>Pages</Typography>
            </Grid>

            <Grid item sm={8} mt={2}>
              <FormControl fullWidth>
                <Select
                  multiple
                  value={getPage}
                  onChange={handleChange}
                  input={<OutlinedInput />}
                  renderValue={(selected) => selected.join(", ")}
                  MenuProps={MenuProps}
                >
                  {names.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox checked={getPage.includes(name)} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>

          {getBtnType === "save" ? (
            <Button variant="contained" onClick={handleSubmit}>
              Save
            </Button>
          ) : (
            <Button variant="contained" onClick={handleUpdate}>
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
