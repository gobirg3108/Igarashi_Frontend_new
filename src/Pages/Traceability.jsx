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
} from "@mui/material";
import {  useState } from "react";
import * as XLSX from "xlsx-js-style";

export default function Traceability(props) {
  const { triggerPopup } = props;

  const [getDmc, setDmc] = useState("");
  const [getTabledataz, setTableDataz] = useState([]);

  const changeDmcValue = (e) => {
    setDmc(e.target.value);
  };

  const handleSubmit = async () => {
    if (getDmc === "") {
      return triggerPopup("Please enter DMC Code", "warning");
    }
    try {
      const result = await window.versions.getdmcdata({
        getDmc: getDmc?.toString(),
      });

      const machineOrderMap = {
        MES_MD_Commutator_Pressing: 1,
        MES_MD_Winding: 2,
        MES_MD_Armature_Fusing: 3,
        MES_MD_EP_Test_1: 4,
        MES_MD_Collar_Assembly: 5,
        MED_MD_Auto_Balancing: 6,
        MES_MD_EP_Test_DMC_Marking: 7,
      };

      // setTableDataz(result);

      const updatedTableData = result
        .map((item) => ({
          ...item,
          order: machineOrderMap[item?.machinename] || 999,
        }))
        .sort((a, b) => a.order - b.order);

      console.log("Updated Table Data:", updatedTableData);

      setTableDataz(updatedTableData);

      if (!updatedTableData?.some((item) => item?.data?.length > 0)) {
        triggerPopup("No traceability data found for this DMC code", "warning");
      }
    } catch (error) {
      console.error("Error fetching in DMC Data..?", error);
      triggerPopup("Failed to fetch traceability data", "error");
    }
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

  return (
    <Card sx={{ p: 3, mx: "auto" }}>
      <Grid container spacing={2} columnSpacing={2} alignItems="flex-end">
        <Grid item xs={12} sm={3} md={3} mb={1}>
          <FormControl fullWidth>
            <Typography mb={1}>DMC Code</Typography>
            <TextField
              fullWidth
              type="text"
              size="small"
              value={getDmc}
              onChange={(e) => {
                changeDmcValue(e);
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
              size="medium"
              variant="contained"
              onClick={() => {
                handleSubmit();
              }}
            >
              Submit
            </Button>
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

                            if (value instanceof Date) {
                              displayValue = value.toLocaleString();
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
    </Card>
  );
}
