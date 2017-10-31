var hierarchy = angular.module("hierarchy");
//let's make a startFrom filter
hierarchy.filter('startFrom', function () {
    return function (input, start) {
        start = +start; //parse to int
        return input.slice(start);
    };
});

// controller for checklist, which is the first pop up when user clicks evaluate from the base page hotspoteval.timed.js
// note that flowchart pop up opens up from within here after user clicks next in the checklist pop up instead of
// from base page, cos ngDialog unfortunately works like that
hierarchy.controller("checklistCtrl", ['$scope', '$location', 'FLWTYPES', 'sharedProperties', '$state', 'dataService', 'ngDialog', function ($scope, $location, FLWTYPES, sharedProperties, $state, dataService, ngDialog) {
    // for hiding/showing of elements
    $scope.edibleCauses = false;
    // checklist model that reflects the causes checked
    $scope.causesChecked = {
        avoidable: [],
        unavoidable: []
    };

    $scope.expandedCauses = false;

    $scope.init = function () {
        $scope.pageNum = 0; // for toggling between pages of causes

        // returns true if there is an flwtype determined by the checklist and resultingly shows the 'find recommendations' button which goes to the flowchart
        // if its false, the user has not finished evaluating the type of flwtype so shouldn't be allowed to go to the flowchart
        $scope.hasFLWType = sharedProperties.getHasFLWType();

        // retrieves the previous set of causes checked if this waste has been evaluated before, which will be stored in sharedProperties from the base page right
        // when the user clicks on the evaluate button to open the checklist
        $scope.causesChecked.avoidable = sharedProperties.getCausesA().slice();
        $scope.causesChecked.unavoidable = sharedProperties.getCausesUA().slice();
        
        // retrieves the previous flwtype determined if this waste has been evaluated before, which will be stored in sharedProperties from the base page right
        // when the user clicks on the evaluate button to open the checklist
        $scope.flwType = sharedProperties.getFoodWaste();
        console.log("flwtype: "+$scope.flwType.name);
    };
    // while evaluating, there should be no waste that is currently viewed in another popup
    $scope.wasteViewing = null;

    // set of methods used to split the list of causes in each category to only show a max of 5 on each page, to make sure popup height doesn't exceed window size
    $scope.goNextCausePage = function () {
        $scope.pageNum += 1;
    };

    $scope.itemInd = function () {
        return $scope.pageNum * 4;
    };

    $scope.goPrevCausePage = function () {
        $scope.pageNum -= 1;
    };
    // end set of methods used to split the list of causes in each category to only show a max of 5 on each page, to make sure popup height doesn't exceed window size

    // resets when user clicks reset
    $scope.reset = function () {
        sharedProperties.setFoodWaste(FLWTYPES.NOVAL);
        $scope.hasFLWType = sharedProperties.getHasFLWType();
        $scope.flwType = sharedProperties.getFoodWaste();
        $scope.causesChecked = {
            avoidable: [],
            unavoidable: []
        };
        sharedProperties.setCauses($scope.causesChecked.avoidable, $scope.causesChecked.unavoidable);
    };
   
    // route to flowchart
    // note that flowchart pop up opens up from within this checklist after user clicks next instead of
    // from base page, cos ngDialog unfortunately works like that
    $scope.goNext = function () {
        if ($scope.flwType === FLWTYPES.IU) {
            // for inedible unavoidable, there shouldn't be any causes shortlisted
            sharedProperties.setCauses([], []);
           
        } else {
            // stores the causes checked to be saved later in the base page, as well as displayed in the flowchart pop up
            sharedProperties.setCauses($scope.causesChecked.avoidable, $scope.causesChecked.unavoidable);
        }
        ngDialog.closeAll("done");

        // open the flowchart chart pop up
        ngDialog.open({
            preCloseCallback: function (value) {
                // when user closes the flowchart pop up without saving
                if (!sharedProperties.getSave()) {
                    if (confirm('Are you sure you want to close without completing? Changes will not be saved')) {
                        // if user clicks okay
                        sharedProperties.resetCausesAndRecs();
                        return true;
                    }
                    // if user clicks cancel
                    return false;
                }
                // user chose to save, return normally without confirming
                return true;
            },
            template: 'views/planning/flowchart.html',
            className: 'ngdialog-theme-default custom-width',
            controller: 'flowchartCtrl',
            disableAnimation: !!window.MSInputMethodContext && !!document.documentMode
        });

    };

    // list of causes, edit here when new causes are brainstormed
    $scope.edibleCausesList = {
        avoidable: {
            ppl: ['There is a lack of qualifications of workers',
                'There is a lack of medical examinations (e.g. workers too sick to work properly)',
                'There is no compliance with job procedures',
                'There is no compliance with manufacturing hygiene rules',
                'The product management is inadequate (e.g. excessive estimations of orders)',
                'The packaging process is inappropriate, due to humans'
            ],
            met: ["The SOP is not clearly defined",
                "The maintenance strategy is inadequate",
                "There is poor stock management",
                "There are no/not enough quality checks",
                "The SOP is inefficient",
                "The FLW is related to overproduction"
            ]
        },

        unavoidable: {
            mac: ["There are machine failures",
                "The conditions of repair are poor",
                "The machine is too old",
                "There is a lack of supply of equipment/utilities required",
                "There are power blackouts",
                "The packaging process is inappropriate, due to machines",
                "The machines are inefficient",
                "Inadequte technology is used"
            ],
            met: ["The loss is related to the cleaning procedure",
                "The storage system is not appropriate (e.g. temperature & humidity not optimal, storage space too small, etc.)",
                "The process chain (i.e. the sequence of processes) is inefficient (e.g. machines are not aligned with each other)"
            ],
            mat: ["Inadequate quality of supplied raw materials",
                "The packaging material is not appropriate (e.g. poor quality, inappropriate size/shape, etc.)",
                "Inadequate quality of auxiliary materials (e.g. materials used for cleaning, repair, maintenance, etc.)"
            ]
        }


    };

    // to determine if edible food waste is avoidable or unavoidable based on number of avoidable/unavoidable causes checked
    $scope.compareScores = function () {
        if ($scope.causesChecked.unavoidable.length > $scope.causesChecked.avoidable.length) {
            $scope.flwType = FLWTYPES.EU;
            sharedProperties.setFoodWaste(FLWTYPES.EU);
            sharedProperties.setAccessedChecklist(true);
            $scope.hasFLWType = sharedProperties.getHasFLWType();

        } else {
            $scope.flwType = FLWTYPES.EA;
            sharedProperties.setFoodWaste(FLWTYPES.EA);
            sharedProperties.setAccessedChecklist(true);
            $scope.hasFLWType = sharedProperties.getHasFLWType();

        }

    };

    // to open the possibility of determining if edible food waste is avoidable or unavoidable by expanding causes
    // section
    $scope.executeEdible = function () {
        $scope.edibleCauses = true;
        sharedProperties.setFoodWaste(FLWTYPES.NOVAL);
        $scope.flwType = FLWTYPES.NOVAL;
        $scope.hasFLWType = sharedProperties.getHasFLWType();
    };

    // to immediately conclude that food waste type is inedible unavoidable

    $scope.executeInedible = function () {
        $scope.edibleCauses = false;
        $scope.flwType = FLWTYPES.IU;
        sharedProperties.setFoodWaste(FLWTYPES.IU);
        sharedProperties.setAccessedChecklist(true);
        $scope.hasFLWType = sharedProperties.getHasFLWType();

    };

    $scope.back = function () {
        $scope.edibleCauses = false;
        sharedProperties.setFoodWaste(FLWTYPES.NOVAL);
        $scope.hasFLWType = sharedProperties.getHasFLWType();
        $scope.flwType = sharedProperties.getFoodWaste();
    };
    // for toggling the various causes categories
    $scope.toggleCausesType = function (type) {
        $scope.type = type;
        $scope.pageNum = 0;
        $scope.expandedCauses = true;
    };
}]);