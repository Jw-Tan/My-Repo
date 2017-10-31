var datainput = angular.module("datainput");
datainput.controller("datainputCtrl", function ($scope, dataService, $http) {
    $scope.processInfoStatus = "nil";

    initEnviron = function () {
        $scope.data = {
            replaceLastUploaded: false,
            selectedProcess: "",
            date: ""
        };
        $scope.entriesStatus = "nil"; // to monitor uploading via spreadsheet
        $scope.appEntriesStatus = "nil"; // to  monitor uploading via app
        $scope.inputsToUpload = [];
        $scope.outputsToUpload = [];
        $scope.wastesToUpload = [];
    };

    /*
        Watches $scope.data.selectedProcess for changes.
        This occurs when the user selects a process from the dropdown list.
        Based on what process is selected, fill the inputs/outputs/wastesToUpload
        arrays with zeroes, according to how many inputs/outputs/wastes the
        process has.

        These arrays will store the user input weight values, and their index
        within these 3 arrays corresponds to the respective material in the
        process object's inputs/outputs/wastes arrays.
    */
    $scope.$watch("data.selectedProcess", function (newVal, oldVal) {
        if (newVal) {
            $scope.inputsToUpload = [];
            $scope.outputsToUpload = [];
            $scope.wastesToUpload = [];
            var idx = $scope.addedProcessNames.indexOf($scope.data.selectedProcess.name);
            var process = $scope.processesList[idx];
            for (var i = 0; i < process.inputs.length; i++) {
                $scope.inputsToUpload.push(0);
            }
            for (i = 0; i < process.outputs.length; i++) {
                $scope.outputsToUpload.push(0);
            }
            for (i = 0; i < process.wastes.length; i++) {
                $scope.wastesToUpload.push(0);
            }
        }
    }, true);

    // Function to fetch process information from database, as choices for user to input data.
    getProcesses = function () {
        $scope.processInfoStatus = "fetching";
        $http({
            method: "GET",
            url: dataService.getPHPServerName() + "api/getProcesses.php"
        }).then(function successCallback(response) {
            populateProcessesList(response.data);
            initEnviron();
            $scope.processInfoStatus = "has data"; // use this to show the process selection list
            console.log("processes information fetched");
        }).catch(function (e) {
            $scope.processInfoStatus = "no data";
            console.log("error!");
            console.log(e);
        });
    };

    // Function to prepare the available processes and their associated materials for user choice.
    populateProcessesList = function (processes) {
        $scope.processesList = [];
        $scope.addedProcessNames = [];
        var processObject;
        var role;
        var idx;
        for (var i = 0; i < processes.length; i++) {
            idx = $scope.addedProcessNames.indexOf(processes[i]["Process"]);
            if (idx < 0) {
                // process not added yet
                processObject = {
                    name: processes[i]["Process"],
                    inputs: [],
                    outputs: [],
                    wastes: []
                };
                $scope.processesList.push(processObject);
                $scope.addedProcessNames.push(processes[i]["Process"]);
                idx = $scope.addedProcessNames.length - 1; // update the idx value
            }
            role = processes[i]["Role"].toLowerCase();
            if (role === "input") {
                $scope.processesList[idx].inputs.push(processes[i]["Component"]);
            } else if (role === "output") {
                $scope.processesList[idx].outputs.push(processes[i]["Component"]);
            } else if (role === "waste") {
                $scope.processesList[idx].wastes.push(processes[i]["Component"]);
            } else {
                alert("Invalid role of material was retrieved. Please check your uploaded process infomation.");
                return false;
            }
        }

        // sort the processes by name alphabetically
        $scope.processesList.sort(compareProcessesByName);
        for (i = 0; i < $scope.processesList.length; i++) {
            // within each process, sort their component arrays alphebetically as well
            $scope.processesList[i].inputs.sort(compareArrayEntriesByName);
            $scope.processesList[i].outputs.sort(compareArrayEntriesByName);
            $scope.processesList[i].wastes.sort(compareArrayEntriesByName);
        }
        console.log("processesList populated & sorted");
    };

    compareProcessesByName = function (a, b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    };

    compareArrayEntriesByName = function (a, b) {
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    };

    getProcesses();

    // Function called by "Submit Entry" button in entry.html for uploading a single data entry.
    $scope.submitData = function () {
        $scope.entriesToAdd = [];
        var date = parseDate();
        if (date === false) {
            alert("Invalid date. Please use the format DD/MM/YYYY.");
            return false;
        }

        // populate $scope.entriesToAdd
        var inputEntriesValid = prepareEntriesFromInput(date, $scope.inputsToUpload, "Input");
        var outputEntriesValid = prepareEntriesFromInput(date, $scope.outputsToUpload, "Output");
        var wasteEntriesValid = prepareEntriesFromInput(date, $scope.wastesToUpload, "Waste");
        if (!inputEntriesValid || !outputEntriesValid || !wasteEntriesValid) {
            alert("Invalid weight value. Please only use positive numbers.");
            return false;
        }

        $scope.appEntriesStatus = "uploading";
        $http({
            method: "POST",
            url: dataService.getPHPServerName() + "api/addEntriesFromApp.php",
            data: JSON.stringify($scope.entriesToAdd),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(function successCallbackk(response) {
            console.log("response is: " + response.data);
            $scope.appEntriesStatus = "nil";
            if (response.data.toLowerCase().indexOf("error") < 0) {
                // success
                console.log("All " + $scope.entriesToAdd.length + " entries inserted into database.");
                alert("All " + $scope.entriesToAdd.length + " entries inserted into database.");
            } else {
                alert(response.data);
            }
        }), function (e) {
            $scope.appEntriesStatus = "nil";
            console.log("Error: " + e);
            alert("Error: " + e);
        };
    };

    // Function to check the user input date and convert the string to int
    parseDate = function () {
        var split = $scope.data.date.split("/"); // original string is DD/MM/YYYY
        if (split.length !== 3) {
            return false;
        }
        if (split[0].length === 0 || split[1].length === 0 || split[2].length === 0) {
            return false;
        }
        if (isNaN(split[0]) || isNaN(split[1]) || isNaN(split[2])) {
            return false;
        }

        split[0] = parseInt(split[0]); // day
        split[1] = parseInt(split[1]) - 1; // javascript months start from 0
        split[2] = parseInt(split[2]); // year

        if (split[1] < 0 || split[1] > 11) { // user input month is not valid
            return false;
        }

        return split;
    };

    // Function to prepare the dataEntryObjects for uploading to database.
    // Used when submitting entry directly through app.
    prepareEntriesFromInput = function (date, amountArray, IOW) {
        var materialName;
        var dataEntryObject;
        for (var i = 0; i < amountArray.length; i++) {
            // the input field in the html file will record either null or undefined
            // if an invalid number was detected
            if (amountArray[i] === null || typeof amountArray[i] === 'undefined') {
                return false;
            }

            if (IOW === "Input") {
                materialName = $scope.data.selectedProcess.inputs[i];
            } else if (IOW === "Output") {
                materialName = $scope.data.selectedProcess.outputs[i];
            } else if (IOW === "Waste") {
                materialName = $scope.data.selectedProcess.wastes[i];
            }

            dataEntryObject = {
                year: date[2],
                month: date[1],
                day: date[0],
                iow: IOW,
                process: $scope.data.selectedProcess.name,
                material: materialName,
                amount: amountArray[i],
                remarks: "app" // to denote that this entry was submitted through the app
            };
            $scope.entriesToAdd.push(dataEntryObject); // add to array for SQL INSERT construction later
        }
        return true;
    };

    // Function called by browse button in entry.html to parse spreadsheet containing data entries.
    $scope.readEntries = function (workbook) {
        $scope.entriesStatus = "nil";
        $scope.entriesToAdd = [];
        var entriesValid = addSpreadsheetEntries(workbook);
        if (entriesValid) {
            // only allow addition if the spreadsheet has complete data (no missing fields)
            $scope.entriesStatus = "uploading";
            addEntriesToDatabase();
        }
    };

    // Function to handle error thrown by file upload
    $scope.error = function (e) {
        console.log(e);
        alert(e);
    };

    // Function to add entries from the uploaded spreadsheet into an array for adding into database.
    addSpreadsheetEntries = function (workbook) {

        // Note: Sometimes the last row detected by the spreadsheet library includes false positives.
        // This seems to occur when last rows are deleted.
        // The spreadsheet seems to perceive the row as still present, but empty.
        // If this happens, highlight the "residue" rows and right click delete rows.

        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name]; // get worksheet
        var range = XLSX.utils.decode_range(worksheet['!ref']); // get range object
        var lastRow = range.e.r; // external library syntax: s = start, e = end, r = row, c = column
        var lastColumn = range.e.c;
        var dateObject,
            IOW,
            processName,
            materialName,
            amount,
            remarks,
            dataEntryObject;

        if (lastRow < 1 || lastColumn < 5) {
            alert("Insufficient columns in your spreadsheet!");
            return false;
        }

        for (var row = 1; row <= lastRow; row++) { // first row is headings, start from 2nd row
            for (var col = 0; col < lastColumn; col++) {
                if (typeof worksheet[XLSX.utils.encode_cell({ r: row, c: col })] === 'undefined') {
                    // first check each cell in this row for empty ones
                    alert("Error: All data must be present in your spreadsheet. @ Row: " + row + ", Col: " + col);
                    return false;
                }
            }

            dateObject = parseDateString(worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })].w);
            IOW = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })].w;
            processName = worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })].w;
            materialName = worksheet[XLSX.utils.encode_cell({ r: row, c: 3 })].w;
            amount = parseFloat(worksheet[XLSX.utils.encode_cell({ r: row, c: 4 })].w);
            remarks = worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })].w;

            dataEntryObject = {
                year: dateObject.getFullYear(), month: dateObject.getMonth(), day: dateObject.getDate(),
                iow: IOW, process: processName, material: materialName,
                amount: amount, remarks: remarks
            };
            $scope.entriesToAdd.push(dataEntryObject); // add to array for SQL INSERT construction later
        }
        console.log("All " + $scope.entriesToAdd.length + " entries from spreadsheet added to array.");
        return true;
    };

    // Function to return a Date object from a string of format "dd/mm/yyyy"
    parseDateString = function (string) {
        var splitString = string.split("/"); // array where dd/mm/yyyy stored as [dd, mm, yyyy]
        var month = parseInt(splitString[1]) - 1; // javascript months start from 0
        var date = new Date(splitString[2], month, splitString[0]);
        return date;
    };

    // Function to POST the entries for insertion into the database.
    addEntriesToDatabase = function () {
        console.log("sending request");
        var phpURL;
        if ($scope.data.replaceLastUploaded) {
            phpURL = dataService.getPHPServerName() + "api/addEntriesAfterDeleting.php";
        } else {
            phpURL = dataService.getPHPServerName() + "api/addEntries.php";
        }
        $http({
            method: "POST",
            url: phpURL,
            data: JSON.stringify($scope.entriesToAdd),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(function successCallbackk(response) {
            console.log("response is: " + response.data);
            $scope.entriesStatus = "nil";
            if (response.data.toLowerCase().indexOf("error") < 0) {
                // success
                console.log("All " + $scope.entriesToAdd.length + " entries inserted into database.");
                alert("All " + $scope.entriesToAdd.length + " entries inserted into database.");
            } else {
                alert(response.data);
            }
        }), function (e) {
            $scope.entriesStatus = "nil";
            console.log("Error: " + e);
            alert("Error: " + e);
        };
    };
});