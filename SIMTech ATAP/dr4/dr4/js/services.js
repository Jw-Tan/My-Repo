var hierarchy = angular.module("hierarchy");

/**
    The sharedProperties service helps to transport data between the base page (hotspoteval.timed.js) i.e. measuresRec.html, 
    checkist, and flowchart pages.
    Main purpose is it will save the results stored here when user confirms they are done evaluating (i.e. both checklist & flowchart),
    so this acts like a temporory storage before results are actually saved into database when user chooses to do so.
**/
hierarchy.service('sharedProperties', ['FLWTYPES', function (FLWTYPES) {

    // for checklist usage
    var typeOfFoodWaste = FLWTYPES.NOVAL;
    var accessedChecklist = false;

    // for tracking checklist and flowchart and saving
    var causesChecked = {
        avoidable: [],
        unavoidable: []
    };
    var recommendations = {
        reduction: [],
        diversion: []
    };
    var save = false;
    // end tracking checklist and flowchart and saving

    // 
    var processes = [];
    var hotspotsIsNormalised = false;

    var currentEvaluatingWaste = null;
    var edibleCauses = false;
    var wasteObjects = [];
    var selectedYears = [];
    var years = [];
    for (var i = 0; i <= 20; i++) {
        years.push(2015 + i);
    }
    return {
        // ======= for tracking checklist and saving =========

        getCausesA: function() {
            return causesChecked.avoidable;
        },
        getCausesUA: function() {
            return causesChecked.unavoidable;
        },
        setCauses: function (a, ua) {
            causesChecked.avoidable = a.slice();
            causesChecked.unavoidable = ua.slice();
        },

        // ======= end for tracking checklist and saving =========


        // ======= for tracking flowchart and saving =========

        getRecsRed: function() {
            return recommendations.reduction;
        },
        getRecsDiv: function() {
            return recommendations.diversion;
        },
        setRecs: function (red, div) {
            recommendations.reduction = red.slice();
            recommendations.diversion = div.slice();
        },

        // ======= end for tracking flowchart and saving =========


        // ======= for tracking checklist and flowchart and saving ===========

        getSave: function() {
            return save;
        },
        setSave: function(value) {
            save = value;
        },
        // resets when user chooses to close evaluation popup window without saving his progress so far
        resetCausesAndRecs: function() {
            causesChecked = {
                avoidable: [],
                unavoidable: []
            };
            recommendations = {
                reduction: [],
                diversion: []
            };
            typeOfFoodWaste = FLWTYPES.NOVAL;
            accessedChecklist = false;
        },

        // ======= end for tracking checklist and flowchart and saving ===========


        // ======= for base page hotspoteval.timed.js ================
        getProcesses: function () {
            return processes;
        },
        setProcesses: function (info) {
            processes = info;
        },
        // ======= end for base page hotspoteval.timed.js ================

 
        // ======= for checklist ================
        getFoodWaste: function () {
            return typeOfFoodWaste;
        },
        setFoodWaste: function (value) {
            typeOfFoodWaste = value;
        },
        // ======= for checklist ================

        //---for future use, if the feature of letting users go straight to the flowchart (i.e. by-passing checklist) is implemented
        getAccessedChecklist: function () {
            return accessedChecklist;
        },
        setAccessedChecklist: function (value) {
            accessedChecklist = value;
        },
        //---end for future use, if the feature of letting users go straight to the flowchart (i.e. by-passing checklist) is implemented


        // -----for checklist ----------------------------------------------------------
        getHasFLWType: function () {
            return typeOfFoodWaste !== FLWTYPES.NOVAL;
        },

        // ------------- for scoring system, in case this component is brought back in the future -----------------------
        getWasteObjects: function () {
            return wasteObjects;
        },
        setWasteObjects: function (newWasteObjects) {
            wasteObjects = newWasteObjects;
        },
        getSelectedYears: function () {
            return selectedYears;
        },
        setSelectedYears: function (newSelectedYears) {
            selectedYears = newSelectedYears;
        },
        getYearsArray: function () {
            return years;
        },
        setEdibleCauses: function (value) {
            edibleCauses = value;
        },
        getEdibleCauses: function () {
            return edibleCauses;
        }
        // ------------- end for scoring system, in case this component is brought back in the future -----------------------

    };
}]);

var app = angular.module("neuboard");
app.service("dataService", function ($http) {
    var processesAndWastes = [];
    var numHotspots;
    var resultIsNormalised = false;
    var evaluatedWastes = [];
    var evaluations = [];
    var phpServerName = "http://localhost/"; // only have to change here once if server changed

    // Function to compile the entries in evaluationResults.
    // Each item in evaluationResults corresponds to a waste item,
    // the type of result, and the value of the result.
    // Returns an array of objects where results for the same waste are combined.
    compileEvaluationResults = function (evaluationResults) {
        var wasteResults = [];
        var addedWaste = [];
        for (var i = 0; i < evaluationResults.length; i++) {
            var thisWaste = evaluationResults[i];
            var wasteName = thisWaste["Waste"];
            if (addedWaste.indexOf(wasteName) < 0) {
                // this waste has not been added before
                addedWaste.push(wasteName);
                var wasteObject = {
                    name: wasteName,
                    causes: {
                        avoidable: [],
                        unavoidable: []
                    },
                    rec: {
                        reduction: [],
                        diversion: []
                    }
                };
                wasteResults.push(wasteObject);
            }
            var idx = addedWaste.indexOf(wasteName);
            // add the string results to the arrays for avoidable & unavoidable causes,
            // reduction & diversion recommendations accordingly
            var resultType = thisWaste["Type"].toLowerCase();
            if (resultType === "avoidable") {
                wasteResults[idx].causes.avoidable.push(thisWaste["Value"]);
            } else if (resultType === "unavoidable") {
                wasteResults[idx].causes.unavoidable.push(thisWaste["Value"]);
            } else if (resultType === "reduction") {
                wasteResults[idx].rec.reduction.push(thisWaste["Value"]);
            } else if (resultType === "diversion") {
                wasteResults[idx].rec.diversion.push(thisWaste["Value"]);
            }
        }
        evaluatedWastes = addedWaste;
        evaluations = wasteResults;
    };

    // Function to return an array of objects containing dates of this week.
    // Week starts on Monday, and first index is for Monday.
    getThisWeekDates = function () {
        var sevenDates = [];
        var dateInfo;
        var tempDay;
        var thisDay = new Date();
        var dayMilliseconds;

        // If thisDay is not Monday, bring thisDay back to latest Monday
        while (thisDay.getDay() !== 1) {
            dayMilliseconds = thisDay.getTime(); // convert to milliseconds since 1 Jan 1970
            // milliseconds * seconds * minutes * hours yields a day's milliseconds
            dayMilliseconds -= (1000 * 60 * 60 * 24);
            thisDay = new Date(dayMilliseconds);
        }

        for (var i = 0; i < 7; i++) { // loop 7 times
            tempDay = thisDay.getTime() + (i * 1000 * 60 * 60 * 24);
            tempDay = new Date(tempDay); // convert millisecond to Date object
            dateInfo = {
                "day": tempDay.getDate(),
                "month": tempDay.getMonth(), // note that Javascript months start from 0
                "year": tempDay.getFullYear()
            };
            sevenDates.push(dateInfo);
        }
        return sevenDates;
    };

    // Return an array of 7 objects containing date & waste amount properties.
    // First object in the array is Monday of this week.
    handleWeekResult = function (weekResults, thisWeekDates) {
        var result = [];
        for (var i = 0; i < thisWeekDates.length; i++) {
            result[i] = {
                day: thisWeekDates[i]["day"],
                month: thisWeekDates[i]["month"],
                year: thisWeekDates[i]["year"],
                wasteAmount: 0
            };
            for (var k = 0; k < weekResults.length; k++) {
                // if the fetched results have a matching date, add its waste amount
                if (parseInt(weekResults[k]["Year"]) === result[i].year
                    && parseInt(weekResults[k]["Month"]) === result[i].month
                    && parseInt(weekResults[k]["Day"]) === result[i].day) {
                    result[i].wasteAmount += parseFloat(weekResults[k]["Waste"]);
                }
            }
        }
        return result;
    };

    // Returns an array of 12 objects containing month, year & waste amount properties.
    // First object is for month 0 (Jan), last object is for month 11 (Dec).
    handleMonthResult = function (monthResults, thisYear) {
        var result = [];
        for (var i = 0; i < 12; i++) {
            result[i] = {
                month: i,
                year: thisYear,
                wasteAmount: 0
            };
        }
        for (var k = 0; k < monthResults.length; k++) {
            var idx = parseInt(monthResults[k]["Month"]);
            result[idx].wasteAmount += parseFloat(monthResults[k]["Waste"]);
        }
        return result;
    };

    // Returns an array of objects, each containing waste amount for a given year.
    handleYearResult = function (yearResults) {
        var result = [];
        for (var i = 0; i < yearResults.length; i++) {
            result[i] = {
                year: parseInt(yearResults[i]["Year"]),
                wasteAmount: parseFloat(yearResults[i]["Waste"])
            };
        }
        return result;
    };

    // Returns an array of objects containing process information the passed result data.
    // This is used for creating results with efficiency information.
    // The array is returned sorted, with the least efficient process in front.
    handleProcessResult = function (results) {
        var addedProcessNames = [];
        var result = [];
        for (var i = 0; i < results.length; i++) {
            var processName = results[i]["Process"];
            if (addedProcessNames.indexOf(processName) < 0) {
                // process not added before
                addedProcessNames.push(processName);
                var newObject = {
                    processName: processName,
                    input: 0,
                    output: 0,
                    waste: 0,
                    efficiencyPercent: 0 // output over input
                };
                result.push(newObject);
            }
            var idx = addedProcessNames.indexOf(processName);
            var amount = parseFloat(results[i]["Amount"]);
            if (results[i]["InOutWaste"] === "Input") {
                result[idx].input += amount;
            } else if (results[i]["InOutWaste"] === "Output") {
                result[idx].output += amount;
            } else if (results[i]["InOutWaste"] === "Waste") {
                result[idx].waste += amount;
            }
        }
        for (i = 0; i < result.length; i++) {
            result[i].efficiencyPercent = result[i].output / result[i].input * 100;
        }
        result.sort(function (a, b) {
            // sort the processes based on their efficiency, in ascending order
            return a.efficiencyPercent - b.efficiencyPercent;
        });
        return result;
    };

    // Returns an object containing the average cost of production & disposal per kg.
    // These values were fetched from the database (if present). Otherwise, a value
    // of -1 is used.
    handleAverageCostsResult = function (averageCostsResult) {
        var result = {
            productionCost: 0,
            disposalCost: 0
        };
        if (averageCostsResult.length !== 1) { // correct result should have 1 object
            // -1 means that costs has not been initialised yet
            result.productionCost = -1;
            result.disposalCost = -1;
        } else {
            if (typeof averageCostsResult[0]["ProductionCost"] === 'undefined') {
                result.productionCost = -1;
            } else {
                result.productionCost = parseFloat(averageCostsResult[0]["ProductionCost"]);
            }
            if (typeof averageCostsResult[0]["DisposalCost"] === 'undefined') {
                result.disposalCost = -1;
            } else {
                result.disposalCost = parseFloat(averageCostsResult[0]["DisposalCost"]);
            }
        }
        return result;
    };

    return {
        getPHPServerName: function () {
            return phpServerName;
        },

        // Function to return whether data entries exists in database.
        hasEntries: function (callback) {
            $http({
                method: "GET",
                url: phpServerName + "api/getEntryCount.php"
            }).then(function successCallback(response) {
                var count = parseInt(response.data[0].Count);
                if (count > 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            }).catch(function (e) {
                console.log("error!");
                console.log(e);
            });
        },

        // Adds the evaluation results for a waste item into database
        setEvaluationResults: function (wasteObject, callback) {
            console.log("Saving evaluation result.");
            $http({
                method: "POST",
                url: phpServerName + "api/addEvaluationResults.php",
                data: {
                    waste: wasteObject.name,
                    avoidableCauses: wasteObject.causes.avoidable,
                    unavoidableCauses: wasteObject.causes.unavoidable,
                    reductionRecommendations: wasteObject.rec.reduction,
                    diversionRecommendations: wasteObject.rec.diversion
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(function successCallback(response) {
                console.log(response.data);
                if (response.data.toLowerCase().indexOf("error") < 0) {
                    // success
                    callback(true);
                } else {
                    callback(false);
                }
            }), function (e) {
                console.log("Error: " + e);
                alert("Error: " + e);
            };
        },

        // Fetches evaluation results stored in database, compiles and stores them.
        getEvaluationResults: function (callback) {
            console.log("fetching evaluation results");
            $http({
                method: "GET",
                url: phpServerName + "api/getEvaluationResults.php"
            }).then(function successCallback(response) {
                console.log("Evaluation results received.");
                compileEvaluationResults(response.data);
                callback();
            }).catch(function (e) {
                console.log("error!");
                console.log(e);
            });
        },

        // Function to store the processes gathered at the end of analysis.
        setProcessesAndWastes: function (data, numOfHotspots, isNormalised) {
            processesAndWastes = JSON.parse(JSON.stringify(data));
            numHotspots = numOfHotspots;
            resultIsNormalised = isNormalised;
            console.log("hotspots & wastes identified & set");
        },

        /*
            Function to compile & return infomation regarding the processes analysed and whether
            the analysis performed was normalised. 
            Results contains 3 objects: processes, numOfHotspots and isNormalised.
            isNormalised is a boolean reflecting whether waste amounts were normalised.
            processes is an array containing objects, each representing a process.
            numOfHotspots is an int indicating how many hotspots were identified. If this has
            a value of 3, it means the first 3 process in the processes array are the hotspots.
            Format for each process object is:
            { name: process name string,
              id: int that gives each process a numeric identification,
              wasteAmount: total waste produced by this process float,
              waste: array of waste objects }

            Each waste object in the waste array represent each waste produced by this process.
            Format for each is:
            { name: waste name string, amount: this waste's amount float, evaluated: Yes/No string,
              causes: object containing 2 arrays, rec: object containing 2 arrays }

            evaluated represents whether this waste material has been evaulated before,
            and thus already has its results stored in the database (results can be blank).

            causes object contains 2 properties: avoidable & unavoidable. Both are arrays of
            strings to hold evaluation results regarding this waste's avoidable & unavoidable
            causes respectively. If this waste has not been evaluated before, these arrays
            will be empty.

            rec object contains 2 properties: reduction & diversion. Similar to causes object,
            these 2 are arrays of strings to hold the respective results, if any.
        */
        getProcessesAndWastes: function () {
            var processesArray = [];
            for (var i = 0; i < processesAndWastes.length; i++) {
                // go through each process
                var processObject = {
                    name: processesAndWastes[i].name,
                    id: processesAndWastes[i].id,
                    wasteAmount: processesAndWastes[i].wasteAmount,
                    waste: []
                };
                for (var k = 0; k < processesAndWastes[i].waste.length; k++) {
                    // go through each waste of this process
                    var wasteObject = {
                        name: processesAndWastes[i].waste[k],
                        amount: processesAndWastes[i].individualAmounts[k],
                        evaluated: "No",
                        causes: {
                            avoidable: [],
                            unavoidable: []
                        },
                        rec: {
                            reduction: [],
                            diversion: []
                        }
                    };

                    // if this waste has already been evaluated, add the respective results
                    var idx = evaluatedWastes.indexOf(wasteObject.name);
                    if ( idx > -1) {
                        wasteObject.evaluated = "Yes";
                        wasteObject.causes = evaluations[idx].causes;
                        wasteObject.rec = evaluations[idx].rec;
                    }
                    processObject.waste.push(wasteObject);
                }
                processesArray.push(processObject);
            }
            var result = {
                processes: processesArray,
                numOfHotspots: numHotspots,
                isNormalised: resultIsNormalised
            };
            return result;
        },

        /*
            This function uses an asynchronous call, and cannot directly return a value
            back if this is called inside a synchronous method (from the dashboard).
            Hence a callback function has to be passed in, which will then be called when
            the asynchronous response completes.
            This callback is defined in the calling page.
        */
        getDashboardData: function (callback) {
            var today = new Date();
            var thisWeekDates = getThisWeekDates();
            var thisMonth = today.getMonth();
            var thisYear = today.getFullYear();

            console.log("Fetching dashboard data.");
            $http({
                method: "POST",
                url: phpServerName + "api/getDashboardData.php",
                data: {
                    "weekDates": thisWeekDates,
                    "month": thisMonth,
                    "year": thisYear,
                    "today": today.getDate()
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(function successCallback(response) {
                var result = response.data;
                var entryCountResult = JSON.parse(result.entryCount);
                var skeletonCountResult = JSON.parse(result.skeletonCount);
                var processInfoCountResult = JSON.parse(result.processInfoCount);
                var weekResult = JSON.parse(result.weekView);
                var monthResult = JSON.parse(result.monthView);
                var yearResult = JSON.parse(result.yearView);
                var todayProcesses = JSON.parse(result.todayProcesses);
                var monthProcesses = JSON.parse(result.monthProcesses);
                var yearProcesses = JSON.parse(result.yearProcesses);
                var averageCostsResult = JSON.parse(result.averageCosts);

                var weekData = handleWeekResult(weekResult, thisWeekDates);
                var monthData = handleMonthResult(monthResult, thisYear);
                var yearData = handleYearResult(yearResult);
                var todayProcessesData = handleProcessResult(todayProcesses);
                var monthProcessesData = handleProcessResult(monthProcesses);
                var yearProcessesData = handleProcessResult(yearProcesses);
                var averageCostsData = handleAverageCostsResult(averageCostsResult);

                // check whether there are data entries in the database
                var entryCount = parseInt(entryCountResult[0].Count);
                var hasEntryStatus = false;
                if (entryCount > 0) {
                    hasEntryStatus = true;
                }

                // check whether matrix skeleton & process info have been initialised 
                var skeletonCount = parseInt(skeletonCountResult[0].Count);
                var processInfoCount = parseInt(processInfoCountResult[0].Count);
                var hasSkeletonAndProcessInfo = false;
                if (skeletonCount > 0 && processInfoCount > 0) {
                    hasSkeletonAndProcessInfo = true;
                }
                    
                var combinedResults = {
                    hasEntry: hasEntryStatus,
                    isInitialised: hasSkeletonAndProcessInfo,
                    weekView: weekData,
                    monthView: monthData,
                    yearView: yearData,
                    todayProcesses: todayProcessesData,
                    monthProcesses: monthProcessesData,
                    yearProcesses: yearProcessesData,
                    averageCosts: averageCostsData
                };
                console.log("Results compiled.");
                callback(combinedResults);
            }), function (e) {
                console.log("Error: " + e);
                alert("Error: " + e);
            };
        }
    };
});