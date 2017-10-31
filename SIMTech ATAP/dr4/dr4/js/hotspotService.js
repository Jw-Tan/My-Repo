var app = angular.module("neuboard");
app.service("hotspotService", function (dataService, $http) {
    var entries;
    var gatheredProcessNames;
    var gatheredProcesses;
    var identifiedProcesses;
    var totalWasteAmount; // for waste % calculation
    var currentPercent;
    var resultString;

    // Function to go through all entries and add the relevant data.
    addEntries = function () {
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (entry["InOutWaste"].toLowerCase() === "input") {
                // ignore input values for hotspot analysis
                continue;
            }

            var processName = entry["Process"];
            var idx = gatheredProcessNames.indexOf(processName);
            if (idx < 0) { // this process name has not been added before
                var tempProcess = {
                    name: processName, wasteAmount: 0,
                    waste: [], individualAmounts: [],
                    output: 0
                };
                if (entry["InOutWaste"].toLowerCase() === "waste") {
                    tempProcess["wasteAmount"] += parseFloat(entry["Amount"]);
                    totalWasteAmount += parseFloat(entry["Amount"]);
                    tempProcess["waste"].push(entry["Material"]);
                    tempProcess["individualAmounts"].push(parseFloat(entry["Amount"]));
                } else if (entry["InOutWaste"].toLowerCase() === "output") {
                    tempProcess["output"] += parseFloat(entry["Amount"]);
                }
                gatheredProcessNames.push(processName);
                gatheredProcesses.push(tempProcess);
            } else { // this process name has been added before
                if (entry["InOutWaste"].toLowerCase() === "waste") {
                    gatheredProcesses[idx].wasteAmount += parseFloat(entry["Amount"]);
                    var wasteIdx = gatheredProcesses[idx]["waste"].indexOf(entry["Material"]);
                    if (wasteIdx < 0) {
                        // this waste material has not been added before
                        gatheredProcesses[idx]["waste"].push(entry["Material"]);
                        wasteIdx = gatheredProcesses[idx]["waste"].indexOf(entry["Material"]);
                        gatheredProcesses[idx]["individualAmounts"][wasteIdx] = 0;
                    }
                    gatheredProcesses[idx]["individualAmounts"][wasteIdx] += parseFloat(entry["Amount"]);
                    totalWasteAmount += parseFloat(entry["Amount"]);
                    // check and add name of waste if this is first encounter
                    var wasteIdx = gatheredProcesses[idx]["waste"].indexOf(entry["Material"]);
                    if (wasteIdx < 0) {
                        // first encounter
                        gatheredProcesses[idx]["waste"].push(entry["Material"]);
                    }
                } else if (entry["InOutWaste"].toLowerCase() === "output") {
                    gatheredProcesses[idx].output += parseFloat(entry["Amount"]);
                }
            }
        }
    };

    // For when user wishes to normalise waste generated to per kg of output.
    // Also rounds the waste amount of each process to 2 decimal places if needed.
    roundAndNormaliseWasteAmount = function (normalise) {
        if (normalise) {
            totalWasteAmount = 0;
        }
        for (var i = 0; i < gatheredProcesses.length; i++) {
            if (normalise) {
                gatheredProcesses[i].wasteAmount = gatheredProcesses[i].wasteAmount / gatheredProcesses[i].output;
                totalWasteAmount += gatheredProcesses[i].wasteAmount;
            }
            if (gatheredProcesses[i].wasteAmount % 1 !== 0) { // if there are decimal places
                gatheredProcesses[i].wasteAmount = parseFloat(gatheredProcesses[i].wasteAmount.toFixed(2));
            }
        }
        if (totalWasteAmount % 1 !== 0) { // if there are decimal places
            totalWasteAmount = parseFloat(totalWasteAmount.toFixed(2));
        }
    };

    // Assign a numeric ID for each process, to be used as pareto chart x-axis labels
    assignIDtoProcesses = function () {
        // sort by waste amount in descending order
        gatheredProcesses.sort(function (a, b) { return b.wasteAmount - a.wasteAmount; });

        for (var i = 0; i < gatheredProcesses.length; i++) {
            var id = i + 1;
            gatheredProcesses[i]["id"] = id.toString();
        }
    };

    // Function to begin 8020 hotspot analysis.
    findHotspots = function () {
        var copyOfProcesses = gatheredProcesses.slice(0);
        for (var i = 0; i < copyOfProcesses.length; i++) {
            // add a percent property to each process object
            var process = copyOfProcesses[i];
            process["percent"] = process.wasteAmount / totalWasteAmount * 100;
        }

        // sort by percent in ascending order
        copyOfProcesses.sort(function (a, b) { return a.wasteAmount - b.wasteAmount; });

        

        if (copyOfProcesses.length === 1) {
            resultString = "There is only 1 process, "
                                  + copyOfProcesses[0].name
                                  + " is your hotspot.";
            identifiedProcesses.push(copyOfProcesses.pop());
            return;
        }

        while (copyOfProcesses.length > 0) {
            // check whether all (remaining) processes in the array are equal contributors.
            if (testForEqualPercent(copyOfProcesses)) {
                if (identifiedProcesses.length === 0) {
                    // if no process has been identified as hotspot yet
                    resultString = "All of your processes generate equal amounts of waste. "
                                          + "Please manually choose the hotspots.";
                } else if (identifiedProcesses.length === 1) {
                    resultString = "The process highlighted in red above has been identified as a hotspot. \
                                           However, the remainder processes generate equal amounts of waste. \
                                           Please manually determine the hotspots.";
                } else {
                    // plural vesion of the above
                    resultString = "The processes highlighted in red above have been identified as hotspots. \
                                           However, the remainder processes generate equal amounts of waste. \
                                           Please manually determine the hotspots.";
                }
                break;
            }

            var largestContributor = copyOfProcesses.pop();
            if (currentPercent + largestContributor.percent === 80) {
                identifiedProcesses.push(largestContributor); // take this process
                currentPercent += largestContributor.percent; // and update the current total percentage
                setResultString();
                break;
            }

            if (currentPercent + largestContributor.percent < 80) { // target not yet reached
                identifiedProcesses.push(largestContributor);
                currentPercent += largestContributor.percent;
                continue; // and carry on with next iteration
            }

            /*
                At this point, taking the largestContributor will bring currentPercent over 80.
                Decision to include this process is based on which result is closer to 80.
                If both cases are equally far away from 80, decision is to keep things simple
                and take 1 less.
            */

            // New percentage if we were to take the current largestContributor
            var newPercent = currentPercent + largestContributor.percent;

            if ((newPercent - 80) < (80 - currentPercent)) {
                // newPercent is closer to 80, hence take the current largestContributor
                identifiedProcesses.push(largestContributor);
                currentPercent += largestContributor.percent;
            } // If currentPercent is closer to 80, do nothing.

            setResultString();
            break;
        }
    };

    /* 
        Function to check whether all remaining processes in an array have equal percentages.
        If this happens, stop gathering more processes and inform user that the remaining processes
        contribute equally to the waste generated, and they have to manually decide.
        Returns false if array has less than 2 processes, since there is nothing to compare with.
    */
    testForEqualPercent = function (array) {
        if (array.length < 2) {
            return false;
        }
        var percent = array[0].percent; // use first process percent as reference
        for (var i = 1, len = array.length; i < len; i++) {
            if (array[i].percent !== percent) { // if any process percent does not match, return false
                return false;
            }
        }
        return true;
    };

    // Stores the approriate results string.
    setResultString = function () {
        if (identifiedProcesses.length === 1) {
            resultString = "The process highlighted in red above has been identified as a hotspot. \
                                   It accounts for " + currentPercent.toFixed(2) + "% of your total waste.";
        } else {
            // plural version
            resultString = "The processes highlighted in red above have been identified as hotspots. \
                                  They account for " + currentPercent.toFixed(2) + "% of your total waste.";
        }
    };

    // This function contains the set of functions for hotspot analysis that should only
    // be called after the data entries have been retrieved from the database.
    proceedWithHotspot = function (selectedTimeFrame, selectedYear, selectedMonth, normalise, callback) {
        addEntries();
        roundAndNormaliseWasteAmount(normalise);
        assignIDtoProcesses();
        findHotspots();
        callback();
    };


    // This function fetches the relevant data entries from the database
    // and then proceeds with hotspot analysis.
    getEntriesForHotspots = function (selectedTimeFrame, selectedYear, selectedMonth, normalise, callback) {
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
            entries = response.data;
            proceedWithHotspot(selectedTimeFrame, selectedYear, selectedMonth, normalise, callback);
        }).catch(function (e) {
            console.log("error!");
            console.log(e);
            alert(e);
        });
    };

    return {
        // Function to be called by other component to begin hotspot analysis.
        prepareHotspotData: function (selectedTimeFrame, selectedYear, selectedMonth, normalise, callback) {
            gatheredProcesses = [];
            gatheredProcessNames = [];
            identifiedProcesses = [];
            totalWasteAmount = 0;
            currentPercent = 0;
            getEntriesForHotspots(selectedTimeFrame, selectedYear, selectedMonth, normalise, callback);
        },
        getGatheredProcesses: function () {
            return gatheredProcesses;
        },
        getIdentifiedProcesses: function () {
            return identifiedProcesses;
        },
        getTotalWasteAmount: function () {
            return totalWasteAmount;
        },
        getResultString: function () {
            return resultString;
        },
        getCurrentPercent: function () {
            return currentPercent;
        }
    };
});