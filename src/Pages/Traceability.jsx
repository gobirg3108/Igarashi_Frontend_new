import {
  Grid,
  Typography,
  Card,
  FormControl,
  TextField,
  Paper,
  Button,
  Box,
  TableHead,
  Table,
  TableRow,
  TableCell,
  TableContainer,
  TableBody,
  Switch,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx-js-style";
import ClearIcon from "@mui/icons-material/Clear";
import { formatDateTimeDMY } from "../utils/dateTime";

const TRACEABILITY_SESSION_KEY = "igarashi_traceability_session";

const loadTraceabilitySession = () => {
  try {
    const saved = sessionStorage.getItem(TRACEABILITY_SESSION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return {
      dmc: typeof parsed?.dmc === "string" ? parsed.dmc : "",
      tableData: Array.isArray(parsed?.tableData) ? parsed.tableData : [],
      lastFetchedDmc:
        typeof parsed?.lastFetchedDmc === "string"
          ? parsed.lastFetchedDmc
          : "",
    };
  } catch (error) {
    console.error("Failed to restore Traceability session:", error);
    return null;
  }
};

const saveTraceabilitySession = (data) => {
  try {
    sessionStorage.setItem(TRACEABILITY_SESSION_KEY, JSON.stringify(data));
  } catch (error) {
    // Do not break Traceability if browser session storage is unavailable/full.
    console.error("Failed to save Traceability session:", error);
  }
};

const clearTraceabilitySession = () => {
  try {
    sessionStorage.removeItem(TRACEABILITY_SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear Traceability session:", error);
  }
};

export default function Traceability(props) {
  const { triggerPopup } = props;

  const [restoredSession] = useState(() => loadTraceabilitySession());

  const [getDmc, setDmc] = useState(restoredSession?.dmc || "");
  const [getTabledataz, setTableDataz] = useState(
    restoredSession?.tableData || [],
  );
  const [barcodeEnabled, setBarcodeEnabled] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState("landscape");
  const [lastFetchedDmc, setLastFetchedDmc] = useState(
    restoredSession?.lastFetchedDmc || "",
  );
  const dmcInputRef = useRef(null);
  const barcodeTimerRef = useRef(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadBarcodeSetting = async () => {
      try {
        const result = await window.versions.getBarcodeScanSetting();
        if (isMounted && result?.success) {
          setBarcodeEnabled(Boolean(result.barcodeEnabled));
        }
      } catch (error) {
        console.error("Failed to load Barcode Scan setting:", error);
      }
    };

    loadBarcodeSetting();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (barcodeTimerRef.current) {
      clearTimeout(barcodeTimerRef.current);
      barcodeTimerRef.current = null;
    }

    if (barcodeEnabled) {
      setTimeout(() => {
        dmcInputRef.current?.focus();
        dmcInputRef.current?.select();
      }, 0);
    }
  }, [barcodeEnabled]);

  useEffect(() => {
    return () => {
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (dmcOverride) => {
    const dmcCode = (
      typeof dmcOverride === "string" ? dmcOverride : getDmc
    )
      ?.toString()
      .trim();

    if (!dmcCode) {
      return triggerPopup("Please enter DMC Code", "warning");
    }

    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setIsFetching(true);

      const result = await window.versions.getdmcdata({
        getDmc: dmcCode,
      });

      // Backend returns the rows in the drag-and-drop order saved in DB.
      // Do not hard-code machine order in the UI.
      const updatedTableData = Array.isArray(result) ? result : [];

      console.log("Updated Table Data:", updatedTableData);

      setDmc(dmcCode);
      setTableDataz(updatedTableData);
      setLastFetchedDmc(dmcCode);

      saveTraceabilitySession({
        dmc: dmcCode,
        tableData: updatedTableData,
        lastFetchedDmc: dmcCode,
      });

      if (!updatedTableData?.some((item) => item?.data?.length > 0)) {
        triggerPopup("No traceability data found for this DMC code", "warning");
      }
    } catch (error) {
      console.error("Error fetching in DMC Data..?", error);
      triggerPopup("Failed to fetch traceability data", "error");
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);

      if (barcodeEnabled) {
        setTimeout(() => {
          dmcInputRef.current?.focus();
          dmcInputRef.current?.select();
        }, 0);
      }
    }
  };

  const handleBarcodeToggle = async (event) => {
    const nextValue = event.target.checked;
    const previousValue = barcodeEnabled;

    if (barcodeTimerRef.current) {
      clearTimeout(barcodeTimerRef.current);
      barcodeTimerRef.current = null;
    }

    setBarcodeEnabled(nextValue);

    try {
      const result = await window.versions.saveBarcodeScanSetting({
        barcodeEnabled: nextValue,
      });

      if (!result?.success) {
        throw new Error(result?.message || "Unable to save Barcode Scan setting");
      }

      triggerPopup(
        `Barcode Scan ${nextValue ? "Enabled" : "Disabled"}`,
        "success",
      );
    } catch (error) {
      console.error("Failed to save Barcode Scan setting:", error);
      setBarcodeEnabled(previousValue);
      triggerPopup("Failed to save Barcode Scan setting", "error");
    }
  };

  const changeDmcValue = (e) => {
    const value = e.target.value;
    setDmc(value);

    if (barcodeTimerRef.current) {
      clearTimeout(barcodeTimerRef.current);
      barcodeTimerRef.current = null;
    }

    // Some barcode scanners do not send Enter after the scan.
    // When Barcode Scan is ON, wait briefly for scanner typing to finish,
    // then fetch once using the complete scanned value.
    if (barcodeEnabled && value.trim()) {
      barcodeTimerRef.current = setTimeout(() => {
        barcodeTimerRef.current = null;
        handleSubmit(value);
      }, 250);
    }
  };


  const handleClearDmc = () => {
    if (barcodeTimerRef.current) {
      clearTimeout(barcodeTimerRef.current);
      barcodeTimerRef.current = null;
    }

    setDmc("");
    setTableDataz([]);
    setLastFetchedDmc("");
    clearTraceabilitySession();

    setTimeout(() => {
      dmcInputRef.current?.focus();
    }, 0);
  };

  const handleExportAll = async () => {
    if (!getTabledataz?.some((t) => t.data?.length > 0)) {
      return triggerPopup("No Data To Export", "warning");
    }

    try {
      const workbook = XLSX.utils.book_new();
      const sheetData = [];
      let tableMeta = [];
      let currentRow = 0;

      getTabledataz
        .filter((item) => item.data?.length > 0)
        .forEach((item) => {
          const headers = Object.keys(item.data[0]);
          const startRow = currentRow;

          sheetData.push([item.table]);
          currentRow++;

          sheetData.push(headers);
          currentRow++;

          item.data.forEach((row) => {
            const formattedRow = headers.map((header) => {
              const value = row[header];
              if (value instanceof Date) return value.toLocaleString();
              if (typeof value === "string") return value.trim();
              if (value == null) return "";
              return value;
            });

            sheetData.push(formattedRow);
            currentRow++;
          });

          tableMeta.push({
            startRow,
            headerRow: startRow + 1,
            endRow: currentRow - 1,
            colCount: headers.length,
          });

          sheetData.push([]);
          currentRow++;
        });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // 🎨 Styling
      tableMeta.forEach(({ startRow, headerRow, endRow, colCount }) => {
        ws["!merges"] = ws["!merges"] || [];
        ws["!merges"].push({
          s: { r: startRow, c: 0 },
          e: { r: startRow, c: colCount - 1 },
        });

        const titleCell = XLSX.utils.encode_cell({ r: startRow, c: 0 });
        ws[titleCell].s = { font: { bold: true, sz: 14 } };

        for (let c = 0; c < colCount; c++) {
          const headerCell = XLSX.utils.encode_cell({ r: headerRow, c });

          ws[headerCell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: {
              patternType: "solid",
              fgColor: { rgb: "1976D2" },
            },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          };
        }

        for (let r = headerRow + 1; r <= endRow; r++) {
          for (let c = 0; c < colCount; c++) {
            const cell = XLSX.utils.encode_cell({ r, c });
            if (!ws[cell]) continue;

            ws[cell].s = {
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
              },
            };
          }
        }
      });

      XLSX.utils.book_append_sheet(workbook, ws, "Traceability");

      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });

      const response = await window.versions.saveTraceabilityExcel({
        buffer,
        fileName: `DMC_TRACEABILITY_${Date.now()}.xlsx`,
      });

      if (response?.success) {
        triggerPopup("Excel Saved Successfully", "success");
      } else {
        triggerPopup("Failed To Save Excel", "error");
      }
    } catch (error) {
      console.error("Export Error:", error);
      triggerPopup("Export Failed", "error");
    }
  };

  const handleExportPdf = async (orientation = pdfOrientation) => {
    const dmcCode = String(lastFetchedDmc || getDmc || "").trim();

    if (!dmcCode || !getTabledataz?.some((t) => t.data?.length > 0)) {
      return triggerPopup("No Data To Export", "warning");
    }

    if (isPdfExporting) return;

    try {
      setIsPdfExporting(true);

      const response = await window.versions.exportTraceabilityPdf({
        getDmc: dmcCode,
        orientation,
      });

      if (response?.success) {
        setPdfDialogOpen(false);
        triggerPopup(
          `Traceability PDF (${orientation === "portrait" ? "Portrait" : "Landscape"}) Saved Successfully`,
          "success",
        );
      } else {
        triggerPopup(
          response?.message || "Failed To Save Traceability PDF",
          "error",
        );
      }
    } catch (error) {
      console.error("Traceability PDF Export Error:", error);
      triggerPopup("Traceability PDF Export Failed", "error");
    } finally {
      setIsPdfExporting(false);
    }
  };

  return (
    <Card sx={{ p: 3, mx: "auto" }}>
      <Grid
        component="form"
        onSubmit={(e) => {
          e.preventDefault();

          if (barcodeTimerRef.current) {
            clearTimeout(barcodeTimerRef.current);
            barcodeTimerRef.current = null;
          }

          handleSubmit();
        }}
        container
        spacing={2}
        columnSpacing={2}
        alignItems="flex-end"
      >
        <Grid item xs={12} sm={3} md={3} mb={1}>
          <FormControl fullWidth>
            <Typography mb={1}>DMC Code</Typography>
            <TextField
              fullWidth
              type="text"
              size="small"
              value={getDmc}
              inputRef={dmcInputRef}
              autoFocus
              onChange={(e) => {
                changeDmcValue(e);
              }}
              onKeyDown={(e) => {
                if (barcodeEnabled && e.key === "Enter") {
                  e.preventDefault();

                  if (barcodeTimerRef.current) {
                    clearTimeout(barcodeTimerRef.current);
                    barcodeTimerRef.current = null;
                  }

                  handleSubmit(e.currentTarget.value);
                }
              }}
              InputProps={{
                endAdornment: getDmc ? (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      aria-label="Clear DMC Code"
                      onClick={handleClearDmc}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4} md={4} mb={1}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              columnGap: "15px",
            }}
          >
            <Button
              type="submit"
              size="medium"
              variant="contained"
              disabled={isFetching}
            >
              {isFetching ? "Fetching..." : "Submit"}
            </Button>

            <FormControlLabel
              control={
                <Switch
                  checked={barcodeEnabled}
                  onChange={handleBarcodeToggle}
                />
              }
              label="Barcode Scan"
            />
          </Box>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="contained"
            sx={{ mr: 2 }}
            onClick={async () => {
              try {
                const res = await window.versions.openTraceabilityFolder();
                if (!res?.success) {
                  triggerPopup("Today's folder not found", "warning");
                }
              } catch (error) {
                console.error("Failed to open traceability folder:", error);
                triggerPopup("Failed to open traceability folder", "error");
              }
            }}
          >
            Open Today Folder
          </Button>

          <Button
            variant="contained"
            color="error"
            sx={{ mr: 2 }}
            onClick={() => setPdfDialogOpen(true)}
            disabled={
              isPdfExporting ||
              !getTabledataz?.some((t) => t.data?.length > 0)
            }
          >
            {isPdfExporting ? "Exporting PDF..." : "Export PDF"}
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleExportAll}
            disabled={!getTabledataz?.some((t) => t.data?.length > 0)}
          >
            Export All Tables
          </Button>
        </Box>

        {getTabledataz
          ?.filter((item) => item.data && item.data.length > 0)
          .map((item, index) => {
            const headers = Object.keys(item.data[0]);

            return (
              <Box key={item.table || index} mb={5}>
                <Typography variant="h6" mb={2} sx={{ fontWeight: 600 }}>
                  {item.table}
                </Typography>

                <TableContainer
                  component={Paper}
                  sx={{
                    maxHeight: 500,
                    overflow: "auto",
                    borderRadius: 2,
                  }}
                >
                  <Table
                    size="small"
                    stickyHeader
                    sx={{
                      borderCollapse: "collapse",
                      "& th, & td": {
                        border: "1px solid #d0d0d0",
                      },
                      "& tbody tr:nth-of-type(odd)": {
                        backgroundColor: "#f9f9f9",
                      },
                      "& tbody tr:hover": {
                        backgroundColor: "#eef3ff",
                      },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        {headers.map((header) => (
                          <TableCell
                            key={header}
                            sx={{
                              fontWeight: "bold",
                              backgroundColor: "#1976d2",
                              color: "#fff",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {item.data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {headers.map((header) => {
                            const value = row[header];
                            let displayValue = "";

                            if (String(header).toLowerCase() === "date_time") {
                              displayValue = formatDateTimeDMY(value);
                            } else if (value instanceof Date) {
                              displayValue = formatDateTimeDMY(value);
                            } else if (typeof value === "string") {
                              displayValue = value.trim();
                            } else if (value === null || value === undefined) {
                              displayValue = "";
                            } else {
                              displayValue = value;
                            }

                            return (
                              <TableCell
                                key={header}
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                {displayValue}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
      </Box>

      <Dialog
        open={pdfDialogOpen}
        onClose={() => {
          if (!isPdfExporting) setPdfDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Export Traceability PDF</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5, color: "text.secondary" }}>
            Select PDF orientation
          </Typography>

          <RadioGroup
            value={pdfOrientation}
            onChange={(event) => setPdfOrientation(event.target.value)}
          >
            <FormControlLabel
              value="landscape"
              control={<Radio />}
              label="Landscape - compact table view"
            />
            <FormControlLabel
              value="portrait"
              control={<Radio />}
              label="Portrait - parameter / value view"
            />
          </RadioGroup>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPdfDialogOpen(false)}
            disabled={isPdfExporting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleExportPdf(pdfOrientation)}
            disabled={isPdfExporting}
          >
            {isPdfExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
