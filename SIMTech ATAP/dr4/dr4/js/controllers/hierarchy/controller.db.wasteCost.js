var hierarchy = angular.module("hierarchy");

// controls the waste cost panel in the dashboard
hierarchy.controller('wasteCostCtrl', ['$scope', 'dataService', function ($scope, dataService) {


    $scope.init = function () {
        $scope.timeUnit = "today";
        $scope.title3 = "Cost of Waste";
        $scope.definition = "This reflects the net cost of waste produced "+$scope.timeUnit+", which is inclusive of both material cost and the cost of disposal.";
        // Callback function to be passed into dataService.getDashboardData()
        // in order to receive values from an asynchronous procedure.
        callback = function (results) {
            convertToLatestTimeUnit(results.weekView, results.monthView, results.yearView);
            if (results.averageCosts.productionCost === -1) {
                $scope.displayUninitialised = true;
            } else {
                $scope.displayUninitialised = false;
            }
            $scope.netUnitCost = results.averageCosts.disposalCost + results.averageCosts.productionCost;
            $scope.wasteCost = Math.round($scope.dayWasteAmt * $scope.netUnitCost);
            // if number has more than 5 digits, change to K as unit to prevent overflow on panel
            if ($scope.wasteCost > 10000) {
                $scope.wasteCost = Math.round($scope.wasteCost / 1000) + " K";
            }
        };
        dataService.getDashboardData(callback);
    };

    // get wasteAmt for today, this month and this year
    convertToLatestTimeUnit = function (day, month, year) {
        var today = new Date();
        $scope.dayWasteAmt = 0;
        $scope.monthWasteAmt = 0;
        $scope.yearWasteAmt = 0;
        day.forEach(function (o) {
            if (o.day === today.getDate()) {
                $scope.dayWasteAmt = o.wasteAmount;
            }
        });
        month.forEach(function (o) {
            if (o.month === today.getMonth()) {
                $scope.monthWasteAmt = o.wasteAmount;
            }
        });
        year.forEach(function (o) {
            if (o.year === today.getFullYear()) {
                $scope.yearWasteAmt = o.wasteAmount;
            }
        });

        console.log("in cost: " + $scope.dayWasteAmt);
    };

    // toggle between daily, monthly and yearly views
    $scope.$on('toggleTimeframe', function (event, args) {
        // handle toggle event here
        switch (args) {
            case 'daily':
                console.log('cost: daily!');
                $scope.wasteCost = Math.round($scope.dayWasteAmt * $scope.netUnitCost);
                if ($scope.wasteCost > 10000) {
                    $scope.wasteCost = Math.round($scope.wasteCost / 1000) + " K";
                }
                $scope.timeUnit = "today";
                break;
            case 'monthly':
                console.log('cost: monthly!');
                $scope.wasteCost = Math.round($scope.monthWasteAmt * $scope.netUnitCost);
                $scope.timeUnit = "this month";
                if ($scope.wasteCost > 10000) {
                    $scope.wasteCost = Math.round($scope.wasteCost / 1000) + " K";
                }
                break;
            case 'yearly':
                console.log('cost: yearly!');
                $scope.wasteCost = Math.round($scope.yearWasteAmt * $scope.netUnitCost);
                $scope.timeUnit = "this year";
                if ($scope.wasteCost > 10000) {
                    $scope.wasteCost = Math.round($scope.wasteCost / 1000) + " K";
                }
                break;
            default:
                console.log('cost: error - argument not valid!' + args);
                break;
        }
        $scope.definition = "This reflects the net cost of waste produced " + $scope.timeUnit + ", which is inclusive of both material cost and the cost of disposal.";

        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
    });
}]);
