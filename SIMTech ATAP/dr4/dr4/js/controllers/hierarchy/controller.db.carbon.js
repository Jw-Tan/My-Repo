﻿var hierarchy = angular.module("hierarchy");

// controls the carbon footprint panel in the dashboard
hierarchy.controller('carbonFPCtrl', ['$scope', 'dataService', function ($scope, dataService) {
  
    $scope.init = function () {
        $scope.timeUnit = "today";

        // tooltip definition of the panel's purpose
        $scope.definition = "This reflects the total amount of greenhouse gases produced if the total waste generated " + $scope.timeUnit + " was incinerated, expressed in equivalent tons of carbon dioxide (CO2).";

        // Callback function to be passed into dataService.getDashboardData()
        // in order to receive values from an asynchronous procedure.
        callback = function (results) {
            convert(results.weekView, results.monthView, results.yearView);
            $scope.carbonFP = Math.round($scope.dayWasteAmt * 1.2);
        };
        dataService.getDashboardData(callback);
    };

    // grab the wasteAmt for today, this month, and this year
    convert = function (day, month, year) {
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
    };

    // toggling between daily, monthly, and weekly views
    // note: 1.2 is the carbon emissions factor for CO2 emissions generated by incinerating 1kg of waste
    $scope.$on('toggleTimeframe', function (event, args) {
        // handle toggle event here
        switch (args) {
            case 'daily':
                console.log('carbon: daily!');
                $scope.carbonFP = Math.round($scope.dayWasteAmt * 1.2);
                $scope.timeUnit = "today";
                break;
            case 'monthly':
                console.log('carbon: monthly!');
                $scope.carbonFP = Math.round($scope.monthWasteAmt * 1.2);
                $scope.timeUnit = "over this month";
                break;
            case 'yearly':
                console.log('carbon: yearly!');
                $scope.carbonFP = Math.round($scope.yearWasteAmt * 1.2);
                $scope.timeUnit = "over this year";
                break;
            default:
                console.log('carbon: error - argument not valid!' + args);
                break;

        }
        $scope.definition = "This reflects the total amount of greenhouse gases produced if the total waste generated " + $scope.timeUnit + " was incinerated, expressed in equivalent tons of carbon dioxide (CO2).";


        // refresh page to show new stuff that angular doesn't update properly
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
    });
}]);
