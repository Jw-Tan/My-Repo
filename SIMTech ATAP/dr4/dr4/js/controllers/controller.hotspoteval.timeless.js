var hierarchy = angular.module("hierarchy");
hierarchy.controller("hotspotevaltimelessCtrl", ['$scope', '$location', 'FLWTYPES', 'sharedProperties', '$state', 'dataService', 'ngDialog', function ($scope, $location, FLWTYPES, sharedProperties, $state, dataService, ngDialog) {
    $scope.init = function () {
        //if (!sharedProperties.getHotspots().length) {
        //	$scope.hotspotsAndWastes = dataService.getHotspotsAndWastes();
        //	$scope.hotspots = convertIntoHotspots($scope.hotspotsAndWastes);
        //	sharedProperties.setHotspots($scope.hotspots);
        //} else {
        //	$scope.hotspots = sharedProperties.getHotspots();
        //}
        sharedProperties.setTimeless(true);
        $scope.tempHotspotName = null;
        $scope.hotspotSelected = null;
        $scope.tempWasteNames = [new tempWasteObject()];
        $scope.currentEvaluatingWaste = sharedProperties.getCurrentEvaluatingWaste();
        $scope.timelessHotspots = sharedProperties.getTimelessHotspots();

        //console.log(JSON.stringify(dataService.getHotspotsAndWastes(), null, 4));
        //console.log(dataService.getHotspotsAndWastes()[0].waste[0]);
    };
    $scope.currentEvaluatingWaste = sharedProperties.getCurrentEvaluatingWaste();

    $scope.wasteViewing = null;
    var checklistID = null;
    $scope.viewCauses = function (waste) {
        $scope.wasteViewing = waste;
        ngDialog.open({
            templateUrl: "views/causes.html",
            scope: $scope,
            disableAnimation: !!window.MSInputMethodContext && !!document.documentMode
        });

    };

    $scope.closeDialog = function () {
        ngDialog.closeAll();
    };

    $scope.$on('ngDialog.closing', function () {
        $scope.currentEvaluatingWaste = sharedProperties.getCurrentEvaluatingWaste();
        $scope.timelessHotspots = sharedProperties.getTimelessHotspots();
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
    });

    $scope.viewRecommendations = function (waste) {
        $scope.wasteViewing = waste;
        ngDialog.open({
            templateUrl: "views/recommendations.html",
            scope: $scope,
            disableAnimation: !!window.MSInputMethodContext && !!document.documentMode
        });
    };


    $scope.evaluate = function (waste) {
        $scope.currentEvaluatingWaste = waste;
        sharedProperties.setCurrentEvaluatingWaste(waste);
        sharedProperties.setTimelessHotspots($scope.timelessHotspots);
        ngDialog.open({
            preCloseCallback: function (value) {
                if (value !== "done") {
                    if (confirm('Are you sure you want to close without completing? Changes will not be saved')) {
                        sharedProperties.setCurrentEvaluatingWaste(null);
                        return true;
                    }
                    return false;
                }
                return true;
            },
            templateUrl: "views/checklist.html",
            controller: "checklistCtrl",
            scope: $scope,
            disableAnimation: !!window.MSInputMethodContext && !!document.documentMode
        });
    };
    isDupHotspotName = function (newHotspotName) {
        $scope.timelessHotspots.forEach(function (item) {
            if (newHotspotName === item.name) {
                return true;
            }
        });
        return false;
    };
    validateInputs = function (hotspotName, wastes) {
        //alert("year: " + year + "prodOP: " + prodOP + "waste: " + waste + "diverted: " + diverted);
        $scope.invalidHname = false;
        $scope.dupHname = false;
        $scope.invalidWname = false;
        $scope.dupWname = false;

        if ($scope.tempHotspotName === "" || $scope.tempHotspotName === null
            || $scope.tempHotspotName === undefined) {
            $scope.invalidHname = true;
            return false;
        }
        if (isDupHotspotName($scope.tempHotspotName)) {
            return false;
        }
        if (hasInvalidWasteNames($scope.tempWasteNames)) {
            return false;
        }
        if (hasDupWasteNames($scope.tempWasteNames)) {
            return false;
        }
        return true;
    };

    resetWasteValidity = function (wasteNames) {
        wasteNames.forEach(function (item) {
            item.isInvalidName = false;
            item.isDup = false;
        });
    };
    $scope.addNewHotspotObject = function (hotspotName, wastes) {
        if (!validateInputs(hotspotName, wastes)) {
            return;
        }
        resetWasteValidity($scope.tempWasteNames);
        $scope.timelessHotspots.push(new hotspotObject(hotspotName, wastes));
        clearInputFields();
    };

    clearInputFields = function () {
        $scope.tempWasteNames = [new tempWasteObject()];
        $scope.tempHotspotName = null;
    };

    // an object inside tempWasteNames array
    tempWasteObject = function () {
        this.name = null;
        this.isDup = false;
        this.isInvalidName = false;
    };

    $scope.addMoreWasteObjects = function () {
        $scope.tempWasteNames.push(new tempWasteObject());
    };
    $scope.deleteTempWasteObject = function (waste) {
        var index = $scope.tempWasteNames.indexOf(waste);
        $scope.tempWasteNames.splice(index, 1);
    };
    $scope.deleteWasteObject = function (waste, hotspot) {
        var hotspotIndex = $scope.timelessHotspots.indexOf(hotspot);
        var wasteIndex = $scope.timelessHotspots[hotspotIndex].wasteArray.indexOf(waste);
        $scope.timelessHotspots[hotspotIndex].wasteArray.splice(wasteIndex, 1);
        // if the hotspot doesn't contain anymore wastes, then delete it as well
        if (!$scope.timelessHotspots[hotspotIndex].wasteArray.length) {
            $scope.timelessHotspots.splice(hotspotIndex, 1);
            
        }
        sharedProperties.setTimelessHotspots($scope.timelessHotspots);
    };

    $scope.edit = function (hotspot) {
        $scope.editMsg = true;
        $scope.editMode = true;
        $scope.tempHotspotName = hotspot.name;
        $scope.tempWasteNames = convertIntoTempWasteNames(hotspot.wasteArray);
        $scope.hotspotSelected = hotspot;
    };

    convertIntoTempWasteNames = function (wasteObjects) {
        var names = [];
        wasteObjects.forEach(function (waste) {
            var temp = new tempWasteObject();
            temp.name = waste.name;
            names.push(temp);
        });
        return names;
    };
    $scope.editHotspotObject = function (hotspotName, wastes) {
        if (!validateInputs(hotspotName, wastes)) {
            return;
        }
        $scope.hotspotSelected.editInfo(hotspotName, wastes);
        resetWasteValidity($scope.tempWasteNames);
        clearInputFields();
        $scope.editMsg = false;
        $scope.editMode = false;
    };

    $scope.deleteHotspotObject = function (hotspot) {
        var hotspotIndex = $scope.timelessHotspots.indexOf(hotspot);
        $scope.timelessHotspots.splice(hotspotIndex, 1);
    };

    hasInvalidWasteNames = function (tempWasteNames) {
        var hasInvalidNames = false;
        tempWasteNames.forEach(function (item) {
            if (item.name === "" || item.name === null || item.name === undefined) {
                item.isInvalidName = true;
                hasInvalidNames = true;
            }
        });
        return hasInvalidNames;
    };

    findWithAttr = function (array, wasteName, start) {
        for (var i = start; i < array.length; i += 1) {
            if (array[i].name.toUpperCase() === wasteName.toUpperCase()) {
                return i;
            }
        }
        return -1;
    };


    hasDupWasteNames = function (tempWasteNames) {
        var tempInd = 0;
        var hasDups = false;
        tempWasteNames.forEach(function (item, index) {
            tempInd = findWithAttr(tempWasteNames, item.name, index + 1);
            if (tempInd > -1) {
                item.isDup = true;
                tempWasteNames[tempInd].isDup = true;
                hasDups = true;
            }
        });
        return hasDups;
    };
    hotspotObject = function (hotspotName, wastes) {
        this.name = hotspotName;
        this.wasteArray = convertWasteToArray(wastes);
        this.editInfo = function (name, wastes) {
            this.name = name;
            this.wasteArray = convertWasteToArray(wastes);
        };
    };

    convertWasteToArray = function (wastes) {
        var wasteArray = [];
        for (var w = 0; w < wastes.length; w++) {
            wasteArray.push(new wasteObject(wastes[w].name));
        }
        return wasteArray;
    };

    wasteObject = function (wasteName) {
        this.name = wasteName;
        this.evaluated = "No";
        this.causes = {
            avoidable: [],
            unavoidable: []
        };
        this.rec = {
            reduction: [],
            diversion: []
        };
    };

}]);