// controls the dashboard
app.controller('MainCtrl', ['$scope', '$rootScope', '$interval', 'dataService', function ($scope, $rootScope, $interval, dataService) {
	this.projectBoldName = 'App';
	this.projectName = 'Name';
    this.userName = 'Example user';
    this.headerText = 'Dashboard';
    
    $scope.init = function () {
        $scope.States = {
            checkingStatus: { name: "checking status" },
            initialised: { name: "initialised but has no entries in database" },
            hasEntry: { name: "is initialised and has entries" },
            uninitialised: {name: "uninitialised"}
        };
        $scope.state = $scope.States.checkingStatus;
        callback = function (results) {
            if (results.isInitialised) {
                $scope.state = $scope.States.initialised;
                if (results.hasEntry) {
                    $scope.state = $scope.States.hasEntry;
                }
            } else {
                $scope.state = $scope.States.uninitialised;
            }
        };
        dataService.getDashboardData(callback);
        $scope.timeUnit = "daily";
        $scope.descriptionText = 'Welcome! Below shows the ' + $scope.timeUnit + ' waste collection results.';
    };
   
    function updateTime() {
        $scope.today = new Date();
    }
    this.toggleTimeframe = function (time) {
        $rootScope.$broadcast('toggleTimeframe', time);
        
        updateDescriptionText(time);
    };

    updateDescriptionText = function (time) {
        $scope.timeUnit = time;
        
        

    $scope.descriptionText = 'Welcome! Below shows the '+$scope.timeUnit+' waste collection results.';
    if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
    };
   

    updateTime();
    $interval(function () { updateTime(); }, 60 * 1000);
}]);



