var initialisation = angular.module("initialisation");
initialisation.controller("initialisationCtrl", function ($scope, dataService, $http) {
    $scope.processInfoStatus = "nil";

    initEnviron = function () {
        $scope.data = {
            productionCost: 0,
            disposalCost: 0
        };
        $scope.matrixStatus = "nil"; // to monitor uploading of matrix skeleton
    };

    initEnviron();

    // Function called by browse button in initialisation.html to parse spreadsheet
    // containing matrix skeleton & process info.
    $scope.readMatrix = function (workbook) {
        $scope.matrixStatus = "nil";
        $scope.matrixCellsToAdd = [];
        $scope.processInfoToAdd = [];
        var sheetsValid = addSpreadsheetMatrixAndProcessInfo(workbook);
        if (sheetsValid) {
            $scope.matrixStatus = "uploading";
            addMatrixAndProcessesToDatabase();
        }
    };

    // Function to handle error thrown by file upload
    $scope.error = function (e) {
        console.log(e);
        alert(e);
    };

    /*
        Reads a spreadsheet containing matrix skeleton and process information.
        Places the information in arrays, which will be usedd for uploading to database.

        Current format: Sheet 1 in the spreadsheet contains matrix skeleton.
        Sheet 2 contains process information.
        (Sheet names do not matter, only their positions do).

        In Sheet 1, The first row is for headings & process names.
        First two cells in the first row contains "Type" and "Material" headings. Can be changed if desired.
        
        Subsequent cells in the first row will contain a process name each.
       
        From the second row owards, material information is recorded.
        In each material row, use the first cell to record whether this material is a waste product.
        If it is so, record "Waste" (without quotes) in the cell.
        If it is an input or output, leave the cell BLANK.

        The second cell in the row is for the material name.

        From the third cell onwards in this row, these are for material amounts.
        A number x at column y indicates that x amount of this material is involved in process y.
        However, since this is just a skeleton, leave these numeric cells empty, because they
        will be filled up by the data entries filtered by timeframe chosen by user.

        Only key in numbers for dummy/intermediary processes.
        These processes make use of static numbers regardless of data.
        Use negative numbers if the material is an input item.

        ------------------------------------------------------

        In Sheet 2, each process is stored on each row, starting from the second row. (First row are headings).
        The first cell of a row is for a process name, and each of the materials involved in this process
        are to be recorded in each cell along this row.
        
        The format for recording a material is "Material Name <role>".
        Role must be included after the name for process mapping, and has to be surrounded with <>.
        Example: Uneven Cake (Whole Cake 3) <input>
        
        So, each row will look like: Process Name | Material 1 <role> | Material 2 <role> | ...
    */
    addSpreadsheetMatrixAndProcessInfo = function (workbook) {
        // Read the second sheet first to get all process info.
        var second_sheet_name = workbook.SheetNames[1];
        var worksheet = workbook.Sheets[second_sheet_name]; // get worksheet
        var range = XLSX.utils.decode_range(worksheet['!ref']); // get range object
        var lastRow = range.e.r; // external library syntax: s = start, e = end, r = row, c = column
        var lastColumn = range.e.c;
        var processName,
            IOW,
            materialName,
            processObject,
            componentObject,
            needToPush;

        console.log("Last row: " + lastRow);
        console.log("Last col: " + lastColumn);

        for (var row = 1; row <= lastRow; row++) { // first row is headings, start from 2nd row
            if (typeof worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })] === 'undefined') {
                alert("Missing process name. @ Row: " + row);
                return false;
            }
            needToPush = false;
            processName = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })].w;
            processObject = { process: processName, components: [] };
            for (var col = 1; col <= lastColumn; col++) {
                if (typeof worksheet[XLSX.utils.encode_cell({ r: row, c: col })] === 'undefined') {
                    // if current cell empty
                    if (needToPush) {
                        $scope.processInfoToAdd.push(processObject);
                    }
                    continue; // go to next row, since lastColumn is based on the process with most items.
                    // current row may not be the longest.   
                }
                if (col === lastColumn) {
                    $scope.processInfoToAdd.push(processObject);
                }
                var cellValue = worksheet[XLSX.utils.encode_cell({ r: row, c: col })].w;
                var idx = cellValue.lastIndexOf("<");
                if (idx === -1) {
                    // if the component has no '<' for indicating I/O/W
                    alert("Missing component role. @ Row: " + row + " Col: " + col);
                    return false;
                }
                IOW = cellValue.slice(idx + 1, cellValue.length - 1).toLowerCase();
                if (IOW !== "input" && IOW !== "output" && IOW !== "waste") {
                    alert("Component role not valid. @ Row: " + row + " Col: " + col);
                    return false;
                }
                materialName = cellValue.slice(0, idx);
                if (materialName[materialName.length - 1] === " ") {
                    // remove whitespace if last char is one
                    materialName = materialName.slice(0, materialName.length - 1);
                }
                componentObject = { component: materialName, role: IOW };
                processObject["components"].push(componentObject);
                needToPush = true;
            }
        }

        // Then read the first sheet containing matrix skeleton.
        var first_sheet_name = workbook.SheetNames[0];
        worksheet = workbook.Sheets[first_sheet_name]; // get worksheet
        range = XLSX.utils.decode_range(worksheet['!ref']); // get range object
        lastRow = range.e.r; // external library syntax: s = start, e = end, r = row, c = column
        lastColumn = range.e.c;
        var rowNum,
            colNum,
            cellObject;

        // Go through first row to get headings and process names
        for (col = 0; col <= lastColumn; col++) {
            if (typeof worksheet[XLSX.utils.encode_cell({ r: 0, c: col })] === 'undefined') {
                alert("Missing heading or process name. @ Column: " + col);
                return false;
            }
            // If nothing wrong, prepare cellObject to be added to database
            cellValue = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })].w;
            cellObject = { row: 0, column: col, value: cellValue };
            $scope.matrixCellsToAdd.push(cellObject);
        }

        // Go through first column (second row onwards) to get whether row is waste or not
        for (row = 1; row <= lastRow; row++) {
            if (typeof worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })] === 'undefined') {
                // temp because the row could be input/output/intermediary 
                cellValue = "temp";
            } else if (worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })].w.toLowerCase() === 'waste') {
                cellValue = "waste";
            } else {
                alert("Unrecognised material role @ Row: " + row +
                      ". Please only indicate 'Waste', otherwise leave the cell blank.");
                return false;
            }
            cellObject = { row: row, column: 0, value: cellValue };
            $scope.matrixCellsToAdd.push(cellObject);
        }

        // Go through second column (second row onwards) to get material name
        for (row = 1; row <= lastRow; row++) {
            if (typeof worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })] === 'undefined') {
                alert("Missing material name @ Row: " + row);
                return fasle;
            }
            cellValue = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })].w;
            cellObject = { row: row, column: 1, value: cellValue };
            $scope.matrixCellsToAdd.push(cellObject);
        }

        // Go through remaining cells (second row, third column onwards) and get numeric values
        for (row = 1; row <= lastRow; row++) {
            for (col = 2; col <= lastColumn; col++) {
                if (typeof worksheet[XLSX.utils.encode_cell({ r: row, c: col })] === 'undefined') {
                    cellValue = "0";
                } else {
                    cellValue = worksheet[XLSX.utils.encode_cell({ r: row, c: col })].w;
                }
                cellObject = { row: row, column: col, value: cellValue };
                $scope.matrixCellsToAdd.push(cellObject);
            }
        }

        return true; // when both sheets are valid
    };

    // Function to POST the matrix skeleton & process informaion for insertion into the database.
    addMatrixAndProcessesToDatabase = function () {
        console.log("sending request");
        $http({
            method: "POST",
            url: dataService.getPHPServerName() + "api/addMatrixSkeletonAndProcesses.php",
            data: {
                processInfo: $scope.processInfoToAdd,
                matrixCells: $scope.matrixCellsToAdd
            }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(function successCallbackk(response) {
            console.log("response is: " + response.data);
            $scope.matrixStatus = "nil";
            if (response.data.toLowerCase().indexOf("error") < 0) {
                // success
                alert("All " + $scope.processInfoToAdd.length + " processes added. " +
                      "All " + $scope.matrixCellsToAdd.length + " cells from matrix skeleton added.");
            } else {
                alert(response.data);
            }

        }), function (e) {
            $scope.matrixStatus = "nil";
            console.log("Error: " + e);
            alert("Error: " + e);
        };
    };

    // Function to check if the user entered amounts for saving average costs are positive numbers.
    checkValidInput = function () {
        if (parseFloat($scope.data.productionCost) < 0 || isNaN(parseFloat($scope.data.productionCost))) {
            return false;
        }
        if (parseFloat($scope.data.disposalCost) < 0 || isNaN(parseFloat($scope.data.disposalCost))) {
            return false;
        }
        return true;
    };

    $scope.addAverageCosts = function () {
        if (!checkValidInput()) {
            console.log("Invalid values detected.");
            alert("Invalid values detected. Please only use positive numbers.");
            return false;
        }
        console.log("sending request");
        $http({
            method: "POST",
            url: dataService.getPHPServerName() + "api/addAverageCosts.php",
            data: {
                "productionCost": $scope.data.productionCost,
                "disposalCost": $scope.data.disposalCost
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(function successCallbackk(response) {
            console.log("response is: " + response.data);
            $scope.appEntriesStatus = "nil";
            if (response.data.toLowerCase().indexOf("error") < 0) {
                // success
                console.log("Average costs submitted successfully.");
                alert("Average costs submitted successfully.");
            } else {
                alert(response.data);
            }
        }), function (e) {
            $scope.appEntriesStatus = "nil";
            console.log("Error: " + e);
            alert("Error: " + e);
        };
    };
});