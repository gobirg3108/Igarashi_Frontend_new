import { React, useState, useCallback } from "react";
import {
  Grid,
  Typography,
  Card,
  FormControl,
  TextField,
  Autocomplete,
  Button,
  Box,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import Switch from "@mui/material/Switch";
import { debounce } from "lodash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

function ExcelTemplate({ triggerPopup }) {
  const [option, setoption] = useState([]);
  const [machine, setMachine] = useState("");
  const [columnsdynamic, setcolumnsdynamic] = useState([]);
  const [machineInput, setMachineInput] = useState("");
  const [getSelTemplate, setSelTemplate] = useState("");
  const [getWindowType, setWindowType] = useState("");
  const [getExTemplate, setExTemplate] = useState("");
  const [getTemplateSelect, setTemplateSelect] = useState([]);
  const [getSelectedTemplate, setSelectedTemplate] = useState("select");
  const [isChecked, setIsChecked] = useState(false);

  const debouncedCheck = useCallback(
    debounce(async (value, machine) => {
      if (value.trim() !== "") {
        try {
          const res = await window.versions.checkexisttemplate({
            tableName: machine,
            templateName: value,
          });

          if (res === "Exists") {
            setExTemplate("Exists");
          } else {
            setExTemplate("");
          }
        } catch (error) {
          console.log("Error in fetching getting Ex Template");
        }
      }
    }, 500),
    []
  );

  const handleempty = useCallback(() => {
    setoption([]);
  }, []);

  const handleSubmit = async () => {
    if (!machine) return triggerPopup("Select a Machine First", "warning");

    if (getSelTemplate === "" || getSelTemplate === "select") {
      return triggerPopup("Select a Template Name First", "warning");
    }

    if (getExTemplate === "Exists") {
      return triggerPopup("Please Select Another Template Name", "warning");
    }

    const payload = {
      tableName: machine,
      templateName: getSelTemplate,
      template: columnsdynamic?.map((c) => ({
        oldHeader: c?.oldHeader,
        newHeader: c?.newHeader,
        header_bg: c?.header_bg,
        header_text: c?.header_text,
        content_bg: c?.content_bg,
        content_text: c?.content_text,
        order_no: c?.order_no,
        display: c?.display,
        DATA_TYPE: c?.DATA_TYPE || "",
        decimalpoint: c?.decimalpoint ? c?.decimalpoint : 3,
        roundof: c?.roundof ?? 0,
      })),
    };

    try {
      const res = await window.versions.excel_template(payload);

      if (res?.message === "Inserted/Updated successfully") {
        triggerPopup("Template Saved Successfully", "success");
        setMachineInput("");
        setoption([]);
        setcolumnsdynamic([]);
        setWindowType("");
        setMachine("");
        setSelTemplate("");
      } else {
        triggerPopup(res?.message || "Template save failed", "error");
      }
    } catch (err) {
      console.error(err);
      triggerPopup("Save failed", "error");
    }
  };

  const onchangecustomer = useCallback(async (name, newvalue) => {
    if (!newvalue) {
      setMachine("");
      setcolumnsdynamic([]);
      return;
    }

    const tableName = newvalue.machinename;
    setMachine(tableName);
    setSelTemplate("");

    try {
      const struct = await window.versions.gettable_structure({
        TABLE_NAME: tableName,
      });

      const baseColumns = [];
      for (const element of struct) {
        if (element?.COLUMN_NAME === "Cycle_Time") continue;

        if (element?.DATA_TYPE === "datetime") {
          baseColumns.push({
            oldHeader: "Date",
            newHeader: "Date",
            header_bg: "#ffffff",
            DATA_TYPE: "datetime",
          });
          baseColumns.push({
            oldHeader: "Time",
            newHeader: "Time",
            header_bg: "#ffffff",
            DATA_TYPE: "datetime",
          });
        } else {
          baseColumns.push({
            oldHeader: element?.COLUMN_NAME,
            newHeader: element?.COLUMN_NAME,
            header_bg: "#ffffff",
            DATA_TYPE: element?.DATA_TYPE,
          });
        }
      }

      const dbTemplate =
        (await window.versions.get_excel_template({ tableName })) || [];

      const dbMap = new Map(dbTemplate.map((x) => [x.oldHeader, x]));

      const merged = baseColumns.map((col, key) => {
        const saved = dbMap.get(col.oldHeader);

        return {
          oldHeader: col.oldHeader,
          newHeader: saved?.newHeader ?? col.newHeader,
          header_bg: saved?.header_bg ?? col.header_bg ?? "#ffffff",
          header_text: saved?.header_text ?? col.header_text ?? "#ffffff",
          content_bg: saved?.content_bg ?? col.content_bg ?? "#ffffff",
          content_text: saved?.content_text ?? col.content_text ?? "#ffffff",
          order_no: saved?.order_no ?? col.order_no ?? key + 1,
          display: saved?.display ?? col.display ?? 1,
          DATA_TYPE: saved?.DATA_TYPE ?? col?.DATA_TYPE,
          decimalpoint: saved?.decimalpoint ?? col?.decimalpoint,
          roundof: saved?.roundof ?? col?.roundof ?? 0,
        };
      });

      // setcolumnsdynamic(merged);
      setcolumnsdynamic([]);
    } catch (err) {
      console.error("onchangecustomer error:", err);
      setcolumnsdynamic([]);
    }
  }, []);

  const handleMachineChange = (newValue) => {
    setMachine(newValue?.TABLE_NAME || "");
  };

  const handleSortOrder = useCallback((oldHeader, newValue) => {
    setcolumnsdynamic((prev) => {
      const newOrder = Number(newValue);

      let updated = [...prev].sort((a, b) => a.order_no - b.order_no);

      const currentIndex = updated.findIndex((i) => i.oldHeader === oldHeader);
      if (currentIndex === -1) return prev;

      const [currentItem] = updated.splice(currentIndex, 1);

      const maxPosition = updated.length + 1;
      let targetPos = Number.isNaN(newOrder) ? 1 : newOrder;

      if (targetPos < 1) targetPos = 1;
      if (targetPos > maxPosition) targetPos = maxPosition;

      updated.splice(targetPos - 1, 0, currentItem);

      updated = updated.map((item, index) => ({
        ...item,
        order_no: index + 1,
      }));

      return updated;
    });
  });

  const handleHeaderChange = useCallback((oldHeader, newHeaderValue) => {
    setcolumnsdynamic((prev) =>
      prev.map((c) =>
        c.oldHeader === oldHeader ? { ...c, newHeader: newHeaderValue } : c
      )
    );
  }, []);

  const handleHeaderBgChange = useCallback((oldHeader, newColor) => {
    setcolumnsdynamic((prev) =>
      prev.map((c) =>
        c.oldHeader === oldHeader ? { ...c, header_bg: newColor } : c
      )
    );
  }, []);

  const handleHeaderTextChange = useCallback((oldHeader, newColor) => {
    setcolumnsdynamic((prev) =>
      prev.map((c) =>
        c.oldHeader === oldHeader ? { ...c, header_text: newColor } : c
      )
    );
  }, []);

  const handleContentBgChange = useCallback((oldHeader, newColor) => {
    setcolumnsdynamic((prev) =>
      prev.map((c) =>
        c.oldHeader === oldHeader ? { ...c, content_bg: newColor } : c
      )
    );
  }, []);

  const handleBodyTextChange = useCallback((oldHeader, newColor) => {
    setcolumnsdynamic((prev) =>
      prev.map((c) =>
        c.oldHeader === oldHeader ? { ...c, content_text: newColor } : c
      )
    );
  }, []);

  const handleRoundofToggle = (oldHeader, checked) => {
    setcolumnsdynamic((prev) =>
      prev.map((col) =>
        col.oldHeader === oldHeader ? { ...col, roundof: checked ? 1 : 0 } : col
      )
    );
  };

  const handleToggleVisible = (oldHeader, checked) => {
    setcolumnsdynamic((prev) =>
      prev.map((col) =>
        col.oldHeader === oldHeader ? { ...col, display: checked ? 1 : 0 } : col
      )
    );
  };

  const addNewTemplate = async () => {
    if (!machine) {
      return triggerPopup("Select a machine first", "warning");
    }

    setExTemplate("");
    setSelTemplate("");

    try {
      const tableName = machine;

      const struct = await window.versions.gettable_structure({
        TABLE_NAME: tableName,
      });

      const baseColumns = [];
      for (const element of struct) {
        if (element?.COLUMN_NAME === "Cycle_Time") continue;

        if (element?.DATA_TYPE === "datetime") {
          baseColumns.push({
            oldHeader: "Date",
            newHeader: "Date",
            header_bg: "#ffffff",
            DATA_TYPE: "datetime",
          });
          baseColumns.push({
            oldHeader: "Time",
            newHeader: "Time",
            header_bg: "#ffffff",
            DATA_TYPE: "datetime",
          });
        } else {
          baseColumns.push({
            oldHeader: element?.COLUMN_NAME,
            newHeader: element?.COLUMN_NAME,
            header_bg: "#ffffff",
            DATA_TYPE: element?.DATA_TYPE,
          });
        }
      }

      const merged = baseColumns.map((col, key) => {
        return {
          oldHeader: col.oldHeader,
          newHeader: col.newHeader,
          header_bg: col.header_bg ?? "#ffffff",
          header_text: col.header_text ?? "#ffffff",
          content_bg: col.content_bg ?? "#ffffff",
          content_text: col.content_text ?? "#ffffff",
          order_no: col.order_no ?? key + 1,
          display: col.display ?? 1,
          DATA_TYPE: col?.DATA_TYPE,
          decimalpoint: col?.decimalpoint,
          roundof: col?.roundof ?? 0,
        };
      });

      setWindowType("addData");
      setcolumnsdynamic(merged);
    } catch (err) {
      console.error("onchangecustomer error:", err);
      setcolumnsdynamic([]);
    }
  };

  const editTemplate = async () => {
    if (!machine) {
      return triggerPopup("Select a machine first", "warning");
    }

    setcolumnsdynamic([]);
    setSelTemplate("select");

    try {
      const res = await window.versions.editedTemplates(machine);
      setTemplateSelect(res || []);
      setWindowType(res.length ? "editData" : "");

      if (res.length === 0) {
        return triggerPopup(
          "No templates are available for this machine.",
          "error"
        );
      }
    } catch (error) {
      setWindowType("");
      console.log("Error while fetching edit template", error);
    }
  };

  const handleDecimalChange = (oldHeader, value) => {
    setcolumnsdynamic((prev) =>
      prev.map((col) =>
        col.oldHeader === oldHeader
          ? { ...col, decimalpoint: Number(value) || 3 }
          : col
      )
    );
  };

  console.log("columnsdynamic", columnsdynamic);

  const showEditedTemplate = async (machine, template) => {
    if (!machine) {
      setMachine("");
      setcolumnsdynamic([]);
      return;
    }
    const tableName = machine;

    try {
      const struct = await window.versions.gettable_structure({
        TABLE_NAME: tableName,
      });

      const baseColumns = [];
      for (const element of struct) {
        if (element?.COLUMN_NAME === "Cycle_Time") continue;

        if (element?.DATA_TYPE === "datetime") {
          baseColumns.push({
            oldHeader: "Date",
            newHeader: "Date",
            header_bg: "#ffffff",
            DATA_TYPE: "datetime",
          });
          baseColumns.push({
            oldHeader: "Time",
            newHeader: "Time",
            header_bg: "#ffffff",
            DATA_TYPE: "datetime",
          });
        } else {
          baseColumns.push({
            oldHeader: element?.COLUMN_NAME,
            newHeader: element?.COLUMN_NAME,
            header_bg: "#ffffff",
            DATA_TYPE: element?.DATA_TYPE,
          });
        }
      }

      const dbTemplate =
        (await window.versions.get_excel_template({ tableName, template })) ||
        [];

      const dbMap = new Map(dbTemplate.map((x) => [x.oldHeader, x]));

      const merged = baseColumns.map((col, key) => {
        const saved = dbMap.get(col.oldHeader);

        return {
          oldHeader: col.oldHeader,
          newHeader: saved?.newHeader ?? col.newHeader,
          header_bg: saved?.header_bg ?? col.header_bg ?? "#ffffff",
          header_text: saved?.header_text ?? col.header_text ?? "#ffffff",
          content_bg: saved?.content_bg ?? col.content_bg ?? "#ffffff",
          content_text: saved?.content_text ?? col.content_text ?? "#ffffff",
          order_no: saved?.order_no ?? col.order_no ?? key + 1,
          display: saved?.display ?? col.display ?? 0,
          DATA_TYPE: saved?.DATA_TYPE ?? col?.DATA_TYPE,
          decimalpoint: saved?.decimalpoint ?? col?.decimalpoint,
          roundof: saved?.roundof ?? col?.roundof,
        };
      });

      setcolumnsdynamic(merged);
    } catch (err) {
      console.error("onchangecustomer error:", err);
      setcolumnsdynamic([]);
    }
  };

  const deleteTemplate = async () => {
    if (!machine || machine === "") {
      return triggerPopup("Select a machine first", "warning");
    }

    if (getSelTemplate === "") {
      return triggerPopup("Select a template first", "warning");
    }

    const isConfirm = window.confirm(
      `Are you sure you want to delete the template "${getSelTemplate}"?`
    );

    if (!isConfirm) {
      return;
    }

    try {
      const res = await window.versions.deletetemplate({
        machine,
        getSelTemplate,
      });

      if (res?.rowsAffected?.[0] > 0 || res?.rowsAffected > 0) {
        triggerPopup("Template Deleted Successfully", "success");
        setMachineInput("");
        setoption([]);
        setcolumnsdynamic([]);
        setWindowType("");
        setMachine("");
        setSelTemplate("");
      } else {
        triggerPopup("Template delete failed", "error");
      }
    } catch (error) {
      console.error("Error in Delete template", error);
      triggerPopup("Template delete failed", "error");
    }
  };

  return (
    <Card
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      sx={{ p: 3, mx: "auto" }}
    >
      <Grid container spacing={2} columnSpacing={2} alignItems="flex-end">
        {/* Machine Selection */}

        <Grid item xs={12} sm={5} md={5} mb={1}>
          <FormControl fullWidth>
            <Typography sx={{ mb: 1 }}>Select Machine</Typography>
            <Autocomplete
              freeSolo
              id="combo-box-demo"
              size="small"
              options={option?.[0] ? option : machine ? [machine] : []}
              value={option?.find((t) => t.machinename === machine) || null}
              getOptionLabel={(option) => option?.TABLE_NAME || ""}
              inputValue={machineInput}
              onInputChange={(e, newInput) => setMachineInput(newInput)}
              onOpen={async (event, newInputValue) => {
                window.versions
                  .getactivetable()
                  ?.then((res) => {
                    setoption(res || []);
                  })
                  ?.catch((err) => {
                    console.log(err);
                  });
              }}
              onBlur={() => {
                handleempty;
              }}
              // onOpen={handleempty}

              // onInputChange={customerOnChange}
              onChange={(e, newValue) => {
                handleMachineChange(newValue); // updates machine state
                onchangecustomer("newValue", newValue); // your other function
                setWindowType("");
              }}
              renderInput={(params) => <TextField {...params} />}
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
            <Button type="button" size="medium" variant="contained" onClick={editTemplate}>
              Edit Template
            </Button>
            <Button
              type="button"
              size="medium"
              variant="contained"
              onClick={() => {
                addNewTemplate();
              }}
            >
              Add Template
            </Button>
          </Box>
        </Grid>

        <Grid item sm={3} md={3}></Grid>

        {getWindowType === "editData" ? (
          <Grid item xs={12} sm={5} md={5}>
            <Typography sx={{ mb: 1 }}>Select Template Name</Typography>
            <FormControl fullWidth>
              <Select
                value={getSelTemplate}
                onChange={(e) => {
                  let template = e.target.value;
                  setSelTemplate(template);
                  showEditedTemplate(machine, template);
                }}
              >
                <MenuItem value="select" disabled>
                  Select
                </MenuItem>
                {getTemplateSelect.map((val) => (
                  <MenuItem value={val.template_name}>
                    {val.template_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ) : (
          ""
        )}

        {getSelTemplate !== "select" &&
        getSelTemplate !== "" &&
        machine !== "" &&
        getWindowType !== "addData" ? (
          <Grid item xs={12} sm={5} md={5}>
            <Button
              type="button"
              variant="contained"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={deleteTemplate}
            >
              Delete Template
            </Button>
          </Grid>
        ) : (
          ""
        )}

        {getWindowType === "addData" ? (
          <Grid item xs={12} sm={5} md={5}>
            <Typography sx={{ mb: 1 }}>Add Template Name</Typography>
            <FormControl fullWidth>
              <TextField
                type="text"
                value={getSelTemplate || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  setSelTemplate(value);
                  debouncedCheck(value, machine);
                }}
              />
            </FormControl>
            <Typography sx={{ mt: 1, color: "#dd2b33" }}>
              {getExTemplate === "Exists" ? `Template Name Already exist` : ""}
            </Typography>
          </Grid>
        ) : (
          ""
        )}

        {/* Add New Template Start Here  */}

        {/* <Grid item xs={12} sm={12} md={12} sx={{ mt: 4, display: "none" }}>
          {columnsdynamic
            ?.slice()
            ?.sort((a, b) => a.order_no - b.order_no)
            ?.map((col, i) => {
              const oldHeader = col.oldHeader;
              const editedHeader = col.newHeader;
              const headerBg = col.header_bg ?? "#ffffff";
              const headerText = col.header_text ?? "#ffffff";
              const contentBg = col.content_bg ?? "#ffffff";
              const contentText = col.content_text ?? "#ffffff";
              const orderNo = col?.order_no;
              const isVisible = col?.display === 1;
              const dataType = col?.DATA_TYPE;
              const decimalPoint = col?.decimalpoint ?? 0;

              return (
                <Box
                  key={oldHeader + i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "start",
                    columnGap: "10px",
                    rowGap: "10px",
                    borderBottom: "1px solid rgb(196 196 196 / 35%)",
                    paddingBottom: "17px",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                  className="Seperate-Line"
                  mb={4}
                >
                  <Box sx={{ width: "60px", marginRight: "10px" }}>
                    <TextField
                      type="number"
                      value={orderNo}
                      onChange={(e) => {
                        handleSortOrder(oldHeader, e.target.value);
                      }}
                    />
                  </Box>

                  <Box>
                    <Switch
                      checked={isVisible}
                      onChange={(e) =>
                        handleToggleVisible(oldHeader, e.target.checked)
                      }
                      color="success"
                    />
                  </Box>

                  <Box sx={{ marginRight: "15px" }}>
                    <TextField
                      type="text"
                      value={editedHeader}
                      label={oldHeader}
                      onChange={(e) =>
                        handleHeaderChange(oldHeader, e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: headerBg },
                          "&:hover fieldset": { borderColor: headerBg },
                          "&.Mui-focused fieldset": {
                            borderColor: headerBg,
                          },
                        },
                      }}
                      InputProps={{
                        style: { fontWeight: "bold" },
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Heading Bg</Typography>
                    <input
                      type="color"
                      value={headerBg}
                      onChange={(e) =>
                        handleHeaderBgChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Heading Text</Typography>
                    <input
                      type="color"
                      value={headerText}
                      onChange={(e) =>
                        handleHeaderTextChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Body Bg</Typography>
                    <input
                      type="color"
                      value={contentBg}
                      onChange={(e) =>
                        handleContentBgChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Body Text</Typography>
                    <input
                      type="color"
                      value={contentText}
                      onChange={(e) =>
                        handleBodyTextChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  {dataType === "decimal" ? (
                    <Box sx={{ marginLeft: "10px", width: "100px" }}>
                      <FormControl>
                        <TextField
                          label={dataType}
                          type="number"
                          value={decimalPoint}
                          onChange={(e) => {
                            let value = e.target.value;
                            handleDecimalChange(oldHeader, value);
                          }}
                        />
                      </FormControl>
                    </Box>
                  ) : (
                    ""
                  )}
                </Box>
              );
            })}
        </Grid> */}

        {/* Add New Template End Here  */}

        {/* Edit Template Start Here  */}

        <Grid item xs={12} sm={12} md={12} mt={4}>
          {columnsdynamic
            ?.slice()
            ?.sort((a, b) => a.order_no - b.order_no)
            ?.map((col, i) => {
              const oldHeader = col.oldHeader;
              const editedHeader = col.newHeader;
              const headerBg = col.header_bg ?? "#ffffff";
              const headerText = col.header_text ?? "#ffffff";
              const contentBg = col.content_bg ?? "#ffffff";
              const contentText = col.content_text ?? "#ffffff";
              const orderNo = col?.order_no;
              const isVisible = col?.display === 1;
              const dataType = col?.DATA_TYPE;
              const decimalPoint = col?.decimalpoint ?? 3;

              return (
                <Box
                  key={oldHeader + i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "start",
                    columnGap: "10px",
                    rowGap: "10px",
                    borderBottom: "1px solid rgb(196 196 196 / 35%)",
                    paddingBottom: "17px",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                  className="Seperate-Line"
                  mb={4}
                >
                  <Box sx={{ width: "60px", marginRight: "10px" }}>
                    <TextField
                      type="number"
                      value={orderNo}
                      onChange={(e) => {
                        handleSortOrder(oldHeader, e.target.value);
                      }}
                    />
                  </Box>

                  <Box>
                    <Switch
                      checked={isVisible}
                      onChange={(e) =>
                        handleToggleVisible(oldHeader, e.target.checked)
                      }
                      color="success"
                    />
                  </Box>

                  <Box sx={{ marginRight: "15px" }}>
                    <TextField
                      type="text"
                      value={editedHeader}
                      label={oldHeader}
                      onChange={(e) =>
                        handleHeaderChange(oldHeader, e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: headerBg },
                          "&:hover fieldset": { borderColor: headerBg },
                          "&.Mui-focused fieldset": {
                            borderColor: headerBg,
                          },
                        },
                      }}
                      InputProps={{
                        style: { fontWeight: "bold" },
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Heading Bg</Typography>
                    <input
                      type="color"
                      value={headerBg}
                      onChange={(e) =>
                        handleHeaderBgChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Heading Text</Typography>
                    <input
                      type="color"
                      value={headerText}
                      onChange={(e) =>
                        handleHeaderTextChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Body Bg</Typography>
                    <input
                      type="color"
                      value={contentBg}
                      onChange={(e) =>
                        handleContentBgChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      columnGap: "15px",
                    }}
                  >
                    <Typography>Body Text</Typography>
                    <input
                      type="color"
                      value={contentText}
                      onChange={(e) =>
                        handleBodyTextChange(oldHeader, e.target.value)
                      }
                      style={{
                        width: "45px",
                        height: "40px",
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                  </Box>

                  {dataType === "decimal" || dataType === "float" ? (
                    <Box sx={{ marginLeft: "10px", width: "100px" }}>
                      <FormControl>
                        <TextField
                          label={dataType}
                          type="number"
                          value={decimalPoint}
                          onChange={(e) => {
                            let value = e.target.value;
                            handleDecimalChange(oldHeader, value);
                          }}
                        />
                      </FormControl>
                    </Box>
                  ) : (
                    ""
                  )}

                  {dataType === "decimal" || dataType === "float" ? (
                    <Box sx={{ marginLeft: "10px", width: "100px" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={col.roundof === 1}
                            onChange={(e) =>
                              handleRoundofToggle(oldHeader, e.target.checked)
                            }
                          />
                        }
                        label="Round Off"
                      />
                    </Box>
                  ) : (
                    ""
                  )}
                </Box>
              );
            })}
        </Grid>

        {/* Edit Template End Here  */}

        <Grid item xs={12} sm={12} md={12}>
          <Grid
            item
            xs={12}
            sm={12}
            md={12}
            justifyContent={"end"}
            alignContent={"end"}
          >
            <Button type="submit" variant="contained">
              Save
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Card>
  );
}

export default ExcelTemplate;
