import {
  React,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  Grid,
  Typography,
  Card,
  FormControl,
  TextField,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
} from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import Switch from "@mui/material/Switch";
import { debounce } from "lodash";

function Tablenames({ triggerPopup }) {
  const [getTableData, setTableData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [getOldName, setOldName] = useState("");
  const [getNewName, setNewName] = useState("");
  const [getType, setType] = useState("");
  const [getExeUser, setExeUser] = useState("");
 
  const debouncedCheck = useCallback(
    debounce(async (value) => {
      if (value.trim() !== "") {
        const res = await window.versions.checkexisttable(value);

        if (res === "Exists") {
          setExeUser("Exists");
        } else {
          setExeUser("test");
        }
      }
    }, 500),
    [],
  );

  const handleToggleVisibility = async (rowData) => {
    if (rowData?.exportname === "") {
      return triggerPopup(
        "Kindly assign a name to this machine.",
        "warning",
      );
    }

    const newStatus = rowData.status === 1 ? 0 : 1;

    try {
      const res = await window.versions.tablerename({
        getOldName: rowData?.TABLE_NAME,
        status: newStatus,
        getType: "Visiblity",
      });

      if (res?.status === 0 || res?.status === 1) {
        setTableData((prev) =>
          prev.map((item) =>
            item.TABLE_NAME === rowData.TABLE_NAME
              ? { ...item, status: newStatus }
              : item,
          ),
        );

        return triggerPopup(
          newStatus === 1
            ? "Machine Enabled Successfully"
            : "Machine Disabled Successfully",
          "success",
        );
      }

      triggerPopup("Failed to update visibility", "error");
    } catch (error) {
      console.error("Failed to update visibility:", error);
      triggerPopup("Failed to update visibility", "error");
    }
  };


  const columns = useMemo(
    () => [
      { id: "1", header: "Machine Name", accessorKey: "TABLE_NAME" },
      { id: "2", header: "Export Name", accessorKey: "exportname" },
      {
        id: "3",
        header: "Visibility",
        accessorKey: "status",
        Cell: ({ row }) => {
          const isVisible = row.original.status === 1;

          return (
            <Switch
              checked={isVisible}
              onChange={() => handleToggleVisibility(row.original)}
              color="success"
            />
          );
        },
      },
    ],
    [],
  );


  const getTables = () => {
    window.versions
      .gettablename()
      .then((res) => {
        setTableData(res.mergedArray);
      })
      .catch((err) => {
        console.error("Failed to load table names:", err);
        triggerPopup("Failed to load table names", "error");
      });
  };

  const handleRowEdit = (row) => {
    setOldName(row?.original?.TABLE_NAME);
    setNewName(row?.original?.exportname);
    setType(row?.original?.exportname !== "" ? "Update" : "Insert");
    setOpenAddModal(true);
  };


  const hanleEditData = async () => {
    if (getExeUser === "Exists") {
      return triggerPopup("This Name Already Assigned", "warning");
    }

    if (getOldName === "" || getNewName === "") {
      return triggerPopup("Please Fill The Required Fields", "warning");
    } else {
      try {
        const res = await window.versions.tablerename({
          getOldName: getOldName,
          getNewName: getNewName,
          getType: getType,
        });

        if (res.message === "Table Name Successfully") {
          getTables();
          setOpenAddModal(false);
          return triggerPopup("Table Name Edited Successfully", "success");
        } else {
          return triggerPopup(
            "Something went wrong while adding tablename",
            "error",
          );
        }
      } catch (error) {
        console.error("Error fetching in Rename Table", error);
        triggerPopup("Failed to update table name", "error");
      }
    }
  };

  const handleCloseAdd = () => {
    setOpenAddModal(false);
  };

  useEffect(() => {
    getTables();
  }, []);

  return (
    <>
      <Card sx={{ p: 3, mx: "auto" }}>
        {/* <Grid container spacing={2} columnSpacing={8} alignItems="center">
        <Grid item xs={12} sm={7} md={7}>
          <FormControl fullWidth></FormControl>
        </Grid>
      </Grid>
       */}
        <Box mt={3}>
          <Typography variant="h6" gutterBottom mb={2}>
            All Tables
          </Typography>
          <MaterialReactTable
            enablePagination
            muiCircularProgressProps={{
              thickness: 4,
              size: 55,
            }}
            muiTableContainerProps={{
              sx: {
                maxHeight: "500px",
              },
            }}
            enableRowActions={true}
            renderRowActions={({ row }) => (
              <>
                <IconButton color="primary" onClick={() => handleRowEdit(row)}>
                  <EditIcon />
                </IconButton>
              </>
            )}
            columns={columns}
            enableColumnFilters={true}
            enableGlobalFilter={true}
            enableSorting={true}
            enableTopToolbar={true}
            data={getTableData}
            positionActionsColumn="last"
          />
        </Box>

      </Card>

      <Dialog open={openAddModal} onClose={handleCloseAdd}>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Rename Machine
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
              <Typography>Machine Name</Typography>
            </Grid>

            <Grid item sm={8}>
              <TextField value={getOldName} disabled fullWidth />
            </Grid>
            <Grid item sm={4} mt={2}>
              <Typography>Export Name</Typography>
            </Grid>

            <Grid item sm={8} mt={2}>
              <TextField
                value={getNewName}
                onChange={(e) => {
                  let value = e.target.value;
                  setNewName(value);
                  debouncedCheck(value);
                }}
                fullWidth
              />

              <Typography sx={{ color: "red" }}>
                {getExeUser === "Exists" ? "This Name Already Assigned" : ""}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>

          <Button variant="contained" onClick={hanleEditData}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Tablenames;
