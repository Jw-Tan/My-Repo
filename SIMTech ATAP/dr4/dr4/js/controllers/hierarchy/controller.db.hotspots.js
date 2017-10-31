var hierarchy = angular.module("hierarchy");

// controller of hotspots panels (both normalised and aggregated) in the dashboard
hierarchy.controller('hotspotsDBCtrl', ['$scope', 'dataService', function ($scope, dataService) {


    //$scope.todayProcesses is an array containing process information based on data that exists
    //   in database that matches today's date. This is for the top 3 inefficient usage.
    //Number of objects in the array = total number of processes recorded today (if any).
    //Format for each is:
    //{ processName: string, input: float, output: float, waste: float, efficiencyPercent : float }
    //    efficiencyPercent is calculated by output / input * 100
    //    The array is returned already sorted based on this efficiencyPercent in ascending order.
    //    The same applies to $scope.monthProcesses and $scope.yearProcesses.

    // Callback function to be passed into dataService.getDashboardData()
    // in order to receive values from an asynchronous procedure.


    $scope.init = function () {
        // Callback function to be passed into dataService.getDashboardData()
        // in order to receive values from an asynchronous procedure.
        callback = function (results) {

            // aggregated
            $scope.todayProcessesA = results.todayProcesses.slice();
            // normalised
            $scope.todayProcessesN = results.todayProcesses.slice();

            $scope.monthProcessesA = results.monthProcesses.slice();
            $scope.monthProcessesN = results.monthProcesses.slice();

            $scope.yearProcessesA = results.yearProcesses.slice();
            $scope.yearProcessesN = results.yearProcesses.slice();

            convertToAggregated([$scope.todayProcessesA, $scope.monthProcessesA, $scope.yearProcessesA]);
            convertToNormalised([$scope.todayProcessesN, $scope.monthProcessesN, $scope.yearProcessesN]);

            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var today = new Date();
            var curMonth = months[today.getMonth()];
            var curYear = today.getFullYear();
            // time period enum for toggling time period
            $scope.TimeUnit = {
                daily: { name: "today", title: "Today" },
                monthly: { name: "in the present month", title: curMonth },
                yearly: { name: " in the present year", title: curYear }
            };
                   
            // initialisation
            $scope.selectedTimeArrayA = $scope.todayProcessesA;
            $scope.selectedTimeArrayN = $scope.todayProcessesN;
            $scope.chosenTime = $scope.TimeUnit.daily;

            // info icon tooltips
            $scope.aggregated = "The shows the top 3 hotspots based on total amount (i.e. aggregated) " + $scope.chosenTime.name + ".",
            $scope.normalised = "The shows the top 3 hotspots based on waste per unit output (i.e. normalised) " + $scope.chosenTime.name + ".";
               
        };

        dataService.getDashboardData(callback);
        $(document).ready(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

    };
    // sort according to highest aggregated amount, and convert to int
    function convertToAggregated(arr) {
        arr.forEach(function (o) {
            o.sort(function (a, b) { return b.waste - a.waste; });
        });
        arr.forEach(function (o) {
            o.forEach(function (e) {
                e.waste = Math.round(e.waste);
            });
        });

    }

    // sort according to highest normalised amount, and convert into 3 d.p.
    function convertToNormalised(arr) {
        arr.forEach(function (o) {
            o.sort(function (a, b) { return (b.waste / b.output) - (a.waste / a.output);});
        });
        arr.forEach(function (o) {
            o.forEach(function (e) {
                e.wasteIntensity = Number((e.waste / e.output).toFixed(3));
            });
        });
    }

    // toggling between daily, motnhly and yearly views
    $scope.$on('toggleTimeframe', function (event, args) {
        // handle toggle event here
        switch (args) {
            case 'daily':
                console.log('piechart: daily!');
                $scope.chosenTime = $scope.TimeUnit.daily;
                $scope.selectedTimeArrayA = $scope.yesterdayProcessesA;
                $scope.selectedTimeArrayN = $scope.yesterdayProcessesN;

                break;
            case 'monthly':
                console.log('piechart: monthly!');
                $scope.chosenTime = $scope.TimeUnit.monthly;
                $scope.selectedTimeArrayA = $scope.monthProcessesA;
                $scope.selectedTimeArrayN = $scope.monthProcessesN;

                break;
            case 'yearly':
                console.log('piechart: yearly!');
                $scope.chosenTime = $scope.TimeUnit.yearly;
                $scope.selectedTimeArrayA = $scope.yearProcessesA;
                $scope.selectedTimeArrayN = $scope.yearProcessesN;

                break;
            default:
                console.log('piechart: error - argument not valid!' + args);
                break;
        }

        // info icon tooltips
        $scope.aggregated = "The shows the top 3 hotspots based on total amount (i.e. aggregated) " + $scope.chosenTime.name + ".";
        $scope.normalised = "The shows the top 3 hotspots based on waste per unit output (i.e. normalised) " + $scope.chosenTime.name + ".";

        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
       
    });
}]);
