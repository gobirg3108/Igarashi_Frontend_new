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
} from "@mui/material";
import { MaterialReactTable } from "material-react-table";

export default function Home() {
    const [machine, setMachine] = useState("");
    const [shift, setShift] = useState("Shift A");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filePath, setfilePath] = useState({ file: "" })
    const [shift_time, setShift_time] = useState({ "Shift A": { from_time: "", to_time: '' }, "Shift B": { from_time: "", to_time: '' }, 'Shift C': { from_time: "", to_time: '' } });
    useEffect(() => {
        const time = localStorage.getItem('shift_time')
        if (time) {
            setShift_time(JSON.parse(time))
        }

    }, [])
    const [data, setdata] = useState([])
    const columns = useMemo(() => [

        {
            accessorKey: 'Shift',
            header: "Shift",
        }
        , { accessorKey: 'Date', header: "Date", accessorFn: (row) => row.Date_Time?.split(" ")?.[0] }
        , { accessorKey: 'Time', header: "Time", accessorFn: (row) => row.Date_Time?.split(" ")?.[1]?.split('.')?.[0] }
        , { accessorKey: 'Motor_No', header: "Motor_No" }
        , { accessorKey: 'Test_DECE_CW', header: "Test_DECE_CW" }
        , {
            accessorKey: 'Test_DECE_CCW', header: "Test_DECE_CCW"
        }
        , {
            accessorKey: 'Test_DECE_Min_Spc', header: 'Test_DECE_Min_Spc'
        }
        , {
            accessorKey: 'Test_DECE_Max_Spc', header: 'Test_DECE_Max_Spc'
        }
        , {
            accessorKey: 'Terminal_Resistance', header: 'Terminal_Resistance'
        }
        , {
            accessorKey: 'Terminal_Resistance_Min_Spc', header: 'Terminal_Resistance_Min_Spc'
        }
        , {
            accessorKey: 'Terminal_Resistance_Max_Spc', header: 'Terminal_Resistance_Max_Spc'
        }
        , { accessorKey: 'NL_Voltage_CW', header: 'NL_Voltage_CW' }
        , {
            accessorKey: 'NL_Current_CW', header: 'NL_Current_CW'
        }
        , {
            accessorKey: 'NL_Speed_CW', header: 'NL_Speed_CW'
        }
        , {
            accessorKey: 'NL_Voltage_CCW', header: 'NL_Voltage_CCW'
        }
        , {
            accessorKey: 'NL_Current_CCW', header: 'NL_Current_CCW'
        }
        , {
            accessorKey: 'NL_Speed_CCW', header: 'NL_Speed_CCW'
        }
        , {
            accessorKey: 'NL_Voltage_Min_Spc', header: 'NL_Voltage_Min_Spc'
        }
        , {
            accessorKey: 'NL_Voltage_Max_Spc', header: 'NL_Voltage_Max_Spc'
        }
        , {
            accessorKey: 'NL_Current_Min_Spc', header: 'NL_Current_Min_Spc'
        }
        , { accessorKey: 'NL_Current_Max_Spc', header: 'NL_Current_Max_Spc' }
        , {
            accessorKey: 'NL_Speed_Min_Spc', header: 'NL_Speed_Min_Spc'
        }
        , {
            accessorKey: 'NL_Speed_Max_Spc', header: 'NL_Speed_Max_Spc'
        }
        , {
            accessorKey: 'NL_RPM_Variation', header: 'NL_RPM_Variation'
        }
        , {
            accessorKey: 'L_Voltage_CW', header: 'L_Voltage_CW'
        }
        , {
            accessorKey: 'L_Current_CW', header: 'L_Current_CW'
        }
        , {
            accessorKey: 'L_Speed_CW', header: 'L_Speed_CW'
        }
        , {
            accessorKey: 'L_Voltage_CCW', header: 'L_Voltage_CCW'
        }
        , {
            accessorKey: 'L_Current_CCW', header: 'L_Current_CCW'
        }
        , {
            accessorKey: 'L_Speed_CCW', header: 'L_Speed_CCW'
        }
        , {
            accessorKey: 'L_Voltage_Min_Spc', header: 'L_Voltage_Min_Spc'
        }
        , {
            accessorKey: 'L_Voltage_Max_Spc', header: 'L_Voltage_Max_Spc'
        }
        , { accessorKey: 'L_Current_Min_Spc', header: 'L_Current_Min_Spc' }
        , {
            accessorKey: 'L_Current_Max_Spc', header: 'L_Current_Max_Spc'
        }
        , {
            accessorKey: 'L_Speed_Min_Spc', header: 'L_Speed_Min_Spc'
        }
        , {
            accessorKey: 'L_Speed_Max_Spc', header: 'L_Speed_Max_Spc'
        }
        , {
            accessorKey: 'Hall_Sen_s', header: 'Hall_Sen_s'
        }
        , {
            accessorKey: 'DOR_Result', header: 'DOR_Result'
        }
        , { accessorKey: 'TIR_Result', header: 'TIR_Result' }
    ], []);
    const handlesubmit = useCallback(async (e) => {

        e.target.disabled = true
        if (!fromDate) { e.target.disabled = false; return alert('select From-Date') }
        else if (!toDate) { e.target.disabled = false; return alert('select To-Date') }
        else if (!shift_time?.[shift]?.from_time || !shift_time?.[shift]?.to_time) { e.target.disabled = false; return alert('select Shift Time'); }
        else if (!machine) { e.target.disabled = false; return alert('select Machine'); }
        try {
            const result = await window.versions.getdata({ fromDate, toDate, ...shift_time[shift], machine })
            setdata(result)
            e.target.disabled = false
        } catch (error) {
            console.log(error);

            e.target.disabled = false
        }



    }, [fromDate, toDate, shift, machine])
    // const data = [
    //     { id: 1, name: "Machine A", status: "Running" },
    //     { id: 2, name: "Machine B", status: "Stopped" },
    // ];
    const handleopenfile = useCallback(() => {

        if (filePath) window?.versions?.openfolder(filePath?.file);

    }, [filePath])
    const exportexcel = useCallback(async (e) => {
        e.target.disabled = true
        setfilePath(() => ({}))
        if (!fromDate) { e.target.disabled = false; return alert('select From-Date') }
        else if (!toDate) { e.target.disabled = false; return alert('select To-Date') }
        else if (!shift_time?.[shift]?.from_time || !shift_time?.[shift]?.to_time) { e.target.disabled = false; return alert('select Shift Time'); }
        else if (!machine) { e.target.disabled = false; return alert('select Machine'); }
        new Promise((resolve, reject) => {
            async function wait() {
                const result = await window.versions.ping({ fromDate, toDate, ...shift_time[shift], machine })
                // if(result)

                if (result && typeof result === 'string' && result.includes("DOWNLOAD")) {
                    resolve(result)
                }
                else {
                    reject("Download failed")
                }
            }
            wait()
        }).then((res) => {
            console.log(res); e.target.disabled = false
            setfilePath((p) => ({ ...p, file: res }))
        }).catch((err) => {
            e.target.disabled = false
            console.log(err);
            setfilePath((p) => ({ ...p, file: undefined, error: err }))
        })
    }, [fromDate, toDate, shift, machine])
    return (
        <Card sx={{ p: 3, mx: "auto" }}>
            {/* Title */}
            <Typography
                variant="h4"
                textAlign="center"
                sx={{ pb: 2, fontWeight: "bold" }}
            >
                Machine 1
            </Typography>

            {/* Date & Machine Selection */}
            <Grid container spacing={2} columnSpacing={8} alignItems="center">
                {/* From Date */}
                <Grid item xs={12} sm={6} md={4}>
                    <Typography>From Date</Typography>
                    <TextField
                        fullWidth
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </Grid>

                {/* To Date */}
                <Grid item xs={12} sm={6} md={4}>
                    <Typography>To Date</Typography>
                    <TextField
                        fullWidth
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </Grid>

                {/* Machine Selection */}
                <Grid item xs={12} sm={6} md={4}>
                    <Typography>Machine</Typography>
                    <FormControl fullWidth>
                        <Select value={machine} onChange={(e) => setMachine(e.target.value)}>
                            <MenuItem value="MD_Motor_EP_DMC">Machine 1</MenuItem>
                            <MenuItem value="Machine 2">Machine 2</MenuItem>
                            <MenuItem value="Machine 3">Machine 3</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Shift Selection */}
                <Grid item xs={12} sm={6} md={4}>
                    <Typography>Shift</Typography>
                    <FormControl fullWidth>
                        <Select value={shift} onChange={(e) => setShift(e.target.value)}>
                            {Object.keys(shift_time).map((item) => <MenuItem value={item}>{item}</MenuItem>)}

                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>

                    <TextField
                        fullWidth
                        type="time"
                        // name='from_time'
                        aria-readonly={true}
                        value={shift_time?.[shift]?.from_time || ""}
                    //    onChange={handletimechange}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }} // 5 min interval
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>

                    <TextField
                        fullWidth
                        type="time"
                        // name='from_time'
                        aria-readonly={true}
                        value={shift_time?.[shift]?.to_time || ""}
                        //    onChange={handletimechange}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }} // 5 min interval
                    />
                </Grid>
                {/* Buttons */}
                <Grid item xs={12} sm={12} md={12} display="flex" gap={2} justifyContent="flex-end">
                    {filePath?.file && <Button variant="contained" onClick={handleopenfile}>Show File</Button>}
                    {filePath?.error && filePath?.error}
                    <Button variant="contained" onClick={handlesubmit}>Submit</Button>
                    <Button variant="contained" color="success" onClick={exportexcel}>
                        Export to Excel
                    </Button>
                </Grid>
            </Grid>

            {/* Data Table */}
            <Box mt={3}>
                <MaterialReactTable
                    columns={[...columns]}
                    data={data}
                    enableTopToolbar
                    positionActionsColumn="last"
                />
            </Box>
        </Card>
    );
}
