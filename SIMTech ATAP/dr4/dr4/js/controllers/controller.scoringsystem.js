hierarchy.controller("scoringsystemCtrl", ['$scope', 'FLWTYPES', 'sharedProperties', function ($scope, FLWTYPES, sharedProperties) {

    $scope.init = function () {
        $scope.wasteObjects = []; // array to contain annual waste info objects
        $scope.wasteObjects = sharedProperties.getWasteObjects();
        $scope.years = sharedProperties.getYearsArray(); // array of year numbers
        $scope.selectedYears = sharedProperties.getSelectedYears(); // array of year numbers that have been selected before
        /*** NOTE: need to change when want to store data in account in long run***/

        // temp vars to store the new added waste info
        $scope.tempYear = null;
        $scope.tempProdOP = null;
        $scope.tempWaste = null;
        $scope.tempInc = null;
        $scope.wasteSelected = null;
    };
    $scope.reset = function () {
        $scope.wasteObjects = [];
        sharedProperties.setWasteObjects($scope.wasteObjects);
        $scope.selectedYears = [];
        sharedProperties.setSelectedYears($scope.selectedYears);
        // temp vars to store the new added waste info
        $scope.tempYear = null;
        $scope.tempProdOP = null;
        $scope.tempWaste = null;
        $scope.tempInc = null;
        $scope.wasteSelected = null;
    };
    // empty object constructor
    wastePropObject = function (year, prodOP, waste, diverted) {
        this.year = year;
        this.prodOP = prodOP;
        this.waste = waste;
        this.diverted = diverted;
        this.getScore = function () {
            return (this.waste / this.prodOP);
        };
        this.reductionScore = null;
        this.showReductionScore = false;
        this.incScore = function () {
            return (this.diverted / this.waste) * 100;
        };
        if (diverted === null) {
            this.showIncScore = false;
        } else {
            this.showIncScore = true;
        }
        this.editInfo = function (year, prodOP, waste, diverted) {
            this.year = year;
            this.prodOP = prodOP;
            this.waste = waste;
            this.diverted = diverted;
            if (diverted === null) {
                this.showIncScore = false;
            } else {
                this.showIncScore = true;
            }
        };

    };

    // helper method to clear the on screen temporary storage variables
    clearInputFields = function () {
        $scope.tempYear = null;
        $scope.tempProdOP = null;
        $scope.tempWaste = null;
        $scope.tempInc = null;
    };

    $scope.editWastePropObject = function (year, prodOP, waste, diverted, wasteObj) {
        if (!validateInputs(year, prodOP, waste, diverted)) {
            return;
        }
        wasteObj.editInfo(year, prodOP, waste, diverted);
        updateSelected();
        $scope.wasteObjects.sort(function (a, b) { return b.year - a.year; });
        updateReductionScores();
        $scope.editMode = false;
        clearInputFields();
    };

    updateReductionScores = function () {
        var len = $scope.wasteObjects.length;
        for (var i = 0; i < len - 1; i++) {
            // if the years are consecutive between any two adjacent waste objects in the sorted wasteObjects array, can get the reduction score for
            // the later object
            if ($scope.wasteObjects[i + 1].year === ($scope.wasteObjects[i].year - 1)) {
                $scope.wasteObjects[i].reductionScore = compareScores($scope.wasteObjects[i + 1], $scope.wasteObjects[i]);
                $scope.wasteObjects[i].showReductionScore = true;
            } else {
                $scope.wasteObjects[i].showReductionScore = false;

            }

        }
    };
    validateInputs = function (year, prodOP, waste, diverted) {
        //alert("year: " + year + "prodOP: " + prodOP + "waste: " + waste + "diverted: " + diverted);
        $scope.invalidP = false;
        $scope.invalidW = false;
        $scope.wasteMore = false;
        $scope.invalidYear = false;
        $scope.editMsg = false;
        $scope.invalidD = false;
        $scope.divertedMore = false;
        if (year === null || year < 0) {
            $scope.invalidYear = true;
            return false;
        }
        if (prodOP <= 0) {
            $scope.invalidP = true;
            return false;
        }
        if (waste < 0) {
            $scope.invalidW = true;
            return false;
        }

        if (waste > prodOP) {
            $scope.wasteMore = true;
            return false;
        }
        if (diverted !== null) {
            if (diverted < 0) {
                $scope.invalidD = true;
                return false;
            }
            if (diverted > waste) {
                $scope.divertedMore = true;
                return false;
            }
        }
        return true;
    };

    // for adding the validated waste object to the waste objects array
    $scope.addNewWastePropObject = function (year, prodOP, waste, diverted) {
        if (!validateInputs(year, prodOP, waste, diverted)) {
            return;
        }
        $scope.wasteObjects.push(new wastePropObject(year, prodOP, waste, diverted));
        updateSelected();
        $scope.wasteObjects.sort(function (a, b) { return b.year - a.year; });
        updateReductionScores();
        clearInputFields();
    };
    $scope.inputWastePropInfo = function () {
        $scope.listOfWasteReductionInputs = true;
    };
    // inner function to compare scores
    compareScores = function (yr1, yr2) {
        var comparison = ((yr2.getScore() - yr1.getScore()) / yr1.getScore()) * 100;
        return comparison;
    };
    $scope.delete = function (wasteObj) {
        var index = $scope.wasteObjects.indexOf(wasteObj);
        $scope.wasteObjects.splice(index, 1);
        updateSelected();
        updateReductionScores();
    };
    $scope.edit = function (wasteObj) {
        $scope.editMsg = true;
        $scope.editMode = true;
        $scope.tempYear = wasteObj.year;
        $scope.tempProdOP = wasteObj.prodOP;
        $scope.tempWaste = wasteObj.waste;
        $scope.tempInc = wasteObj.diverted;
        $scope.wasteSelected = wasteObj;
    };

    // for toggling waste reduction score section
    $scope.inputWasteReductionSection = false;
    $scope.toggleWasteReductionScoreSection = function () {
        $scope.inputWasteReductionSection = !$scope.inputWasteReductionSection;

    };
    $scope.toggleDiversionScoreSection = function () {
        $scope.inputDiversionSection = !$scope.inputDiversionSection;
    };
    var curYear = new Date().getFullYear();

    // for filtering out taken years in years array to make year selection more intuitive for user
    $scope.optionsFilter = function (option) {
        // has not been selected before, therefore can show
        if ($scope.selectedYears.indexOf(option) === -1) {
            return true;
        }
        return false;
    };

    // for update the selected years array after user selecs a year
    updateSelected = function () {
        var len = $scope.wasteObjects.length;
        //alert("length = " + len);
        $scope.selectedYears = [];
        for (var i = 0; i < len; i++) {
            //alert("selected year = " + $scope.wasteObjects[i].year);
            $scope.selectedYears.push($scope.wasteObjects[i].year);
        }

    };
}]);