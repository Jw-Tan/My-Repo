var hotspot = angular.module("hotspot");
hotspot.controller("hotspotCtrl", function ($scope, dataService, hotspotService, $http) {

    var nameOfMonths = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];

    // Callback function to proceed with showing hotspots after hotspots have been identified
    hotspotCallback = function () {
        $scope.processes = hotspotService.getGatheredProcesses();
        $scope.identifiedProcesses = hotspotService.getIdentifiedProcesses();
        $scope.numHotspots = $scope.identifiedProcesses.length;
        $scope.totalWasteAmount = hotspotService.getTotalWasteAmount();
        $scope.currentPercent = hotspotService.getCurrentPercent();
        $scope.resultString = hotspotService.getResultString();
        $scope.chartData = prepareChartData($scope.processes.slice(0));
        $scope.data.showResults = true; // after everything done
        //$scope.drawChart(); // function to draw Pareto Chart via its directive
        createChart();
        $(document).bind("kendo:skinChange", createChart);
        dataService.setProcessesAndWastes($scope.processes, $scope.identifiedProcesses.length,
                                          $scope.data.normalise);
    };

    // Function called by the button in wasteHotspots.html to begin hotspot analysis.
    $scope.beginHotspots = function () {
        var selectedMonth = $scope.monthsData[$scope.monthsNamedData.indexOf($scope.data.selectedMonthNamed)];
        // gets hotspotService to find hotspot based on the chosen time frame
        hotspotService.prepareHotspotData($scope.data.selectedTimeFrame,
                                          $scope.data.selectedYear, selectedMonth,
                                          $scope.data.normalise, hotspotCallback);
    };

    // Function used in wasteHotspots.html to format how the total waste amount is shown.
    $scope.showTotalWeight = function () {
        if ($scope.totalWasteAmount % 1 === 0) { // if there are no decimal places
            return $scope.totalWasteAmount;
        } else {
            return $scope.totalWasteAmount.toFixed(2); // otherwise, round off to 2 decimal places
        }
    };

    // This function is to prepare data for drawing the Pareto Chart using the d3 library.
    // The current version of the app uses kendo instead, and the d3 function to draw is commented out.
    // This code is kept for refernce, and can be removed.
    prepareChartData = function (data) {
        var currentCumulative = 0;

        // Sort by amount in descending order
        data.sort(function (a, b) { return b.wasteAmount - a.wasteAmount; });

        // Update cumulative amount & rounded % for each data object, and append them
        for (i = 0; i < data.length; i++) {
            currentCumulative += data[i]["wasteAmount"];
            data[i]["CumulativeAmount"] = currentCumulative;
            data[i]["CumulativePercentage"] = (data[i]["CumulativeAmount"] / $scope.totalWasteAmount * 100).toFixed(2);
        }

        // if number of processes > 30, group 31st onwards as 1 process called "Others"
        if (data.length > 30) {
            var combinedProcess = {
                name: "Others",
                wasteAmount: 0,
                percent: 0,
                CumulativeAmount: 0,
                CumulativePercentage: 0,
                id: "31++"
            };
            while (data.length > 30) { // keep popping the last process from data array
                // and combine its value with combinedProcess object
                var lastProcess = data.pop();
                combinedProcess.wasteAmount += lastProcess.wasteAmount;
                combinedProcess.percent += lastProcess.percent;
                combinedProcess.CumulativeAmount += lastProcess.CumulativeAmount;
            }
            combinedProcess.CumulativePercentage = "100.00";
            data.push(combinedProcess); // finally, add this "Others" back
        }
        return data;
    };

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
                    console.log("Added timeframe month: " + month.toString() + " " + year.toString());
                }
                if ($scope.yearsData.indexOf(year) < 0) {
                    $scope.yearsData.push(year);
                    console.log("Added timeframe year: " + year);
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
            showResults: false,
            normalise: false
        };
        $scope.processes = []; // array to hold processes that produce waste
        $scope.identifiedProcesses = [];
        $scope.totalWasteAmount = 0;
        $scope.resultString;
        $scope.chartData;
    };

    function createChart() {
        //alert("creating chart!");
        $("#processChart").kendoChart({
            legend: {
                position: "bottom",
                visible: true
            },
            title: {
                text: "Hotspots and Processes (" + ($scope.data.normalise? "Normalised": "Aggregated") + ")",
                color: "black"
            },
            valueAxis: {
                min: 0,
                title: {
                    text: "Waste Amount (kg)"
                }
            },
            seriesColors: ["#66d8ff"],
            series: [{
                name: "Hotspots (Based on " + ($scope.data.normalise ? "Normalised Amount" : "Total Amount") + ")",
                data: $scope.chartData,
                color: function (point) {
                    if (point.index < ($scope.numHotspots)) {
                        return "#66d8ff";
                    }

                    else {

                        return "#e5f8ff";

                    }
                },
                field: "wasteAmount"
            }],
            categoryAxis: {
                categories: [],
                line: {
                    visible: true
                },
                majorGridLines: {
                    visible: true
                }

            },
            tooltip: {
                visible: true,
                format: "{0}%",
                template: "#= dataItem.name #: #= value # kg"
            }
        });
    }

    // Get timeframe data pulled from database entries
    $scope.status = "fetching";
    getTimeframe();
});