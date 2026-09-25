import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  FormControl,
  Grid,
  TextField,
  Typography,
  Button,
  Box,
  MenuItem,
  Select,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import {
  formatDateDMY,
  formatTime12,
  formatDateInputValue,
} from "../utils/dateTime";

let first = false;
let timeslap = null;

export default function EncapAssembly(props) {
  const { triggerPopup } = props;
  const [loading, setLoading] = useState(false);

  const [machine, setMachine] = useState("");
  const [shift, setShift] = useState("Shift A");
  const [fromDate, setFromDate] = useState("");
  const [columnsdynamic, setcolumnsdynamic] = useState([]);
  const [toDate, setToDate] = useState("");
  const [getSelTemplate, setSelTemplate] = useState("select");
  const [getTemplateSelect, setTemplateSelect] = useState([]);
  const [totalRowCount, setTotalRowCount] = React.useState(0);
  const [data, setdata] = useState([]);
  const [option, setoption] = useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0, // Current page
    pageSize: 10, // Rows per page
  });
  const [filePath, setfilePath] = useState({ file: "" });

  const [shift_time, setShift_time] = useState({
    "Shift A": { from_time: "", to_time: "" },
    "Shift B": { from_time: "", to_time: "" },
    "Shift C": { from_time: "", to_time: "" },
    General: { from_time: "", to_time: "" },
    All: { from_time: "00:00", to_time: "23:59" },
    Custom: { from_time: "", to_time: "" },
  });

  useEffect(() => {
    setMachine("");
    const time = localStorage.getItem("shift_time");
    const date = sessionStorage.getItem("date")?.split("|");
    if (time) {
      setShift_time(JSON.parse(time));
    }
    if (date?.[0] && date?.[1]) {
      setFromDate(date?.[0]);
      setToDate(date?.[1]);
    } else {
      setFromDate(formatDateInputValue());
      setToDate(formatDateInputValue());
    }
    if (date?.[2]) {
      // setMachine(date?.[2]);
      window.versions
        .gettable_structure({ TABLE_NAME: date?.[2] })
        .then((res) => {
          let new_columns = [];
          for (let index = 0; index < res.length; index++) {
            const element = res[index];
            if (element?.DATA_TYPE === "datetime") {
              new_columns.push({
                header: element?.COLUMN_NAME,
                accessorFn: (row) =>
                  row.Date_Time ? formatDateDMY(row.Date_Time) : "",
              });

              new_columns.push({
                accessorKey: "Time",
                header: "Time",
                accessorFn: (row) =>
                  row.Date_Time ? formatTime12(row.Date_Time) : "",
              });
            } else {
              new_columns.push(
                element?.DATA_TYPE === "float"
                  ? {
                      header: element?.COLUMN_NAME,
                      accessorFn: (row) => +row?.[element?.COLUMN_NAME],
                    }
                  : {
                      accessorKey: element?.COLUMN_NAME,
                      header: element?.COLUMN_NAME,
                    },
              );
            }
          }
          // setcolumnsdynamic(new_columns);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

  const Debounce = useCallback((func = () => {}, delay = 150) => {
    let timer;
    return function (...args) {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }, []);

  const onchangecustomer = async (name, newvalue) => {
    if (!newvalue) return;

    setdata([]);
    setcolumnsdynamic([]);
    setSelTemplate("select");
    setMachine(newvalue?.machinename || "");

    const tableName = machine;

    try {
      const res = await window.versions.editedTemplates(newvalue?.machinename);
      setTemplateSelect(res || []);
    } catch (error) {
      console.error("Error while fetching edit template", error);
      triggerPopup("Failed to load templates for this machine", "error");
    }
  };

  console.log("columnsdynamic", columnsdynamic);

  const fetchingFinalColumn = async (machine, selectedTemplate) => {
    setSelTemplate(selectedTemplate);

    if (selectedTemplate === "No-Template") {
      try {
        window.versions
          .gettable_structure({ TABLE_NAME: machine })
          .then((res) => {
            console.log(res);
            let new_columns = [];

            for (let index = 0; index < res.length; index++) {
              const element = res[index];

              // Skip unwanted column
              if (element?.COLUMN_NAME === "Cycle_Time") continue;

              // Datetime column handling
              if (element?.DATA_TYPE === "datetime") {
                new_columns.push({
                  header: "Date",
                  accessorFn: (row) =>
                    row.Date_Time ? formatDateDMY(row.Date_Time) : "",
                });

                new_columns.push({
                  header: "Time",
                  accessorFn: (row) =>
                    row.Date_Time ? formatTime12(row.Date_Time) : "",
                });
              } else {
                // Float formatting
                if (element?.DATA_TYPE === "float") {
                  new_columns.push({
                    header: element?.COLUMN_NAME,
                    accessorFn: (row) =>
                      row?.[element?.COLUMN_NAME] != null
                        ? Number(row[element.COLUMN_NAME]).toFixed(3)
                        : "",
                  });
                } else {
                  // Default column
                  new_columns.push({
                    accessorKey: element?.COLUMN_NAME,
                    header: element?.COLUMN_NAME,
                  });
                }
              }
            }

            setcolumnsdynamic(new_columns);
          })
          .catch((error) => {
            console.log("getTemplate without color", error);
          });
      } catch (error) {
        console.log("Unexpected error", error);
      }
    } else {
      // -------------------------------------------
      // 1. GET TEMPLATE
      // -------------------------------------------
      const template =
        (await window?.versions?.get_excel_template({
          tableName: machine,
          template: selectedTemplate,
        })) || [];

      console.log("template", template);

      // Convert template array → map for fast access
      const templateMap = {};
      template.forEach((t) => {
        templateMap[t.oldHeader] = t;
      });

      // -------------------------------------------
      // 2. GET TABLE STRUCTURE (columns from DB)
      // -------------------------------------------
      const structure =
        (await window.versions.gettable_structure({
          TABLE_NAME: machine,
        })) || [];

      let finalColumns = [];

      for (let t of template) {
        const colName = t.oldHeader;

        const structureCol = structure.find((s) => s.COLUMN_NAME === colName);

        let columnDef = {};

        // DATE COLUMN
        if (colName.toLowerCase() === "date") {
          columnDef = {
            header: t.newHeader,
            id: t.oldHeader,
            order_no: t.order_no,
            accessorFn: (row) =>
              row.Date_Time ? formatDateDMY(row.Date_Time) : "",
          };
        }

        // TIME COLUMN
        else if (colName.toLowerCase() === "time") {
          columnDef = {
            header: t.newHeader,
            id: t.oldHeader,
            order_no: t.order_no,
            accessorFn: (row) =>
              row.Date_Time ? formatTime12(row.Date_Time) : "",
          };
        } else {
          if (structureCol?.DATA_TYPE === "float") {
            columnDef = {
              header: t.newHeader,
              id: t.oldHeader,
              order_no: t.order_no,
              accessorFn: (row) => +row[colName],
            };
          } else {
            columnDef = {
              header: t.newHeader,
              id: t.oldHeader,
              order_no: t.order_no,
              accessorKey: colName,
            };
          }
        }

        // COLORS
        columnDef.muiTableHeadCellProps = {
          sx: {
            backgroundColor: t.header_bg,
            "& .MuiTypography-root": {
              color: t.header_text,
              fontWeight: "bold",
            },
          },
        };

        columnDef.muiTableBodyCellProps = {
          sx: {
            backgroundColor: t.content_bg,
            color: t.content_text,
          },
        };

        finalColumns.push(columnDef);
      }

      // -------------------------------------------
      // 3. SAVE FINAL DYNAMIC COLUMNS
      // -------------------------------------------

      finalColumns.sort((a, b) => (a.order_no || 9999) - (b.order_no || 9999));

      return setcolumnsdynamic(finalColumns);
    }
  };

  const handleempty = useCallback(() => {
    setoption([]);
  }, []);

  const handlesubmit_pagnation = useCallback(
    Debounce(async () => {
      if (!fromDate) {
        return triggerPopup("Please select From Date", "warning");
      } else if (!toDate) {
        return triggerPopup("Please select To Date", "warning");
      } else if (
        !shift_time?.[shift]?.from_time ||
        !shift_time?.[shift]?.to_time
      ) {
        return triggerPopup("Please select Shift Time", "warning");
      } else if (!machine) {
        return triggerPopup("Please select Machine", "warning");
      }
      try {
        let check = Date.now();
        timeslap = check;

        const result = await window.versions.getdata({
          fromDate,
          toDate,
          ...shift_time[shift],
          machine,
          ...pagination,
          getSelTemplate,
        });

        if (check === timeslap) {
          setdata(result?.data);
          setTotalRowCount(result?.data_length || 0);
        } else {
          console.log(timeslap, check, check === timeslap);
        }
      } catch (error) {
        console.error("Failed to load assembly data:", error);
        triggerPopup("Failed to load assembly data", "error");
      }
    }),
    [fromDate, toDate, shift, machine, pagination, shift_time, getSelTemplate],
  );
  const handlesubmit = useCallback(
    async (e, getSelTemplate) => {
      const button = e?.currentTarget || e?.target;
      if (button) button.disabled = true;

      if (!fromDate) {
        if (button) button.disabled = false;
        return triggerPopup("Please select From Date", "warning");
      } else if (!toDate) {
        if (button) button.disabled = false;
        return triggerPopup("Please select To Date", "warning");
      } else if (
        !shift_time?.[shift]?.from_time ||
        !shift_time?.[shift]?.to_time
      ) {
        if (button) button.disabled = false;
        return triggerPopup("Please select Shift Time", "warning");
      } else if (!machine) {
        if (button) button.disabled = false;
        return triggerPopup("Please select Machine", "warning");
      }

      setLoading(true);
      try {
        const result = await window.versions.getdata({
          fromDate,
          toDate,
          ...shift_time[shift],
          machine,
          ...pagination,
          getSelTemplate,
        });

        setdata(result?.data || []);
        setTotalRowCount(result?.data_length || 0);

        if (!result?.data?.length) {
          triggerPopup("No records found for the selected filters", "warning");
        }
      } catch (error) {
        console.error("Failed to load assembly data:", error);
        triggerPopup("Failed to load assembly data", "error");
      } finally {
        setLoading(false);
        if (button) button.disabled = false;
      }
    },
    [
      fromDate,
      toDate,
      machine,
      shift,
      shift_time,
      pagination,
      getSelTemplate,
      triggerPopup,
    ],
  );
  // const data = [
  //     { id: 1, name: "Machine A", status: "Running" },
  //     { id: 2, name: "Machine B", status: "Stopped" },
  // ];
  const handleopenfile = useCallback(async () => {
    if (!filePath?.file) {
      return triggerPopup("Export folder is not available", "warning");
    }

    try {
      const result = await window?.versions?.openfolder(filePath.file);
      if (result?.success === false) {
        triggerPopup("Failed to open export folder", "error");
      }
    } catch (error) {
      console.error("Failed to open export folder:", error);
      triggerPopup("Failed to open export folder", "error");
    }
  }, [filePath, triggerPopup]);
  const [isLoading, setIsLoading] = useState(false);

  const exportexcel = useCallback(
    async (e, getSelTemplate) => {
      const button = e?.currentTarget || e?.target;
      if (button) button.disabled = true;
      setfilePath({});

      if (!fromDate) {
        if (button) button.disabled = false;
        return triggerPopup("Please select From Date", "warning");
      } else if (!toDate) {
        if (button) button.disabled = false;
        return triggerPopup("Please select To Date", "warning");
      } else if (
        !shift_time?.[shift]?.from_time ||
        !shift_time?.[shift]?.to_time
      ) {
        if (button) button.disabled = false;
        return triggerPopup("Please select Shift Time", "warning");
      } else if (!machine) {
        if (button) button.disabled = false;
        return triggerPopup("Please select Machine", "warning");
      }

      setIsLoading(true);

      try {
        const result = await window.versions.ping({
          fromDate,
          toDate,
          ...shift_time[shift],
          machine,
          getSelTemplate,
        });

        if (
          typeof result === "string" &&
          result.toLowerCase().includes("no data")
        ) {
          setfilePath({});
          return triggerPopup("No data to export", "warning");
        }

        if (
          result &&
          typeof result === "string" &&
          result.includes("DOWNLOAD")
        ) {
          setfilePath((prev) => ({ ...prev, file: result }));
          return triggerPopup("Excel Exported Successfully", "success");
        }

        setfilePath((prev) => ({
          ...prev,
          file: undefined,
          error: result || "Export failed",
        }));
        triggerPopup("Excel Export Failed", "error");
      } catch (error) {
        console.error("Excel Export Error:", error);
        setfilePath((prev) => ({
          ...prev,
          file: undefined,
          error: error?.message || "Export failed",
        }));
        triggerPopup("Excel Export Failed", "error");
      } finally {
        setIsLoading(false);
        if (button) button.disabled = false;
      }
    },
    [
      fromDate,
      toDate,
      shift,
      shift_time,
      machine,
      getSelTemplate,
      triggerPopup,
    ],
  );

  const exportPdf = async () => {
    if (!fromDate) {
      return triggerPopup("Please select From Date", "warning");
    }

    if (!toDate) {
      return triggerPopup("Please select To Date", "warning");
    }

    if (!shift_time?.[shift]?.from_time || !shift_time?.[shift]?.to_time) {
      return triggerPopup("Please select Shift Time", "warning");
    }

    if (!machine) {
      return triggerPopup("Please select Machine", "warning");
    }

    setIsLoading(true);

    try {
      const result = await window.versions.exportPdf({
        fromDate,
        toDate,
        ...shift_time[shift],
        machine,
        getSelTemplate,
      });

      if (
        typeof result === "string" &&
        result.toLowerCase().includes("no data")
      ) {
        return triggerPopup("No data to export", "warning");
      }

      if (
        result &&
        typeof result === "string" &&
        result.toLowerCase().endsWith(".pdf")
      ) {
        triggerPopup("PDF Exported Successfully", "success");

        const openResult = await window.versions.openfolder(result);

        if (openResult?.success === false) {
          triggerPopup(
            "PDF exported, but the file could not be opened",
            "warning",
          );
        }
        return;
      }

      triggerPopup("PDF Export Failed", "error");
    } catch (error) {
      console.error("PDF Export Error:", error);
      triggerPopup("PDF Export Failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (first) {
      handlesubmit_pagnation();
    } else {
      first = true;
    }
  }, [pagination]);

  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        "date",
        (fromDate || "") + "|" + (toDate || "") + "|" + (machine || ""),
      );
    };
  }, [fromDate, toDate]);

  useEffect(() => {
    return () => {
      timeslap = null;
      first = false;
    };
  }, []);

  //loading button
  const handletimechange = useCallback((shift1, name, value) => {
    setShift_time((p) => {
      const temp = { ...p, [shift1]: { ...p[shift1], [name]: value } };
      localStorage.setItem("shift_time", JSON.stringify(temp));
      return temp;
    });
  }, []);

  return (
    <Card sx={{ p: 3, mx: "auto" }}>
      <Typography variant="h6" gutterBottom mb={2}>
        Encap Assembly
      </Typography>
      {/* Title */}
      <Typography
        variant="h4"
        textAlign="center"
        sx={{ pb: 2, fontWeight: "bold" }}
      >
        {machine}
      </Typography>

      {/* Date & Machine Selection */}
      <Grid
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handlesubmit(e, getSelTemplate);
        }}
        container
        spacing={2}
        columnSpacing={8}
        alignItems="center"
      >
        {/* From Date */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>From Date</Typography>
          <TextField
            fullWidth
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              if (e.target.value >= toDate) {
                setToDate("");
              }
            }}
          />
        </Grid>

        {/* To Date */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>To Date</Typography>
          <TextField
            fullWidth
            type="date"
            size="small"
            inputProps={{
              min: fromDate,
            }}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </Grid>

        {/* Shift Selection */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>Shift</Typography>
          <FormControl fullWidth>
            <Select
              value={shift}
              size="small"
              onChange={(e) => setShift(e.target.value)}
            >
              {Object.keys(shift_time).map((item, index) => (
                <MenuItem value={item} key={index}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Machine Selection */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>Machine</Typography>

          <FormControl fullWidth>
            <Autocomplete
              freeSolo
              id="machine-autocomplete"
              size="small"
              options={option?.[0] ? option : machine ? [machine] : []}
              value={option?.find((t) => t.machinename === machine) || null}
              getOptionLabel={(option) => option?.TABLE_NAME || ""}
              onOpen={() => {
                window.versions
                  .getassemblytable({ value: "Encap Assembly" })
                  .then((res) => {
                    setoption(res);
                  })
                  .catch((err) => console.log(err));
              }}
              onBlur={handleempty}
              onChange={(e, newValue) => {
                onchangecustomer("TABLE_NAME", newValue);
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select Machine" />
              )}
            />
          </FormControl>
        </Grid>

        {/* Machine Selection */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography>Select Template</Typography>

          <FormControl fullWidth>
            <Select
              size="small"
              value={getSelTemplate}
              onChange={(e) => {
                let selectedTemplate = e.target.value;
                fetchingFinalColumn(machine, selectedTemplate);
              }}
            >
              <MenuItem value="select" disabled>
                Select
              </MenuItem>
              <MenuItem value={"No-Template"}>No Template</MenuItem>
              {getTemplateSelect.map((val) => (
                <MenuItem value={val.template_name}>
                  {val.template_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid
          container
          item
          xs={12}
          sm={6}
          md={4}
          spacing={2}
          alignItems="center"
        >
          <Grid item xs={6}>
            <Typography>From Time</Typography>

            <TextField
              fullWidth
              size="small"
              type={shift === "Custom" ? "time" : "text"}
              onChange={
                shift === "Custom"
                  ? (e) => {
                      handletimechange(shift, "from_time", e.target.value);
                    }
                  : () => {}
              }
              // aria-readonly={true}
              disabled={shift === "Custom" ? false : true}
              value={shift_time?.[shift]?.from_time || ""}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min interval
            />
          </Grid>
          <Grid item xs={6}>
            <Typography>To Time</Typography>

            <TextField
              fullWidth
              size="small"
              type={shift === "Custom" ? "time" : "text"}
              onChange={
                shift === "Custom"
                  ? (e) => handletimechange(shift, "to_time", e.target.value)
                  : () => {}
              }
              // aria-readonly={true}
              disabled={shift === "Custom" ? false : true}
              value={shift_time?.[shift]?.to_time || ""}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }} // 5 min interval
            />
          </Grid>
        </Grid>

        {/* Buttons */}
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          display="flex"
          gap={2}
          justifyContent="flex-end"
        >
          {filePath?.file && (
            <Button type="button" variant="contained" onClick={handleopenfile}>
              Show File
            </Button>
          )}
          {filePath?.error && filePath?.error}
          <Button type="submit" variant="contained" disabled={loading}>
            Submit
          </Button>

          <Button
            type="button"
            variant="contained"
            sx={{ color: "#ffffff", backgroundColor: "#857be6" }}
            onClick={(e) => exportPdf(e, getSelTemplate)}
          >
            {isLoading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "rgba(255,255,255,0.7)", // Semi-transparent white

                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-12px",
                  marginLeft: "-12px",
                }}
              />
            ) : (
              <>Export to PDF</>
            )}
          </Button>

          <Button
            type="button"
            variant="contained"
            color="success"
            onClick={(e) => exportexcel(e, getSelTemplate)}
          >
            {isLoading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "rgba(255,255,255,0.7)", // Semi-transparent white

                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-12px",
                  marginLeft: "-12px",
                }}
              />
            ) : (
              <>Export to Excel</>
            )}
          </Button>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Box mt={3}>
        <MaterialReactTable
          enablePagination
          manualPagination
          rowCount={totalRowCount}
          onPaginationChange={setPagination}
          state={{ pagination, isLoading: loading }}
          muiCircularProgressProps={{ thickness: 4, size: 55 }}
          columns={columnsdynamic}
          enableGlobalFilter={false}
          enableColumnFilters={false}
          data={data}
          enableTopToolbar
          positionActionsColumn="last"
        />
      </Box>
    </Card>
  );
}
