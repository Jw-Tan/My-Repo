var normalisation = angular.module("normalisation");
normalisation.controller("normalisationCtrl", function ($scope, dataService, $http) {

    var nameOfMonths = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];

    // Function to retrieve the timeframe choices from the database.
    getTimeframe = function () {
        $scope.status = "fetching";
        $http({
            method: "GET",
            url: dataService.getPHPServerName() + "api/getTimeframe.php"
        }).then(function successCallback(response) {
            var monthResults = response.data["months"];
            if (monthResults.length === 0) {
                console.log("no data exists in database");
                $scope.status = "no data";
                return;
            }
            $scope.monthsData = [];
            $scope.monthsNamedData = [];
            $scope.yearsData = [];
            for (var i = 0; i < monthResults.length; i++) {
                var month = monthResults[i]["Month"];
                var year = monthResults[i]["Year"];

                if ($scope.monthsData.indexOf(month.toString() + " " + year.toString()) < 0) {
                    $scope.monthsData.push(month.toString() + " " + year.toString());
                    $scope.monthsNamedData.push(nameOfMonths[month] + " " + year.toString());
                    console.log("Added: " + month.toString() + " " + year.toString());
                }
                if ($scope.yearsData.indexOf(year) < 0) {
                    $scope.yearsData.push(year);
                    console.log("Added: " + year);
                }
            }
            initEnviron();
            $scope.status = "has data";
            console.log("has data");
        }).catch(function (e) {
            $scope.status = "no data";
            console.log("error!");
            console.log(e);
        });
    };

    initEnviron = function () {
        $scope.data = {
            timeFrames: ["Everything", "By Year", "By Month"],
            selectedTimeFrame: "Everything",
            selectedYear: $scope.yearsData[$scope.yearsData.length - 1],
            selectedMonthNamed: $scope.monthsNamedData[$scope.monthsNamedData.length - 1],
            showTrimmedMatrix: false,
            resultsHeading: "",
            resultsInputHeading: "Inputs consumed:",
            resultsWasteHeading: "Waste produced:",
            resultsInput: [],
            resultsWaste: []
        };
        console.log("Environment initialised.");
    };

    // Get timeframe data pulled from database entries
    $scope.status = "fetching";
    $scope.skeletonStatus = "fetching";
    getTimeframe();

    // This fuction is called when the "Confirm Timeframe" button in wasteIntensity.html is clicked.
    // It fetches the matrix skeleton information from the database and builds the necessary arrays.
    $scope.buildMatrixSkeleton = function () {
        $scope.skeletonStatus = "fetching";
        $http({
            method: "GET",
            url: dataService.getPHPServerName() + "api/getSkeleton.php"
        }).then(function successCallback(response) {
            var result = response.data;
            var lastRowIdx = parseInt(result["rowCount"]);
            var skeletonResults = JSON.parse(result["skeleton"]);

            if (skeletonResults.length === 0) {
                console.log("no skeleton exists in database");
                $scope.skeletonStatus = "no data";
                return;
            }

            $scope.matrixSkeleton = [];
            $scope.balancedSkeleton = [];
            $scope.processesInSkeleton = []; // array containing all processes names, for indexing
            $scope.materialsInSkeleton = []; // array containing all material names, for indexing
            console.log("has skeleton");

            // start building the matrix skeleton
            for (var i = 0; i <= lastRowIdx; i++) {
                // prepare a row for each row in the database result
                $scope.matrixSkeleton[i] = [];
            }

            var cellValue;
            var cellType;
            var entry;
            var entryRow;
            var entryCol;
            // pre-fill up the matrix skeleton with headings and initial numbers
            for (i = 0; i < skeletonResults.length; i++) {
                entryRow = parseInt(skeletonResults[i]["Row"]);
                entryCol = parseInt(skeletonResults[i]["Col"]);
                if (entryRow > 0 && entryCol > 1) {
                    // these cells are the numeric cells, need to parse the string value
                    cellValue = parseFloat(skeletonResults[i]["Value"]);
                    cellType = $scope.matrixSkeleton[entryRow][0];
                    entry = createEntry(cellValue, cellType);
                    $scope.matrixSkeleton[entryRow][entryCol] = entry;
                } else {
                    // these are the remainder cells, containing text
                    if (entryRow === 0 && entryCol > 1) {
                        // these are the process name cells
                        var processName = skeletonResults[i]["Value"];
                        if ($scope.processesInSkeleton.indexOf(processName) < 0) {
                            $scope.processesInSkeleton[entryCol] = processName;
                        }
                    }
                    if (entryRow > 0 && entryCol === 1) {
                        // these are the material name cells
                        var materialName = skeletonResults[i]["Value"];
                        if ($scope.materialsInSkeleton.indexOf(materialName) < 0) {
                            $scope.materialsInSkeleton[entryRow] = materialName;
                        }
                    }
                    cellValue = skeletonResults[i]["Value"];
                    if (cellValue === "temp") {
                        cellValue = "";
                    } else if (cellValue.toLowerCase() === "waste") {
                        cellValue = "Waste"; // for consistency
                    }
                    cellType = "text";
                    $scope.matrixSkeleton[entryRow][entryCol] = new entryObject(cellValue, cellType);
                }
            }
            console.log("pre-fill of skeleton done (unbalanced).");
            var selectedMonth = $scope.monthsData[$scope.monthsNamedData.indexOf($scope.data.selectedMonthNamed)];
            getEntries($scope.data.selectedTimeFrame, $scope.data.selectedYear, selectedMonth);
        }).catch(function (e) {
            $scope.skeletonStatus = "no data";
            console.log("error!");
            console.log(e);
        });
    };

    // Function to create & return a numeric entryObject, based on the value or type of material.
    createEntry = function (cellValue, materialType) {
        var entry;
        if (cellValue < 0) { // this cell is an input
            entry = new entryObject(cellValue, "i"); // i for input
        } else if (cellValue === 0) {
            entry = new entryObject(cellValue, "e"); // e for empty
        } else {
            // positive values, need to check whether this cell is waste or valuable output
            if (materialType === "Waste") {
                entry = new entryObject(cellValue, "w"); // w for waste
            } else {
                // this is not waste, o for output
                entry = new entryObject(cellValue, "o");
            }
        }
        return entry;
    };

    // Constructor function for object representing each matrix entry
    entryObject = function (value, type) {
        this.value = value;
        this.type = type; // to represent input, output, waste, text
    };

    // This function fetches the relevant data entries from the database
    // and continues with the normalisation process.
    getEntries = function (selectedTimeFrame, selectedYear, selectedMonth) {
        $http({
            method: "GET",
            url: dataService.getPHPServerName() + "api/getEntries.php",
            params: {
                timeFrame: selectedTimeFrame,
                year: selectedYear,
                month: selectedMonth
            }
        }).then(function successCallback(response) {
            console.log("entries retrieved");
            var entries = response.data;
            console.log(entries.length);
            if (addEntriesToMatrix(entries) === true) {
                createBalancedMatrixAndAllocate();
                finishBalancing();
                customSortUnitOptions();
                $scope.skeletonStatus = "balancing complete";
            }
        }).catch(function (e) {
            $scope.skeletonStatus = "nil";
            console.log("error!");
            console.log(e);
            alert(e);
        });
    };


    // Function to add the entries fetched from database to the correct cell in the matrix.
    // Rejects if the entry's process name or material name do not have a match in the matrix.
    // Before returning, empty rows & columns of resultant matrix are removed, to get inverse.
    addEntriesToMatrix = function (entries) {
        for (var i = 0; i < entries.length; i++) {
            // get the target row & cell where this entry should be added to
            var targetRow = $scope.materialsInSkeleton.indexOf(entries[i]["Material"]);
            var targetCol = $scope.processesInSkeleton.indexOf(entries[i]["Process"]);

            // check that we are trying to add an entry whose process & material name
            // are present in the matrix skeleton
            if (targetRow < 0) {
                console.log("Entry in database has material name not found in matrix skeleton");
                alert("Entry in database has material name not found in matrix skeleton. (" +
                      entries[i]["Material"] + ")");
                return false;
            }
            if (targetCol < 0) {
                console.log("Entry in database has process name not found in matrix skeleton");
                alert("Entry in database has process name not found in matrix skeleton. (" +
                      entries[i]["Process"] + ")");
                return false;
            }

            var amount = parseFloat(entries[i]["Amount"]);
            if (entries[i]["InOutWaste"].toLowerCase() === "input") {
                amount = -amount; // input values are negative in matrix
            }
            $scope.matrixSkeleton[targetRow][targetCol]["value"] += amount;
            // change the type property of the cell if it was originally empty
            if ($scope.matrixSkeleton[targetRow][targetCol]["type"] === "e") {
                if (entries[i]["InOutWaste"].toLowerCase() === "input") {
                    $scope.matrixSkeleton[targetRow][targetCol]["type"] = "i";
                } else if (entries[i]["InOutWaste"].toLowerCase() === "waste") {
                    $scope.matrixSkeleton[targetRow][targetCol]["type"] = "w";
                } else if (entries[i]["InOutWaste"].toLowerCase() === "output") {
                    $scope.matrixSkeleton[targetRow][targetCol]["type"] = "o";
                }
            }
        }
        console.log("All entries have a match in skeleton, and have been added.");
        $scope.inputMatrix = trimMatrix($scope.matrixSkeleton);
        return true;
    };

    // Function to clone a matrix, excluding all empty rows and columns 
    trimMatrix = function (matrix) {
        var newMatrix = [];
        newMatrix.push(matrix[0]); // copy first row (headings & process names)

        // trim empty rows
        for (var row = 1; row < matrix.length; row++) {
            for (var col = 2; col < matrix[0].length; col++) {
                if (matrix[row][col]["value"] !== 0) {
                    // if a column in this row is non-zero, add this row
                    newMatrix.push(matrix[row]);
                    break; // move onto next row
                }
            }
        }

        // find out which columns are empty
        var columnsToDrop = [];
        for (col = 2; col < newMatrix[0].length; col++) {
            var columnIsEmpty = true;
            for (row = 1; row < newMatrix.length; row++) {
                if (newMatrix[row][col]["value"] !== 0) {
                    // if this column has a non-zero cell
                    columnIsEmpty = false;
                    break;
                }
            }
            if (columnIsEmpty) {
                // take note of this column number
                columnsToDrop.push(col);
            }
        }

        // trim empty columns
        var trimmedMatrix = [];
        for (row = 0; row < newMatrix.length; row++) {
            trimmedMatrix[row] = [];
            for (col = 0; col < matrix[0].length; col++) {
                if (columnsToDrop.indexOf(col) < 0) {
                    // if current cell's column value was not noted for removal, add it
                    trimmedMatrix[row].push(newMatrix[row][col]);
                }
            }
        }
        console.log("Matrix trimmed");
        return trimmedMatrix;
    };

    // Function to balance/square the input matrix so that an inverse can be calculated.
    createBalancedMatrixAndAllocate = function () {
        $scope.balancedMatrix = [];
        $scope.unitOptions = [];
        // create the same number of rows in balancedMatrix
        for (var row = 0; row < $scope.inputMatrix.length; row++) {
            $scope.balancedMatrix[row] = [];
        }

        for (var col = 0; col < $scope.inputMatrix[0].length; col++) {
            // go through each column in inputMatrix and copy over to balancedMatrix
            var numOfOutputs = 0; // to track how many output(s) this process has
            var totalOutputAmount = 0; // to track sum of outputs of a process for ratio calculation
            var outputIndexes = []; // to track the position of each output entry within a column
            var tempColumn = []; // to hold a column before copying, and check for allocation
            for (row = 0; row < $scope.inputMatrix.length; row++) {
                // go through each row of this column
                if (col < 2) {
                    // copy first two columns unchanged
                    $scope.balancedMatrix[row][col] = $scope.inputMatrix[row][col];
                    continue;
                }
                // third column onwards, these are process columns
                tempColumn.push($scope.inputMatrix[row][col]);
                if ($scope.inputMatrix[row][col]["type"] === "o") {
                    numOfOutputs++;
                    totalOutputAmount += $scope.inputMatrix[row][col]["value"];
                    outputIndexes.push(row);
                }
            }

            // at this point, all materials of current process have been added, allocate if needed
            if (numOfOutputs > 1) {
                console.log("allocating process: " + tempColumn[0].value + ", numOfOutputs: " + numOfOutputs);
                allocateProcess(tempColumn, numOfOutputs, totalOutputAmount, outputIndexes);
            } else {
                // no allocation needed, just copy the column into balancedMatrix
                for (row = 0; row < tempColumn.length; row++) {
                    $scope.balancedMatrix[row].push(tempColumn[row]);
                }
            }
        }
        console.log("First part of balancedMatrix creation completed (allocation).");
    };

    /*
        Function to perform allocation on the column passed in (allocationSource).
        Splits the column into n columns, where n = the amount of outputs in this process.
        Empty values are copied across the columns.
        Input & waste values are split across the columns according to the output's mass ratio.
        Output values are spread across the columns in a staggered manner.
    */
    allocateProcess = function (allocationSource, numOfOutputs, totalOutputAmount, outputIndexes) {
        var outputStaggerCount = 0; // used to arrange the output values

        // add the process name back in, each appended with an ascending number
        allocateProcessName(allocationSource[0].value, numOfOutputs);

        // second row onwards, numeric entries, allocate according to type
        for (var row = 1; row < allocationSource.length; row++) {
            var entrySource = allocationSource[row];
            if (entrySource.type === "i") {
                // this is an input entry
                allocateInputEntry(numOfOutputs, totalOutputAmount, outputIndexes, allocationSource, row);
            } else if (entrySource.type === "o") {
                // this is an output entry
                allocateOutputEntry(numOfOutputs, outputStaggerCount, row, entrySource);
                outputStaggerCount++;
            } else if (entrySource.type === "w") {
                // this is a waste entry
                allocateWasteEntry(numOfOutputs, totalOutputAmount, outputIndexes, allocationSource, row);
            } else if (entrySource.type === "e") {
                allocateEmptyEntry(numOfOutputs, row, entrySource);
            }
        }
    };

    // Function to add allocated columns with the given process name.
    allocateProcessName = function (processName, numOfOutputs) {
        for (var addedCol = 1; addedCol <= numOfOutputs; addedCol++) {
            // start from 1 so that <process name> becomes <process name (1)>, and so on.
            var entry = new entryObject(processName + " (" + addedCol + ")", "text");
            $scope.balancedMatrix[0].push(entry);
        }
    };

    // Function to allocate input amount according to mass ratio across the allocated columns.
    allocateInputEntry = function (numOfOutputs, totalOutputAmount, outputIndexes, allocationSource, row) {
        for (var addedCol = 0; addedCol < numOfOutputs; addedCol++) {
            /*
                addedCol refers to the n-th newly added column for allocation (first column @ index 0)
                It also refers to the n-th output for this process, and thus is used to get the index
                of the respective outputs from outputIndexes in the pre-allocation process column.
                This is then used to retrieve the output amount for ratio calculation (based on mass).
                The allocated input amount is computed using this ratio, and is added into
                the balanced matrix.
            */
            var ratio = allocationSource[outputIndexes[addedCol]].value / totalOutputAmount;
            var entrySource = allocationSource[row];
            var allocatedEntry = createEntry(entrySource.value * ratio, "i");
            $scope.balancedMatrix[row].push(allocatedEntry);
        }
    };

    // Function to allocate output amounts across the allocated columns.
    allocateOutputEntry = function (numOfOutputs, outputStaggerCount, row, entrySource) {
        for (var addedCol = 0; addedCol < numOfOutputs; addedCol++) {
            /*
                Allocate the multiple outputs from one column into a staggered manner, example:
                2   ->  2 0
                2       0 2
            */
            if (addedCol === outputStaggerCount) {
                $scope.balancedMatrix[row].push(entrySource);
            } else {
                $scope.balancedMatrix[row].push(createEntry(0, "e"));
            }
        }
    };

    // Function to allocate waste amount according to mass ratio across the allocated columns.
    allocateWasteEntry = function (numOfOutputs, totalOutputAmount, outputIndexes, allocationSource, row) {
        for (var addedCol = 0; addedCol < numOfOutputs; addedCol++) {
            var ratio = allocationSource[outputIndexes[addedCol]].value / totalOutputAmount;
            var entrySource = allocationSource[row];
            var allocatedWasteEntry = createEntry(entrySource.value * ratio, "Waste");
            $scope.balancedMatrix[row].push(allocatedWasteEntry);
        }
    };

    // Function to allocate empty cells according to how many allocated columns.
    allocateEmptyEntry = function (numOfOutputs, row, entrySource) {
        for (var addedCol = 0; addedCol < numOfOutputs; addedCol++) {
            $scope.balancedMatrix[row].push(entrySource);
        }
    };

    /*
        Function to scan each material and classify its type within the scope of all processes.
        Depending on the type, the rows are accounted for if necessary to form a square matrix.
        Also populates unitOptions array with candidates for normalisation unit if material
        is an output or intermediary.
    */
    finishBalancing = function () {
        var totalRows = $scope.balancedMatrix.length;
        var totalCols = $scope.balancedMatrix[0].length;
        for (var row = 1; row < totalRows; row++) { // start from second row since first row is heading
            if ($scope.balancedMatrix[row][0].value.toLowerCase() === "waste") {
                // if a material (row) was indicated as waste, no need to relabel, just account for it
                addAccountingColumn(row, -1);
                continue; // proceed to next material (row)    
            }

            var hasInput = false;
            var hasOutput = false;
            for (var col = 2; col < totalCols; col++) { // start from third column for numeric entries
                var entryType = $scope.balancedMatrix[row][col].type;
                if (entryType === "i") {
                    hasInput = true;
                } else if (entryType === "o") {
                    hasOutput = true;
                }
                if (hasInput && hasOutput) {
                    // if there are negative & positive values, this is an intermediary
                    break; // no need to continue down this row
                }
            }

            // at this point, the row has been traversed. Check if is input, output, or intermediary
            if (hasInput && !hasOutput) {
                // change its type column entry to Input and account for it
                $scope.balancedMatrix[row][0] = new entryObject("Input", "text");
                addAccountingColumn(row, 1);
            } else if (!hasInput && hasOutput) {
                // change its type column entry to Output and add as normalisation candidate
                $scope.balancedMatrix[row][0] = new entryObject("Output", "text");
                addNormalisationCandidate(row);
            } else if (hasInput && hasOutput) {
                // change its type column entry to Intermediary and add as normalisation candidate
                $scope.balancedMatrix[row][0] = new entryObject("Intermediary", "text");
                addNormalisationCandidate(row);
            }
        }
        console.log("Balancing completed.");
        console.log("Rows: " + ($scope.balancedMatrix.length - 1) +
                    ", Cols: " + ($scope.balancedMatrix[0].length - 2));
    };

    // Function to add an accounting column to the end of balancedMatrix.
    addAccountingColumn = function (materialIndex, amount) {
        var materialName = $scope.balancedMatrix[materialIndex][1].value;
        var entry = new entryObject(materialName + " <acc>", "text");
        $scope.balancedMatrix[0].push(entry); // add the material name column heading

        for (var row = 1; row < $scope.balancedMatrix.length; row++) {
            var newEntry;
            if (row === materialIndex) {
                // when the row matches the material's position, use the passed amount
                newEntry = new entryObject(amount, "acc");
            } else {
                // otherwise, use 0
                newEntry = new entryObject(0, "acc");
            }
            $scope.balancedMatrix[row].push(newEntry);
        }
    };

    // Constructor function for object representing normalisation unit option.
    optionObject = function (type, name, index) {
        this.type = type;
        this.name = name;
        this.index = index;
    };

    // Creates an optionObject (for normalisation unit choice) and adds to unitOptions.
    addNormalisationCandidate = function (row) {
        var matType = $scope.balancedMatrix[row][0].value;
        var matName = $scope.balancedMatrix[row][1].value;
        var option = new optionObject(matType, matName, row);
        $scope.unitOptions.push(option);
    };

    /*
        This sets custom ordering between Output, Intermediary & Waste.
        This affects the ordering of normalisation candidates displayed to user.
        Currently, Outputs are arranged at the top of the list, followed by
        Intermediary and then by Waste (but Waste is not needed currently).
        Within each group, the materials will be sorted alphabetically.
    */
    customSortUnitOptions = function () {
        var ordering = [];
        var sortOrder = ["Output", "Intermediary", "Waste"];
        for (var i = 0; i < sortOrder.length; i++) {
            ordering[sortOrder[i]] = i;
        }
        console.log("sorting unitOptions...");
        $scope.unitOptions.sort(function (a, b) {
            return (ordering[a.type] - ordering[b.type]) || a.name.localeCompare(b.name);
        });
    };

    // An object to bind user choice of normalisation unit index & amount
    $scope.model = {
        selectedIndex: "",
        unitAmount: 1
    };

    // Function to start normalisation if 'enter' key is pressed in the normalisation unit box
    $scope.keydownFunction = function (event) {
        if (event.keyCode === 13) {   // '13' is the key code for enter
            if ($scope.isValidChoice($scope.model)) {
                $scope.startNormalisation();
            }
        }
    };

    /*
        Function to return a submatrix from the matrix passed in.
        Starts from second row, third column, until the end, as these are the numeric entries.
        Needs to be updated if original matrix layout if changed.
    */
    extractSubMatrix = function (matrix) {
        var subMatrix = [];
        for (var row = 1; row < matrix.length; row++) {
            subMatrix[row - 1] = []; // create a subarray for each row. Minus 1 for index to start from 0
            for (var col = 2; col < matrix[0].length; col++) {
                // only the numeric values are extracted, type is not needed
                subMatrix[row - 1].push(matrix[row][col].value);
            }
        }
        return subMatrix;
    };

    // Function to check if user input normalisation amount is positive, and if a material was chosen.
    // Used to disable the button for normalisation if choice is not valid.
    $scope.isValidChoice = function (model) {
        return model.unitAmount > 0 && model.selectedIndex !== "";
    };

    // Function called by the Normalise button in wasteIntensity.html.
    $scope.startNormalisation = function () {
        $scope.subMatrix = extractSubMatrix($scope.balancedMatrix);
        try {
            $scope.inverse = numeric.inv($scope.subMatrix);
        } catch (e) {
            // normalisation requires inverse matrix
            // which may not exist if user submitted incorrect data
            console.log("no inverse exists for the matrix constructed from user submitted data");
            alert("The data you have submitted is not valid, please verify and resubmit.");
            return;
        }
        createDemandVector();
        getScalingVector();
        scaleSubMatrix();
        buildNormalisedMatrix();
        $scope.normalisedMatrixTrimmed = trimNormalisedMatrix($scope.normalisedMatrix);
        setResultsList();
    };

    /*
        Function to create the demand vector.
        Resets on every call in case user normalises again using the same data.
        The resultant vector will be all 0s, except for the index that matches
        the user's material choice, where it will be the specified amount.
    */
    createDemandVector = function () {
        $scope.demandVector = [];
        for (var row = 0; row < $scope.subMatrix.length; row++) {
            if (row === $scope.model.selectedIndex - 1) { // minus 1 because demandVector has no heading row
                $scope.demandVector.push([$scope.model.unitAmount]);
            } else {
                $scope.demandVector.push([0]);
            }
        }
    };

    // Function to get scaling vector, by multiplying inverse with demand vector.
    getScalingVector = function () {
        $scope.scalingVector = numeric.dot($scope.inverse, $scope.demandVector);
    };

    // Function to replace entries in subMatrix, by multiplying each column with its respective scaling factor.
    scaleSubMatrix = function () {
        for (var col = 0; col < $scope.subMatrix[0].length; col++) {
            for (var row = 0; row < $scope.subMatrix.length; row++) {
                var factor = $scope.scalingVector[col][0];
                var originalEntry = $scope.subMatrix[row][col];
                $scope.subMatrix[row][col] = originalEntry * factor;
            }
        }
    };

    /*
        Function to populate the normalised matrix with values from balancedMatrix & subMatrix.
        Resets on every call in case user normalises again using the same data.
        Text entries such as headings, names are taken from balancedMatrix. These are entryObjects,
        hence populate using the object's .value.
        Numeric entries are taken as is from submatrix.
    */
    buildNormalisedMatrix = function () {
        $scope.normalisedMatrix = [[]];
        // add first row (headings & process names) from balancedMatrix
        for (var col = 0; col < $scope.balancedMatrix[0].length; col++) {
            $scope.normalisedMatrix[0].push($scope.balancedMatrix[0][col].value);
        }

        // for second row onwards, combine first two columns with the normalised numeric values
        for (var row = 1; row < $scope.balancedMatrix.length; row++) {
            $scope.normalisedMatrix[row] = [$scope.balancedMatrix[row][0].value]; // type
            $scope.normalisedMatrix[row].push($scope.balancedMatrix[row][1].value); // material name
            Array.prototype.push.apply($scope.normalisedMatrix[row], $scope.subMatrix[row - 1]); // numbers
        }
        console.log("Normalised matrix constructed.");
    };


    // Function to clone the normalised matrix, dropping all empty rows and columns
    // Note: this function is slightly different from the other trim function above.
    // In the one above, each cell of the matrix is an object with a "value" property.
    // In the one here, each cell of the matrix is the value itself.
    trimNormalisedMatrix = function (matrix) {
        var newMatrix = [];
        newMatrix.push(matrix[0]); // copy first row (headings & process names)

        // trim empty rows
        for (var row = 1; row < matrix.length; row++) {
            for (var col = 2; col < matrix[0].length; col++) {
                if (matrix[row][col] !== 0) {
                    // if a column in this row is non-zero, add this row
                    newMatrix.push(matrix[row]);
                    break; // move onto next row
                }
            }
        }

        // find out which columns are empty
        var columnsToDrop = [];
        for (col = 2; col < newMatrix[0].length; col++) {
            var processName = newMatrix[0][col];
            if (processName.indexOf("<acc>") === processName.length - 5) {
                // if this column is an added accounting column, mark it for dropping
                columnsToDrop.push(col);
                continue;
            }

            var columnIsEmpty = true;
            for (row = 1; row < newMatrix.length; row++) {
                if (newMatrix[row][col] !== 0) {
                    // if this column has a non-zero cell
                    columnIsEmpty = false;
                    break;
                }
            }
            if (columnIsEmpty) {
                // take note of this column number
                columnsToDrop.push(col);
            }
        }

        // trim empty columns
        var trimmedMatrix = [];
        for (row = 0; row < newMatrix.length; row++) {
            trimmedMatrix[row] = [];
            for (col = 0; col < matrix[0].length; col++) {
                if (columnsToDrop.indexOf(col) < 0) {
                    // if current cell's column value was not noted for removal, add it
                    trimmedMatrix[row].push(newMatrix[row][col]);
                }
            }
        }
        console.log("Normalised Matrix trimmed");
        return trimmedMatrix;
    };

    // Function to set the apprpriate strings for displaying normalisation results.
    setResultsList = function () {
        $scope.data.resultsInput = [];
        $scope.data.resultsWaste = [];
        for (var i = 0; i < $scope.unitOptions.length; i++) {
            if ($scope.unitOptions[i].index === $scope.model.selectedIndex) {
                // get the name of the normalisation target item
                var productName = $scope.unitOptions[i].name;
                break;
            }
        }
        $scope.data.resultsHeading = "To produce " + $scope.model.unitAmount + "kg of " +
                                     productName + ",";
        var tempObject;
        // check for inputs & wastes involved
        for (var row = 0; row < $scope.normalisedMatrixTrimmed.length; row++) {
            // Intemerdiary materials are not included under the results for Inputs.
            // Currently, the items that will be listed under input are
            // materials that have to be supplied into the system.
            if ($scope.normalisedMatrixTrimmed[row][0].toLowerCase() === "input") {
                tempObject = {
                    name: $scope.normalisedMatrixTrimmed[row][1],
                    amount: 0
                };
                for (var col = 2; col < $scope.normalisedMatrixTrimmed[0].length; col++) {
                    tempObject.amount += $scope.normalisedMatrixTrimmed[row][col];
                }
                // input values are negative, need to negate
                tempObject.amount = -tempObject.amount;
                $scope.data.resultsInput.push(tempObject);
            } else if ($scope.normalisedMatrixTrimmed[row][0].toLowerCase() === "waste") {
                tempObject = {
                    name: $scope.normalisedMatrixTrimmed[row][1],
                    amount: 0
                };
                for (var col = 2; col < $scope.normalisedMatrixTrimmed[0].length; col++) {
                    tempObject.amount += $scope.normalisedMatrixTrimmed[row][col];
                }
                $scope.data.resultsWaste.push(tempObject);
            }
        }
        console.log("Results lists set.");
    };

    /*
        Function to change how results are shown to user.
        Headings and material names are strings, and are shown as is.
        Otherwise, entry is a number, round it to 3 decimal places.
        If rounded value = 0, the cell will be blank for better reading.
        Otherwise, display the rounded value.
    */
    $scope.formatEntry = function (entry) {
        if (typeof entry === "string") {
            return entry;
        }
        var roundedEntry = entry.toFixed(3);
        if (roundedEntry === "0.000") {
            return "";
        } else {
            return roundedEntry;
        }
    };

    /*
    Function called by Export button in wasteIntensity.html.
    The output file will have the following format:
        <Original Input> <Demand Vector> <Scaling Vector>
        <Balanced Matrix>
        <Normalised Matrix>
    Each matrix is separated from adjacent ones by an empty row/column.
*/
    $scope.startExport = function () {
        var exportMatrix = []; // to hold all the matrices to be written to spreadsheet

        var normalisationAmount = $scope.model.unitAmount;
        var normalisationMaterial = $scope.inputMatrix[$scope.model.selectedIndex][1].value;
        var filename = "Matrices Export (normalised to " + normalisationAmount + " " + normalisationMaterial + ").xlsx";

        addFirstRowOfMatrices(exportMatrix);
        addBalancedMatrix(exportMatrix);
        addNormalisedMatrix(exportMatrix, normalisationAmount, normalisationMaterial);

        createWorkbookAndSave(exportMatrix, filename);
    };

    /*
        Function to return a copy of the passed matrix.
        In the new copy, cells containing entry objects
        are replaced with their respective values.
    */
    changeEntryObjectsToValues = function (matrix) {
        var newMatrix = [];
        for (var row = 0; row < matrix.length; row++) {
            newMatrix[row] = [];
            for (var col = 0; col < matrix[0].length; col++) {
                newMatrix[row][col] = matrix[row][col].value;
            }
        }
        return newMatrix;
    };

    // Function to add input matrix, demand & scaling vectors to exportMatrix.
    addFirstRowOfMatrices = function (exportMatrix) {
        var inputMatrix = changeEntryObjectsToValues($scope.inputMatrix);

        // create first group headings for the export file (contains the title of the 3 matrices)
        var headings = ["Original Input"];
        // length + 1 & 3 so that the vectors will be spaced apart by an empty column
        headings[inputMatrix[0].length + 1] = "Demand Vector";
        headings[inputMatrix[0].length + 3] = "Scaling Vector";

        // push the first two heading rows into the output matrix
        exportMatrix.push(headings);
        exportMatrix.push(inputMatrix[0]);

        // push rows of the original input matrix, demandVector, and scalingVector into the output matrix
        for (var row = 1; row < inputMatrix.length; row++) {
            // row minus 1 because numeric entries begin at first row in demand & scaling vector
            var tail = ["", $scope.demandVector[row - 1], "", $scope.scalingVector[row - 1]]; // empty string for separation
            exportMatrix.push(inputMatrix[row].concat(tail));
        }
        exportMatrix.push([]); // empty row for separation
    };

    // Function to add balancedMatrix to exportMatrix.
    addBalancedMatrix = function (exportMatrix) {
        var balancedMatrix = changeEntryObjectsToValues($scope.balancedMatrix);

        // add heading for the balanced matrix
        exportMatrix.push(["Balanced Matrix"]);

        for (var row = 0; row < balancedMatrix.length; row++) {
            exportMatrix.push(balancedMatrix[row]);
        }
        exportMatrix.push([]); // empty row as padding
    };

    // Function to add normalisedMatrix to exportMatrix.
    addNormalisedMatrix = function (exportMatrix, normalisationAmount, normalisationMaterial) {
        var normalisedMatrix = $scope.normalisedMatrix;

        // add heading for the normalised matrix
        exportMatrix.push(["Matrix Normalised to " + normalisationAmount + " " + normalisationMaterial]);

        for (var row = 0; row < normalisedMatrix.length; row++) {
            exportMatrix.push(normalisedMatrix[row]);
        }
    };

    // Function to convert exportMatrix into a spreadsheet and offer download.
    createWorkbookAndSave = function (exportMatrix, filename) {
        var ws_name = "Matrices";
        var wb = new workbook();
        var ws = XLSX.utils.aoa_to_sheet(exportMatrix); // convert exportMatrix into a worksheet

        // add the worksheet to workbook
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;

        var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
        saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), filename);
    };

    workbook = function () {
        if (!(this instanceof workbook)) return new workbook();
        this.SheetNames = [];
        this.Sheets = {};
    };

    s2ab = function (s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    };

    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-36810333-1']);
    _gaq.push(['_setDomainName', 'sheetjs.com']);
    _gaq.push(['_setAllowLinker', true]);
    _gaq.push(['_trackPageview']);

    (function () {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();
});