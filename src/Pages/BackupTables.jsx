import { React, useEffect, useMemo, useState, useCallback } from "react";
import {
  Typography,
  Card,
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
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Divider,
} from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { debounce } from "lodash";
import { formatDateTimeDMY } from "../utils/dateTime";

const DEFAULT_BACKUP_SETTINGS = {
  enabled: true,
  backupTime: "10:00",
  backupIntervalDays: 7,
  deleteAfterBackup: false,
  deleteOlderThanDays: 30,
  lastSuccessfulBackup: null,
  lastVerifiedBackupPath: null,
  lastCleanupAt: null,
  lastDeletedRows: 0,
  lastStatus: "NOT_RUN",
  lastMessage: "",
  nextBackup: null,
};

const formatDateTime = (value) => formatDateTimeDMY(value, false);

function BackupTables({ triggerPopup }) {
  const [getTableData, setTableData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [getOldName, setOldName] = useState("");
  const [getNewName, setNewName] = useState("");
  const [getType, setType] = useState("");
  const [getExeUser, setExeUser] = useState("");
  const [backupSettings, setBackupSettings] = useState(DEFAULT_BACKUP_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  const debouncedCheck = useCallback(
    debounce(async (value) => {
      if (value.trim() !== "") {
        const res = await window.versions.checkexisttable(value);
        setExeUser(res === "Exists" ? "Exists" : "test");
      }
    }, 500),
    [],
  );

  const loadBackupSettings = async () => {
    try {
      const res = await window.versions.getBackupSettings();
      setBackupSettings((prev) => ({ ...prev, ...res }));
    } catch (error) {
      console.error("Failed to load backup schedule settings:", error);
      triggerPopup("Failed to load backup schedule settings", "error");
    }
  };

  const getTables = async () => {
    try {
      const [tableRes, backupTableRes] = await Promise.all([
        window.versions.gettablename(),
        window.versions.getBackupTableSettings(),
      ]);

      const backupMap = new Map(
        (backupTableRes || []).map((item) => [item.TABLE_NAME, item]),
      );

      const merged = (tableRes?.mergedArray || []).map((table) => {
        const saved = backupMap.get(table.TABLE_NAME);

        return {
          ...table,
          ...(saved || {
            cleanupEnabled: false,
            dateColumn: "",
            dateColumns: [],
            canCleanup: false,
          }),
        };
      });

      setTableData(merged);
    } catch (error) {
      console.error("Failed to load backup tables:", error);
      triggerPopup("Failed to load backup tables", "error");
    }
  };

  const handleSaveSchedule = async () => {
    if (!backupSettings.backupTime) {
      return triggerPopup("Please select backup time", "warning");
    }

    try {
      setSavingSettings(true);

      const res = await window.versions.saveBackupSettings({
        enabled: Boolean(backupSettings.enabled),
        backupTime: backupSettings.backupTime,
        backupIntervalDays: Number(backupSettings.backupIntervalDays),
        deleteAfterBackup: Boolean(backupSettings.deleteAfterBackup),
        deleteOlderThanDays: Number(backupSettings.deleteOlderThanDays),
      });

      setBackupSettings((prev) => ({ ...prev, ...res }));
      triggerPopup("Backup Schedule Saved Successfully", "success");
    } catch (error) {
      console.error("Failed to save backup schedule:", error);
      triggerPopup(error?.message || "Failed to save backup schedule", "error");
    } finally {
      setSavingSettings(false);
    }
  };

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
        setTableData((prev) =>
          prev.map((item) =>
            item.TABLE_NAME === rowData.TABLE_NAME
              ? { ...item, status: newStatus }
              : item,
          ),
        );

        return triggerPopup(
          newStatus === 1
            ? "Backup Table Enabled Successfully"
            : "Backup Table Disabled Successfully",
          "success",
        );
      }

      triggerPopup("Failed to update backup table visibility", "error");
    } catch (error) {
      console.error("Failed to update backup table visibility:", error);
      triggerPopup("Failed to update backup table visibility", "error");
    }
  };

  const saveCleanupSetting = async (rowData, changes) => {
    const next = { ...rowData, ...changes };

    if (next.cleanupEnabled && !next.dateColumn) {
      return triggerPopup(
        "Select a valid Date Column before enabling data deletion.",
        "warning",
      );
    }

    try {
      const res = await window.versions.saveBackupTableSetting({
        tableName: rowData.TABLE_NAME,
        cleanupEnabled: Boolean(next.cleanupEnabled),
        dateColumn: next.dateColumn || "",
      });

      if (!res?.success) {
        return triggerPopup("Failed to save cleanup setting", "error");
      }

      setTableData((prev) =>
        prev.map((item) =>
          item.TABLE_NAME === rowData.TABLE_NAME
            ? {
                ...item,
                cleanupEnabled: Boolean(next.cleanupEnabled),
                dateColumn: next.dateColumn || "",
              }
            : item,
        ),
      );

      triggerPopup("Backup Table Cleanup Setting Saved", "success");
    } catch (error) {
      console.error("Failed to save cleanup setting:", error);
      triggerPopup(error?.message || "Failed to save cleanup setting", "error");
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
        Cell: ({ row }) => (
          <Switch
            checked={row.original.status === 1}
            onChange={() => handleToggleVisibility(row.original)}
            color="success"
          />
        ),
      },
      {
        id: "4",
        header: "Date Column",
        accessorKey: "dateColumn",
        Cell: ({ row }) => {
          const options = row.original.dateColumns || [];

          if (!options.length) {
            return (
              <Typography variant="body2" color="text.secondary">
                No Date Column
              </Typography>
            );
          }

          return (
            <Select
              size="small"
              value={row.original.dateColumn || ""}
              sx={{ minWidth: 160 }}
              onChange={(event) =>
                saveCleanupSetting(row.original, {
                  dateColumn: event.target.value,
                })
              }
            >
              {options.map((column) => (
                <MenuItem key={column.name} value={column.name}>
                  {column.name}
                </MenuItem>
              ))}
            </Select>
          );
        },
      },
      {
        id: "5",
        header: "Delete Old Data",
        accessorKey: "cleanupEnabled",
        Cell: ({ row }) => (
          <Switch
            checked={Boolean(row.original.cleanupEnabled)}
            disabled={!row.original.canCleanup}
            onChange={(event) =>
              saveCleanupSetting(row.original, {
                cleanupEnabled: event.target.checked,
              })
            }
            color="warning"
          />
        ),
      },
    ],
    [getTableData],
  );

  const handleRowEdit = (row) => {
    setOldName(row?.original?.TABLE_NAME);
    setNewName(row?.original?.exportname);
    setType(row?.original?.exportname !== "" ? "Update" : "Insert");
    setExeUser("");
    setOpenAddModal(true);
  };

  const hanleEditData = async () => {
    if (getExeUser === "Exists") {
      return triggerPopup("This Name Already Assigned", "warning");
    }

    if (getOldName === "" || getNewName === "") {
      return triggerPopup("Please Fill The Required Fields", "warning");
    }

    try {
      const res = await window.versions.tablerename({
        getOldName,
        getNewName,
        getType,
      });

      if (res.message === "Table Name Successfully") {
        await getTables();
        setOpenAddModal(false);
        return triggerPopup("Table Name Edited Successfully", "success");
      }

      return triggerPopup(
        "Something went wrong while adding tablename",
        "error",
      );
    } catch (error) {
      console.error("Error fetching in Rename Table", error);
      triggerPopup("Failed to update backup table name", "error");
    }
  };

  useEffect(() => {
    loadBackupSettings();
    getTables();
  }, []);

  return (
    <>
      <Card sx={{ p: 3, mx: "auto", mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Automatic SQL Backup Settings
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(4, minmax(180px, 1fr))",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(backupSettings.enabled)}
                onChange={(event) =>
                  setBackupSettings((prev) => ({
                    ...prev,
                    enabled: event.target.checked,
                  }))
                }
                color="success"
              />
            }
            label="Automatic Backup"
          />

          <TextField
            label="Backup Time"
            type="time"
            size="small"
            value={backupSettings.backupTime || "10:00"}
            onChange={(event) =>
              setBackupSettings((prev) => ({
                ...prev,
                backupTime: event.target.value,
              }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Backup Frequency</InputLabel>
            <Select
              label="Backup Frequency"
              value={Number(backupSettings.backupIntervalDays)}
              onChange={(event) =>
                setBackupSettings((prev) => ({
                  ...prev,
                  backupIntervalDays: Number(event.target.value),
                }))
              }
            >
              <MenuItem value={7}>Every 7 Days</MenuItem>
              <MenuItem value={15}>Every 15 Days</MenuItem>
              <MenuItem value={30}>Every 30 Days</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={Boolean(backupSettings.deleteAfterBackup)}
                onChange={(event) =>
                  setBackupSettings((prev) => ({
                    ...prev,
                    deleteAfterBackup: event.target.checked,
                  }))
                }
                color="warning"
              />
            }
            label="Delete After Verified Backup"
          />

          <FormControl
            size="small"
            fullWidth
            disabled={!backupSettings.deleteAfterBackup}
          >
            <InputLabel>Delete Data Older Than</InputLabel>
            <Select
              label="Delete Data Older Than"
              value={Number(backupSettings.deleteOlderThanDays)}
              onChange={(event) =>
                setBackupSettings((prev) => ({
                  ...prev,
                  deleteOlderThanDays: Number(event.target.value),
                }))
              }
            >
              <MenuItem value={7}>7 Days</MenuItem>
              <MenuItem value={15}>15 Days</MenuItem>
              <MenuItem value={30}>30 Days</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Backup
            </Typography>
            <Typography variant="body2">
              {formatDateTime(backupSettings.lastSuccessfulBackup)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Next Backup
            </Typography>
            <Typography variant="body2">
              {formatDateTime(backupSettings.nextBackup)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Cleanup
            </Typography>
            <Typography variant="body2">
              {formatDateTime(backupSettings.lastCleanupAt)}
              {backupSettings.lastCleanupAt
                ? ` (${backupSettings.lastDeletedRows || 0} rows)`
                : ""}
            </Typography>
          </Box>
        </Box>

        <Box mt={2} display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={handleSaveSchedule}
            disabled={savingSettings}
          >
            {savingSettings ? "Saving..." : "Save Backup Settings"}
          </Button>

          <Typography variant="body2">
            Status: <b>{backupSettings.lastStatus || "NOT_RUN"}</b>
          </Typography>
        </Box>

        {backupSettings.lastMessage ? (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {backupSettings.lastMessage}
          </Typography>
        ) : null}

        <Typography variant="body2" color="warning.main" mt={2}>
          Safety: Old DB data is deleted only after the full .bak file exists,
          is non-empty, and backup verification passes. If backup or
          verification fails, DELETE will not run.
        </Typography>
      </Card>

      <Card sx={{ p: 3, mx: "auto" }}>
        <Typography variant="h6" gutterBottom mb={1}>
          Backup Tables
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Enable "Delete Old Data" only for tables that can be safely cleaned by
          the selected date column. This cleanup runs only when the global
          "Delete After Verified Backup" setting is ON.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <MaterialReactTable
          enablePagination
          muiCircularProgressProps={{ thickness: 4, size: 55 }}
          muiTableContainerProps={{ sx: { maxHeight: "500px" } }}
          enableRowActions
          renderRowActions={({ row }) => (
            <IconButton color="primary" onClick={() => handleRowEdit(row)}>
              <EditIcon />
            </IconButton>
          )}
          columns={columns}
          enableColumnFilters
          enableGlobalFilter
          enableSorting
          enableTopToolbar
          data={getTableData}
          positionActionsColumn="last"
        />
      </Card>

      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Rename Machine
          <IconButton
            aria-label="close"
            onClick={() => setOpenAddModal(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Machine Name"
            value={getOldName}
            disabled
            fullWidth
          />

          <TextField
            label="Export Name"
            value={getNewName}
            onChange={(event) => {
              const value = event.target.value;
              setNewName(value);
              debouncedCheck(value);
            }}
            fullWidth
            error={getExeUser === "Exists"}
            helperText={
              getExeUser === "Exists" ? "This Name Already Assigned" : ""
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={hanleEditData}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default BackupTables;
