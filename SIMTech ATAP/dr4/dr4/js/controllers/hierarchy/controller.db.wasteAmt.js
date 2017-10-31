var hierarchy = angular.module("hierarchy");

// controls the waste amount bar chart panel in the dashboard
hierarchy.controller('wasteAmtCtrl', ['$scope', 'dataService', function ($scope, dataService) {


    
    $scope.init = function () {
        // Callback function to be passed into dataService.getDashboardData()
        // in order to receive values from an asynchronous procedure.
        callback = function (results) {

            convertArrays(results.weekView, results.monthView, results.yearView);
            var today = new Date();
            results.weekView.forEach(function (o, ind) {
                if (o.day === today.getDate()) {
                    $scope.dayInd = ind;
                }
            });
            results.monthView.forEach(function (o, ind) {
                if (o.month === today.getMonth()) {
                    $scope.monthInd = ind;
                }
            });
            results.yearView.forEach(function (o, ind) {
                if (o.year === today.getFullYear()) {
                    $scope.yearInd = ind;
                }
            });
            // time period enum for toggling time period
            $scope.TimeUnit = {
                daily: { name: "daily", length: "7", horizon: "week", cat: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], title: 'Daily' },
                monthly: { name: "monthly", length: "12", horizon: "year", cat: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], title: 'Monthly' },
                yearly: { name: "yearly", length: "10", horizon: "decade", cat: fillYearlyCategories(results.yearView), title: 'Yearly' }
            };

            // initialisation
            $scope.wasteAmtPanelWidth = $("#wasteAmtPanel").width() - 50;
            $scope.wasteAmtArray = $scope.weekWaste; // store in this
            $scope.chosenTime = $scope.TimeUnit.daily;

            $scope.currentInd = $scope.dayInd;
            // info icon tooltip
            $scope.definition = "This shows the " + $scope.chosenTime.name + " amount of waste summed across all hotspots over this " + $scope.chosenTime.horizon + ".";

            createChart();
            $(document).bind("kendo:skinChange", createChart);
            console.log("arrays: " + JSON.stringify($scope.weekWaste, null, 4));
            console.log(JSON.stringify($scope.yearWaste, null, 4));
            console.log(JSON.stringify($scope.decadeWaste, null, 4));


        };
        dataService.getDashboardData(callback);
       
    };

    //{ day: int, month: int, year int, wasteAmount: float }

    // extract out purely the waste amounts, to produce 3 arrays each containing a series of waste amounts based on the specified time unit
    convertArrays = function (week, month, year) {
        $scope.weekWaste = convertArray(week);
        $scope.yearWaste = convertArray(month);
        $scope.decadeWaste = convertArray(year);
    };

    convertArray = function (array) {
        var arr = [];
        array.forEach(function(o) {
            arr.push(o.wasteAmount);
        });
        return arr;
    };

    fillYearlyCategories = function (yearsArray) {
        var cat = [];
        var start = yearsArray[0].year;
        yearsArray.forEach(function (o) {
            cat.push(o.year);
        });
        console.log(JSON.stringify(cat));
        return cat;
    };
    
    $scope.$on('toggleTimeframe', function (event, args) {
        // handle toggle event here
        switch (args) {
            case 'daily':
                console.log('graph: daily!');
                $scope.chosenTime = $scope.TimeUnit.daily;
                $scope.wasteAmtArray = $scope.weekWaste;
                $scope.currentInd = $scope.dayInd;
                break;
            case 'monthly':
                console.log('graph: monthly!');
                $scope.chosenTime = $scope.TimeUnit.monthly;
                $scope.wasteAmtArray = $scope.yearWaste;
                $scope.currentInd = $scope.monthInd;
                break;
            case 'yearly':
                console.log('graph: yearly!');
                $scope.chosenTime = $scope.TimeUnit.yearly;
                $scope.wasteAmtArray = $scope.decadeWaste;
                $scope.currentInd = $scope.yearInd;
                break;
            default:
                console.log('graph: error - argument not valid!' + args);
                break;
        }
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }

        createChart();
        $scope.definition = "This shows the " + $scope.chosenTime.name + " amount of waste summed across all hotspots over this " + $scope.chosenTime.horizon + ".";

        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
    });

    // create bar chart
    function createChart() {
        $("#chart").kendoChart({
            legend: {
                visible: false
            },
            chartArea: {
                width: $scope.wasteAmtPanelWidth
            },
            valueAxis: {
                min: 0,
                title: {
                    text: $scope.chosenTime.title + " Waste Amount (kg)"
                }
            },
            series: [{
                name: $scope.chosenTime.title + " Waste Amount (kg)",
                data: $scope.wasteAmtArray,
                color: function (point) {
                    if (point.index === ($scope.currentInd)) {
                        return "#66d8ff";
                    }

                    else {

                        return "#e5f8ff";

                    }
                }
            }],
            categoryAxis: {
                categories: $scope.chosenTime.cat
            },
            tooltip: {
                visible: true,
                format: "{0}%",
                template: "#= category #: #= value # kg"
            }
        });
        console.log("finished creating chart");
    }

    //$(document).ready(createChart);
    $(document).ready(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
    //$(document).bind("kendo:skinChange", createChart);
   
}]);
