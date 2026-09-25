import { React, useEffect, useState, useMemo, useCallback } from "react";
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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Switch from "@mui/material/Switch";
import { debounce } from "lodash";

function Tablenames({ triggerPopup }) {
  const [getTableData, setTableData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [getOldName, setOldName] = useState("");
  const [getNewName, setNewName] = useState("");
  const [getType, setType] = useState("");
  const [getExeUser, setExeUser] = useState("");
  const [draggedMachineName, setDraggedMachineName] = useState(null);
  const [savingTraceabilityOrder, setSavingTraceabilityOrder] = useState(false);

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
      return triggerPopup("Kindly assign a name to this machine.", "warning");
    }

    const newStatus = rowData.status === 1 ? 0 : 1;

    try {
      const res = await window.versions.tablerename({
        getOldName: rowData?.TABLE_NAME,
        status: newStatus,
        getType: "Visiblity",
      });

      if (res?.status === 0 || res?.status === 1) {
        // Reload so the UI also receives the DB-assigned traceability order
        // (re-enabled machines are appended to the end).
        getTables();

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

  const traceabilityTables = useMemo(() => {
    return [...getTableData]
      .filter(
        (item) =>
          item.status === 1 &&
          item.has_dmc_data === true &&
          String(item.exportname || "").trim(),
      )
      .sort((a, b) => {
        const aOrder = Number.isFinite(Number(a.traceability_order))
          ? Number(a.traceability_order)
          : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(Number(b.traceability_order))
          ? Number(b.traceability_order)
          : Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.exportname || a.TABLE_NAME).localeCompare(
          String(b.exportname || b.TABLE_NAME),
        );
      });
  }, [getTableData]);

  const handleTraceabilityDrop = async (targetMachineName, sourceOverride) => {
    const sourceMachineName = sourceOverride || draggedMachineName;
    setDraggedMachineName(null);

    if (
      !sourceMachineName ||
      !targetMachineName ||
      sourceMachineName === targetMachineName ||
      savingTraceabilityOrder
    ) {
      return;
    }

    const previousData = getTableData;
    const ordered = [...traceabilityTables];
    const sourceIndex = ordered.findIndex(
      (item) => item.TABLE_NAME === sourceMachineName,
    );
    const targetIndex = ordered.findIndex(
      (item) => item.TABLE_NAME === targetMachineName,
    );

    if (sourceIndex < 0 || targetIndex < 0) return;

    const [movedItem] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, movedItem);

    const orderMap = new Map(
      ordered.map((item, index) => [item.TABLE_NAME, index + 1]),
    );

    setTableData((prev) =>
      prev.map((item) =>
        orderMap.has(item.TABLE_NAME)
          ? { ...item, traceability_order: orderMap.get(item.TABLE_NAME) }
          : item,
      ),
    );

    try {
      setSavingTraceabilityOrder(true);
      const response = await window.versions.saveTraceabilityOrder({
        machineNames: ordered.map((item) => item.TABLE_NAME),
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to save traceability order",
        );
      }

      triggerPopup("Traceability order saved", "success");
    } catch (error) {
      console.error("Failed to save traceability order:", error);
      setTableData(previousData);
      triggerPopup("Failed to save traceability order", "error");
    } finally {
      setSavingTraceabilityOrder(false);
    }
  };

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
        <Box mt={1} mb={4}>
          <Typography variant="h6" gutterBottom>
            Traceability Display Order
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Drag and drop the active DMC machines to change the order shown on
            the Traceability page. The order is saved automatically in the
            database.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 1,
              maxWidth: 900,
            }}
          >
            {traceabilityTables.map((item, index) => (
              <Box
                key={item.TABLE_NAME}
                draggable={!savingTraceabilityOrder}
                onDragStart={(event) => {
                  setDraggedMachineName(item.TABLE_NAME);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.TABLE_NAME);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const source =
                    draggedMachineName ||
                    event.dataTransfer.getData("text/plain");
                  handleTraceabilityDrop(item.TABLE_NAME, source);
                }}
                onDragEnd={() => setDraggedMachineName(null)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1.5,
                  py: 1.25,
                  border: "1px solid",
                  borderColor:
                    draggedMachineName === item.TABLE_NAME
                      ? "primary.main"
                      : "divider",
                  borderRadius: 1,
                  backgroundColor:
                    draggedMachineName === item.TABLE_NAME
                      ? "action.selected"
                      : "background.paper",
                  cursor: savingTraceabilityOrder ? "wait" : "grab",
                  userSelect: "none",
                }}
              >
                <DragIndicatorIcon color="action" />
                <Typography
                  sx={{
                    minWidth: 28,
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  {index + 1}.
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {item.exportname}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ wordBreak: "break-all" }}
                  >
                    {item.TABLE_NAME}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {!traceabilityTables.length && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              No active DMC machines are available for Traceability.
            </Typography>
          )}
        </Box>

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
