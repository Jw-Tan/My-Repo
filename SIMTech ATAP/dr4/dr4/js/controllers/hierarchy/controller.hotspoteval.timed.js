var hierarchy = angular.module("hierarchy");
hierarchy.controller("hotspotevaltimedCtrl", ['$scope', '$rootScope', '$location', 'FLWTYPES', 'sharedProperties', '$state', 'dataService', 'ngDialog', function ($scope, $rootScope, $location, FLWTYPES, sharedProperties, $state, dataService, ngDialog) {
    const piePanelWidth = $("#piePanel").width();

    $scope.init = function () {
        
        callback = function () {
            /**
            ===================================
            Process object structure:
            var processObject = {
                name, 
                id, 
                wasteAmount, 
                waste: [] <-- array of waste objects
            }
            =====================================
            Waste object structure:
            var wasteObject = {
                name, 
                amount, 
                evaluated, <-- boolean for checking it has been evaluated before
                newName, <-- added using proprocessWasteNames method below 
                causes: {
                    avoidable: [], <-- string array
                    unavoidable: []
                },
                rec: {
                    reduction: [],
                    diversion: []
                }
            }
            ======================================
            **/
            // get the processes and their corrresponding wastes (sorted from largest to smallest in terms of amount of waste)
            $scope.processes = dataService.getProcessesAndWastes().processes;
            // checks if the waste is normalised or aggregated
            $scope.isNormalised = dataService.getProcessesAndWastes().isNormalised;
            // the first $scope.numOfHotspots processes in the $scope.processes array are the hotspots
            $scope.numOfHotspots = dataService.getProcessesAndWastes().numOfHotspots;

            // for deciding whether to draw the processes
            if ($scope.processes.length === 0) {
                $scope.noProcesses = true;
            } else {
                $scope.noProcesses = false;
            }
            // trims the names to be able to fit the pie chart later
            preprocessWasteNames($scope.processes);
            // save in sharedProperties service
            sharedProperties.setProcesses($scope.processes);
            $scope.processesType = $scope.isNormalised ? "Normalised Amount/ kg" : "Total Amount/ kg";
            // create bar chart of processes
            createChart();
            $(document).bind("kendo:skinChange", createChart);
            $(document).ready(function () {
                $('[data-toggle="tooltip"]').tooltip();
            });
            // will be assigned a value when user clicks on one of the processes of the bar chart
            $scope.selectedProcess = null;
            // will be assigned a value when user clicks on one of the wastes of the selected process' pie chart
            $scope.selectedWaste = null;
            isNullWasteTooltips();
            //console.log(JSON.stringify($scope.processes, null, 4));

        };
        dataService.getEvaluationResults(callback);

        
    };


    /**** methods for creation of the graph displaying processes and pie displaying wastes of the selected processes **********/


    // for graph of processes

    function createChart() {
        //alert("creating chart!");
        $("#chart").kendoChart({
            legend: {
                position: "bottom",
                visible: true
            },
            title: {
                text: "Hotspots and Processes (" + $scope.processesType + ")",
                color: "black"
            },
            valueAxis: {
                min: 0,
                title: {
                    text: "Waste Amount (kg)"
                }
            },
            // legend square's colour to denote dark blue bars are the hotspots
            seriesColors: ["#66d8ff"],
            series: [{
                // shown in legend
                name: "Hotspots (Based on " + $scope.processesType + ")",
                categoryField: "id",
                data: $scope.processes,
                color: function (point) {
                    // returns dark blue for hotspots and light blue for non-hotspots
                    if (point.index < ($scope.numOfHotspots)) {
                        return "#66d8ff";
                    }

                    else {

                        return "#e5f8ff";

                    }
                },
                field: "wasteAmount"
            }],
            categoryAxis: {
                line: {
                    visible: true
                },
                labels: {
                    template: "##"
                },
                majorGridLines: {
                    visible: true
                }
                
            },
            seriesClick: onSeriesClickProcess,
            tooltip: {
                visible: true,
                format: "{0}%",
                template: "#= dataItem.name #: #= value # kg"
            }
        });
    }

    // helper method for getting the actual process of the bar the user clicks in the processes bar chart
    // used in the method below - onSeriesClickProcess
    getProcessItem = function (cat) {
        var item = null;
        $scope.processes.forEach(function (e) {
            if (cat === e.id) {
                item = e;
            }
        });
        
        return item;
    };

    // function used in the createChart() function, to select the correct process when user clicks
    // on a particular bar in the processes bar chart
    function onSeriesClickProcess(e) {
        $scope.selectedProcess = getProcessItem(e.category);
        $scope.selectedWaste = null;
        isNullWasteTooltips();
        createPie();
        $(document).bind("kendo:skinChange", createPie);

        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }

    }

    // end graph of processes

    /***************************************************/

    // for pie of wastes of selected process

    /**  
    To format the name of the waste such that the total width of the name will
    not exceed 20 characters, or it'll be moved to a new line using \n.
    This is so that when displaying the pie chart, the names of the wastes will not 
    get cut off on the panel.
    */

    preprocessWasteNames = function (processes) {
        processes.forEach(function (process) {
            process.waste.forEach(function (w) {
                var stringArray = w.name.split(" ");
                var newName = "";
                var concatenatedWords = "";

                stringArray.forEach(function (word) {
                    // if the total length of the current phrase is less than 20 characters, add it
                    if (concatenatedWords.length + word.length < 30) {
                        concatenatedWords += word + " ";
                    } else {
                        newName += concatenatedWords + "\n";
                        concatenatedWords = word + " ";

                    }
                });
                newName += concatenatedWords;
                w.newName = newName;
            });
        });
    };

    // function for creating the pie chart of the wastes in the selected process

    function createPie() {
        $("#pie").kendoChart({
            legend: {
                visible: false
            },
            title: {
                text: "Wastes from " + $scope.selectedProcess.name
            },
            chartArea: {
                width: piePanelWidth
            },
            series: [{
                type: "pie",
                startAngle: 150,
                name: "Wastes",
                data: $scope.selectedProcess.waste,
                field: "amount",
                categoryField: "newName",
                overlay: {
                    gradient: "roundedBevel"
                }
            }],
            seriesDefaults: {
                labels: {
                    visible: true,
                    background: "transparent",
                    template: "#= category #: \n #= value# kg",
                    distance: 25
                }
            },
            seriesClick: onSeriesClickWaste,
            tooltip: {
                visible: true,
                format: "{0}%",
                template: "#= category #: #= value # kg"
            }
        });
        // get reference to the chart widget
        var chart = $("#pie").data("kendoChart");
        // set series.padding via the chart options
        chart.options.series[0].padding = 100;
        // redraw the chart
        chart.redraw();
    }

    // helper method for getting the actual waste of the slice the user clicks in the wastes pie chart
    // used in the method below - onSeriesClickWaste

    getWasteItem = function (cat) {
        var item = null;
        $scope.selectedProcess.waste.forEach(function (e) {
            if (cat === e.newName) {
                item = e;
            }
        });

        return item;
    };

    // function used in the createPie() function, to select the correct waste when user clicks
    // on a particular slice in the wastes bar chart

    function onSeriesClickWaste(e) {
        $scope.selectedWaste = getWasteItem(e.category);

        if ($scope.selectedWaste.evaluated === "No") {
            //alert("selectedWaste.evaluated == No");
            isNotWasteEvaluatedTooltips();

        } else { // evaluated
            //alert("selectedWaste.evaluated == Yes");

            isWasteEvaluatedTooltips();
        }
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
    }
    

    /**** end methods for creation of the graph displaying hotspots and pie displaying wastes of the selected hotspots **********/



    /**************** tooltips to show on the 3 buttons: evaluate, causes and recommendations *****************/

    // note that the 3 buttons will not show if no process is selected (i.e. clicked on by user in the processes bar chart) yet 

    // when no waste has been selected yet (i.e. user hasn't clicked on a slice in the wastes pie chart of the current selected process
    isNullWasteTooltips = function () {
        $scope.evalButtonTooltip = "Please select a waste to evaluate";
        $scope.causeButtonTooltip = "Please select a waste to view its causes";
        $scope.recButtonTooltip = "Please select a waste to view its recommendations";
    };

    // when a waste is selected and its alr been evaluated before
    isWasteEvaluatedTooltips = function () {
        $scope.evalButtonTooltip = "Click to re-evaluate";
        $scope.causeButtonTooltip = "Click to view causes";
        $scope.recButtonTooltip = "Click to view recommendations";
    };

    // when a waste is selected but has not been evaluated before
    isNotWasteEvaluatedTooltips = function () {
        $scope.evalButtonTooltip = "Click to evaluate";
        $scope.causeButtonTooltip = "Please evaluate the chosen waste first";
        $scope.recButtonTooltip = "Please evaluate the chosen waste first";
    };

    // for closing any of the pop up windows opened using any of the 3 buttons
    $scope.closeDialog = function () {
        ngDialog.closeAll();
    };

    /************************ method for saving to database *************************/

    setEvalCallback = function (status) {
        // status is boolean, true if results were added to database successfully
        // otherwise false
        if (status) {
            // do something, info user, etc
            console.log("evaluation results saved.");
        } else {
            // alert user etc
            alert("Error, evaluation results not saved.");
        }
    };
    // use this & the above to save after evaluation is done for a waste
    //dataService.setEvaluationResults(myWaste, setEvalCallback);

    /********************* end method for saving to database ************************/

    // when a pop up window is closed (i.e. ngDialog.closed event is issued), check if user had
    // chosen to save results when in the flowchart pop up, and if so, save results
    $scope.$on('ngDialog.closed', function () {

        if (sharedProperties.getSave()) {
            $scope.currentEvaluatingWaste.evaluated = "Yes";
            // getting temp results stored so far from this current round of evaluation in sharedProperties service
            $scope.currentEvaluatingWaste.causes.avoidable = sharedProperties.getCausesA();
            $scope.currentEvaluatingWaste.causes.unavoidable = sharedProperties.getCausesUA();
            $scope.currentEvaluatingWaste.rec.reduction = sharedProperties.getRecsRed();
            $scope.currentEvaluatingWaste.rec.diversion = sharedProperties.getRecsDiv();
            // saving to database
            dataService.setEvaluationResults($scope.currentEvaluatingWaste, setEvalCallback);

            // saved, reset and ready for next round of evaluation
            sharedProperties.setSave(false);
            sharedProperties.resetCausesAndRecs();
            $scope.selectedWaste = $scope.currentEvaluatingWaste;
        } else {
            //alert("on hotspot eval, not saving anything");
        }

        if ($scope.selectedWaste.evaluated === "No") {
            isNotWasteEvaluatedTooltips();

        } else { // evaluated

            isWasteEvaluatedTooltips();
        }
        if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
            $scope.$apply();
        }
    });
    
    /************************ For viewing and opening dialogs (i.e. pop ups) ************************/

    // setting the current waste viewed
    $scope.wasteViewing = null;

    $scope.viewCauses = function (waste) {
        $scope.wasteViewing = waste;

        ngDialog.open({
            templateUrl: "views/planning/causes.html",
            className: 'ngdialog-theme-default custom-width',
            scope: $scope,
            disableAnimation: !!window.MSInputMethodContext && !!document.documentMode
        });

    };
    $scope.viewRecommendations = function (waste) {
        $scope.wasteViewing = waste;
        ngDialog.open({
            templateUrl: "views/planning/recommendations.html",
            className: 'ngdialog-theme-default custom-width',
            scope: $scope,
            disableAnimation: !!window.MSInputMethodContext && !!document.documentMode
        });
    };


    $scope.evaluate = function (waste) {
        $scope.currentEvaluatingWaste = waste;
        // if its being reevaluated, show previous options
        if (waste.evaluated === "Yes") {
            sharedProperties.setCauses(waste.causes.avoidable, waste.causes.unavoidable);
            sharedProperties.setRecs(waste.rec.reduction, waste.rec.diversion);
        }
        $rootScope.theme = 'ngdialog-theme-plain custom-width';

        ngDialog.open({
            preCloseCallback: function (value) {
                if (value !== "done") {
                    if (confirm('Are you sure you want to close without completing? Changes will not be saved')) {
                        sharedProperties.resetCausesAndRecs();
                        return true;
                    }
                    return false;
                }
                return true;
            },
            templateUrl: "views/planning/checklist.html",
            controller: "checklistCtrl",
            className: 'ngdialog-theme-default custom-width',
            scope: $scope,
            disableAnimation: !!window.MSInputMethodContext && !!document.documentMode
        });
    };
    /******************* End for viewing and opening dialogs *****************************/

}]);