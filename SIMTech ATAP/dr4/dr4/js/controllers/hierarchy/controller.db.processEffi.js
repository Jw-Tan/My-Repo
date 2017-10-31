var hierarchy = angular.module("hierarchy");
// controller of process efficiency percentage charts in the dashboard
hierarchy.controller('processEffCtrl', ['$scope', 'dataService', function ($scope, dataService) {
 
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
            $scope.todayProcesses = results.todayProcesses;
            $scope.monthProcesses = results.monthProcesses;
            $scope.yearProcesses = results.yearProcesses;
            convertToInt($scope.todayProcesses, $scope.monthProcesses, $scope.yearProcesses);

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
            $scope.selectedTimeArray = $scope.todayProcesses; // store in this
            $scope.chosenTime = $scope.TimeUnit.daily;
            // info icon tooltip
            $scope.definition = "The shows the top 3 most inefficient processes (output/ input amount) " +
            "and their aggregated waste amounts " + $scope.chosenTime.name + ".";
            createHotspots();

        };
        dataService.getDashboardData(callback);

    };

    // convert the waste amount and efficiency percentage to integers
    function convertToInt(day, month, year) {
        day.forEach(function (o) {
            o.efficiencyPercent = Math.round(o.efficiencyPercent);
            o.waste = Math.round(o.waste);
        });
        month.forEach(function (o) {
            o.efficiencyPercent = Math.round(o.efficiencyPercent);
            o.waste = Math.round(o.waste);
        });
        year.forEach(function (o) {
            o.efficiencyPercent = Math.round(o.efficiencyPercent);
            o.waste = Math.round(o.waste);
        });

    }
    // create the percentage charts
    function createHotspots() {
        for (var i=1; i<=$scope.selectedTimeArray.length; i++) {
            $("#processEff"+i).percircle({
                progressBarColor: "#CC3366",
                percent: $scope.selectedTimeArray[i-1].efficiencyPercent
            });
        }
    }
    // used when updating the percentage charts when user toggles between the different time views
    function changeCircle(name, num) {
        $(name).percircle({ text: '' });
        $(name).percircle({
            text: "",
            progressBarColor: "#CC3366",
            percent: $scope.selectedTimeArray[num].efficiencyPercent
        });
    }
    function redrawHotspots() {
        for (var i=1; i<= $scope.selectedTimeArray.length; i++) {
            changeCircle("#processEff" + i, i-1);
        }
    }

    onChange = function () {
        $scope.definition = "The shows the top 3 most inefficient processes (output/ input amount) " +
        "and their aggregated waste amounts " + $scope.chosenTime.name + ".";
    };

    // toggle between the daily, monthly and yearly views in the dashboard
    $scope.$on('toggleTimeframe', function (event, args) {
        // handle toggle event here
        switch (args) {
            case 'daily':
                console.log('piechart: daily!');
                $scope.chosenTime = $scope.TimeUnit.daily;
                $scope.selectedTimeArray = $scope.todayProcesses;
                break;
            case 'monthly':
                console.log('piechart: monthly!');
                $scope.chosenTime = $scope.TimeUnit.monthly;
                $scope.selectedTimeArray = $scope.monthProcesses;
                break;
            case 'yearly':
                console.log('piechart: yearly!');
                $scope.chosenTime = $scope.TimeUnit.yearly;
                $scope.selectedTimeArray = $scope.yearProcesses;
                break;
            default:
                console.log('piechart: error - argument not valid!' + args);
                break;
        }

        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
        redrawHotspots();
        onChange();
        
    });
}]);
