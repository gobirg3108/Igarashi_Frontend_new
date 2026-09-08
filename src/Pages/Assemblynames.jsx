import {
  React,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
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
import { Skeleton, Stack } from "@mui/material";

function Assemblynames({ triggerPopup }) {
  const [getAssemblyTableData, setAssemblyTableData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [getOldName, setOldName] = useState("");
  const [getNewName, setNewName] = useState("");
  const [getType, setType] = useState("");
  const [getExeUser, setExeUser] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const menuRef = useRef(null);

  const productOptions = [
    "Encap Assembly",
    "Motor Assembly",
    "Armature Assembly",
  ];

  const debouncedCheck = useCallback(
    debounce(async (value, menu) => {
      if (value.trim() !== "") {
        const res = await window.versions.checkexistassemblytable({
          value: value,
          menu: menu,
        });

        if (res === "Exists") {
          setExeUser("Exists");
        } else {
          setExeUser("test");
        }
      }
    }, 500),
    [],
  );

  const assemblyToggleVisibility = async (rowData) => {
    if (rowData?.exportname === "") {
      return triggerPopup(
        "Kindly assign a name to this machine.",
        "warning",
      );
    }

    const newStatus = rowData.status === 1 ? 0 : 1;

    try {
      const res = await window.versions.assemblytablerename({
        getOldName: rowData?.TABLE_NAME,
        status: newStatus,
        menu: menuRef?.current || "",
        getType: "Visiblity",
      });

      if (res?.status === 0 || res?.status === 1) {
        setAssemblyTableData((prev) =>
          prev.map((item) =>
            item.TABLE_NAME === rowData.TABLE_NAME
              ? { ...item, status: newStatus }
              : item,
          ),
        );

        return triggerPopup(
          newStatus === 1
            ? "Assembly Machine Enabled Successfully"
            : "Assembly Machine Disabled Successfully",
          "success",
        );
      }

      triggerPopup("Failed to update assembly visibility", "error");
    } catch (error) {
      console.error("Failed to update assembly visibility:", error);
      triggerPopup("Failed to update assembly visibility", "error");
    }
  };

  const assemblyColumns = useMemo(
    () => [
      { id: "1", header: "Machine Name", accessorKey: "TABLE_NAME" },
      { id: "2", header: "Export Name", accessorKey: "exportname" },
      {
        id: "3",
        header: "Page Name",
        accessorKey: "menu",
      },
      {
        id: "4",
        header: "Visibility",
        accessorKey: "status",
        Cell: ({ row }) => {
          const isVisible = row.original.status === 1;

          return (
            <Switch
              checked={isVisible}
              onChange={() => assemblyToggleVisibility(row.original)}
              color="success"
            />
          );
        },
      },
    ],
    [],
  );

  const getAssemblyTables = () => {
    window.versions
      .getAssemblytablename()
      .then((res) => {
        setAssemblyTableData(res?.mergedArray);
      })
      .catch((err) => {
        console.error("Failed to load assembly tables:", err);
        triggerPopup("Failed to load assembly tables", "error");
      });
  };

  const handleRowEdit = (row) => {
    console.log("Row Dataz :", row);
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
        const res = await window.versions.assemblytablerename({
          getOldName: getOldName,
          getNewName: getNewName,
          getType: getType,
          menu: menuRef?.current || "",
        });

        if (res.message === "Table Name Successfully") {
          getAssemblyTables();
          setSelectedProduct("");
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
        triggerPopup("Failed to update assembly table name", "error");
      }
    }
  };

  const handleCloseAdd = () => {
    setOpenAddModal(false);
  };

  useEffect(() => {
    getAssemblyTables();
  }, []);

  return (
    <>
      <Card sx={{ p: 3, mx: "auto" }}>
        <Box mt={3}>
          <Typography variant="h6" gutterBottom mt={2} mb={2}>
            Assembly Menu
          </Typography>

          <Select
            value={selectedProduct}
            size="small"
            sx={{ marginBottom: "20px", width: "300px" }}
            onChange={async (e) => {
              let valuez = e?.target?.value;
              setSelectedProduct(valuez);
              menuRef.current = valuez;

              if (valuez) {
                try {
                  const res = await window.versions.getAssemblyDatas({
                    menu: valuez,
                  });

                  if (res.message === "Table Loaded") {
                    setAssemblyTableData(res?.data);
                    console.log("res", res);
                  } else {
                    return triggerPopup(
                      "Something went wrong while adding Assembly Table",
                      "error",
                    );
                  }
                } catch (error) {
                  console.error("Error fetching in Assembly Table", error);
                  triggerPopup("Failed to load assembly table data", "error");
                }
              }
            }}
            displayEmpty
          >
            <MenuItem value="">Select Assembly Menu</MenuItem>
            {productOptions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>

          {!selectedProduct ? (
            <Stack spacing={2}>
              <Skeleton variant="text" height={40} />
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="rectangular" height={60} />
            </Stack>
          ) : (
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
                  <IconButton
                    color="primary"
                    onClick={() => handleRowEdit(row)}
                  >
                    <EditIcon />
                  </IconButton>
                </>
              )}
              columns={assemblyColumns}
              data={getAssemblyTableData}
              enableColumnFilters={true}
              enableGlobalFilter={true}
              enableSorting={true}
              enableTopToolbar={true}
              positionActionsColumn="last"
            />
          )}
        </Box>
      </Card>

      {/* Assembly Menu Dialog Start Here  */}
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
                  debouncedCheck(value, selectedProduct);
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
      {/* Assembly Menu Dialog Start Here  */}
    </>
  );
}

export default Assemblynames;
