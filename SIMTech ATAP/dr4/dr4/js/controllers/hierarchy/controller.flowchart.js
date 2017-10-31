hierarchy.controller("flowchartCtrl", ['$scope', 'sharedProperties', 'FLWTYPES', '$state', 'ngDialog', function ($scope, sharedProperties, FLWTYPES, $state, ngDialog) {
    Node = function (value) {
        this.value = value;
    };

    StartNode = function (value, type) {
        Node.call(this, value);
        this.nextNode = null;
        this.type = parseInt(type);
    };
    // start node inheritance
    StartNode.prototype = Object.create(Node.prototype);
    StartNode.prototype.constructor = StartNode;
    StartNode.prototype.addNext = function (node) {
        this.nextNode = node;
    };
    StartNode.prototype.getNext = function () {
        return this.nextNode;
    };
    StartNode.prototype.getType = function () {
        return this.type;
    };

    AnswerNode = function (value) {
        Node.call(this, value);
        this.nextNode = null; //for next node
        this.prevNodes = []; //for prev nodes
    };
    // answer node inheritance

    AnswerNode.prototype = Object.create(Node.prototype);
    AnswerNode.prototype.constructor = AnswerNode;
    AnswerNode.prototype.addPrev = function (node) {
        //TODO
        this.prevNodes[this.prevNodes.length] = node;
    };
    AnswerNode.prototype.getPrevs = function () {
        //TODO
        return this.prevNodes;
    };
    AnswerNode.prototype.addNext = function (node) {
        //TODO
        this.nextNode = node;

    };
    AnswerNode.prototype.getNext = function () {
        //TODO 
        return this.nextNode;
    };

    QuestionNode = function (value, left, right) {
        Node.call(this, value);
        this.yesNode = null; // for yes node
        this.noNode = null;
        this.left = left;
        this.right = right;
        this.prevNodes = []; // could be leaf/answer
    };
    // question node inheritance

    QuestionNode.prototype = Object.create(Node.prototype);
    QuestionNode.prototype.constructor = QuestionNode;
    QuestionNode.prototype.addPrev = function (node) {
        //TODO
        this.prevNodes[this.prevNodes.length] = node;
    };
    QuestionNode.prototype.getPrevs = function () {
        //TODO: returns array
        return this.prevNodes;
    };
    QuestionNode.prototype.addYesNode = function (node) {
        //TODO
        this.yesNode = node;
    };
    QuestionNode.prototype.getYesNode = function () {
        return this.yesNode;
    };
    QuestionNode.prototype.addNoNode = function (node) {
        //TODO
        this.noNode = node;
    };
    QuestionNode.prototype.getNoNode = function () {
        return this.noNode;
    };


    saveHistory = function () {
        $scope.hist.push($scope.curNode);
    };

    saveAns = function () {
        if ($scope.curNode instanceof AnswerNode) {
            // these two nodes should not be saved as answers
            if (($scope.curNode !== notSu) && ($scope.curNode !== incineration)) {
                $scope.ansHist.push($scope.curNode.value);
            }
        }

    };
    saveRedAns = function () {
        if ($scope.curNode instanceof AnswerNode) {
            $scope.redHist.push($scope.curNode.value);
        }
    };


    $scope.reset = function () {
        $scope.curNode = $scope.startingNode;
        while ($scope.hist.length !== 0) {
            $scope.hist.pop();
        }
        while ($scope.ansHist.length !== 0) {
            $scope.ansHist.pop();
        }

        $scope.flwKeywords = "";
        $scope.hideKeywordSection = false;
        displayCurrentContent();
        displayCorrectButtons();
    };

    // to move the previous node based on saved history
    $scope.goBack = function () {
        if ($scope.curNode instanceof AnswerNode) {
            if (($scope.curNode !== notSu) && ($scope.curNode !== incineration)) {
                $scope.ansHist.pop();
            }
        }
        $scope.curNode = $scope.hist.pop();

        displayCurrentContent();
        displayCorrectButtons();
    };

    // to save the keywords used for querying the database further down the flowchart
    $scope.saveKeywords = function () {
        if ($scope.flwKeywords.trim().length !== 0) {
            $scope.flwKeywords = $scope.flwKeywords.trim();
            $scope.hideKeywordSection = true;
            
        } else {
            alert("Please input keywords");
        }
        
    };
    
    $scope.enterKeywords = function () {
        $scope.hideKeywordSection = false;
    };
    
    $scope.init = function () {

        // pointer at current node
        $scope.curNode = null;
        // history stack of traversed nodes, for backtracking
        $scope.hist = [];
        // history stack of answer nodes, for saving of answers at the end of evaluation
        $scope.ansHist = [];
        $scope.redHist = [];
        // for saving the keywords to be used to query the food waste-to-resource database in the future
        $scope.flwKeywords = "";
        $scope.displayCurNode = false;
        // for toggling the view of what to display in html based on the type of the current node 
        $scope.curDisplay = "startNodeDisplay";
        // for future potential feature where this returns positive if users choose to go directly to flowchart without going to checklist
        $scope.displayStartFrom = false;

        // build flowchart by connecting nodes
        buildTree();

        $scope.causesChecked = {
            avoidable: [],
            unavoidable: []
        };
        // for toggling between the flw keywords input part and the flowchart part
        $scope.hideKeywordSection = false;
        // getting causes checked from the sharedProperties service
        $scope.causesChecked.avoidable = sharedProperties.getCausesA();
        $scope.causesChecked.unavoidable = sharedProperties.getCausesUA();
        $scope.isNotIU = true; // is initialised in the switch cases below 
        $scope.startingNode = null;
        // for future potential feature where users might choose to bypass checklist n go directly to flowchart
        if (!sharedProperties.getAccessedChecklist()) {
            $scope.displayStartFrom = true;
        } else { // current way where uses must go checklist in order to access flowchart
            switch (sharedProperties.getFoodWaste()) {

                case FLWTYPES.EA:
                    $scope.startingNode = start1.getNext();
                    $scope.curNode = start1.getNext();
                    $scope.isNotIU = true;
                    saveRedAns();
                    break;
                case FLWTYPES.EU:
                    $scope.startingNode = start2.getNext();
                    $scope.curNode = start2.getNext();
                    $scope.flwType = FLWTYPES.EU;
                    $scope.isNotIU = true;
                    saveRedAns();
                    break;
                case FLWTYPES.IU:
                    $scope.startingNode = start3.getNext();
                    $scope.curNode = start3.getNext();
                    $scope.flwType = FLWTYPES.IU;
                    $scope.isNotIU = false;
                    break;
                default:
                    $scope.curNode = start1;
                    alert("switch case got prob!");
                    break;
            }
            displayCurrentContent();
            displayCorrectButtons();
        }
    };
    // for future potential feature where uses might choose to bypass checklist n go directly to flowchart
    $scope.startFrom = function (num) {
        switch (num) {
            case 1:
                $scope.curNode = start1.getNext();
                break;
            case 2:
                $scope.curNode = start2.getNext();
                break;
            case 3:
                $scope.curNode = start3.getNext();
                break;
            default:
                $scope.curNode = start1;
                alert("switch case got prob!!");
                break;
        }
        displayCurrentContent();
        displayCorrectButtons();
    };
    // manual construction of flowchart

    //definition of starting nodes 
    var start1 = new StartNode('Start 1 (Edible Avoidable)', 1);
    var start2 = new StartNode('Start 2 (Edible Unavoidable)', 2);
    var start3 = new StartNode('Start 3 (Inedible Unavoidable)', 3);

    // definition of question nodes
    var safeForH = new QuestionNode('Is the FLW safe for human consumption?', 'Yes', 'No');
    var desirCons = new QuestionNode('Is the FLW desirable/palatable for human consumption?', 'Yes', 'No');
    var safeForA = new QuestionNode('Is it safe for animal consumption?', 'Yes', 'No');
    var anFeedList = new QuestionNode('Does it meet the list of requirements for animal feed?', 'Yes', 'No');
    var iaEEQns = new QuestionNode('Do you want to check out available Industrial Application/ Energy Extraction solutions?', 'Yes', 'No');
    // var highOil = new QuestionNode('Does the FLW contain high oil content?');
    // var oilSep = new QuestionNode('Is the oil easily separable from the FLW? (e.g. used cooking oil/ greasy soup/ animal fats)?');
    // var moistCon = new QuestionNode('Is the moisture content ~ 60-90%?');
    // var hulls = new QuestionNode('Are they hulls of seeds/grains/fruits?');
    // var eggShells = new QuestionNode('Are they egg shells?');
    // var fruitWaste = new QuestionNode('Is it fruit waste?');
    // var dairy = new QuestionNode('Does it contain dairy products? (e.g. whey, yoghurt)');
    // var starch = new QuestionNode('Is the food high in starch?');
    // var oilCont = new QuestionNode('Is the oil content most likely >5%?');
    // var moistHigh = new QuestionNode('Is the moisture content high (>80%)?');
    // var moistMod = new QuestionNode("Is the moisture content relatively high (>50%)?");
    var disease = new QuestionNode('Does the FLW contain infectious diseases?', 'Yes', 'No');

    // definition of answer nodes
    var processOpt = new AnswerNode('Process Improvement');
    var donation = new AnswerNode('Donation');
    var equipRedesign = new AnswerNode('Equipment Redesign');
    var anFeed = new AnswerNode('Animal Feed');
    var iaEE = new AnswerNode('Industrial Application/ Energy Extraction');
    // var iaSludge = new AnswerNode('Industrial Application (Sludge Drying)');
    // var eeTrans = new AnswerNode('Industrial Application/ Energy Extraction (Transesterification)');
    // var iaBioPlastics = new AnswerNode('Industrial Application (Bio-plastics Production)');
    // var iaRubber = new AnswerNode('Industrial Application (Rubber Production)');
    // var iaSoap = new AnswerNode('Industrial Application (Soap and Cosmetics Production)');
    // var iaLactic = new AnswerNode('Industrial Application (Bio-production of Optically Pure Lactic Acid)');
    // var iaPolymersAndBut = new AnswerNode('Industrial Application (Bio-polymers) /Energy Extraction (Butanol Production)');
    // var fwte = new AnswerNode('Energy Extraction (Food Waste to Energy Biodiesel)');
    // var anaerobic = new AnswerNode('Anaerobic Digestion');
    var compost = new AnswerNode('Composting');
    var incineration = new AnswerNode('You\'ve reached the end of the recommendations list, click below to save your results.');

    //animal checklist nodes
    var notSu = new AnswerNode('Not suitable for Animal Feed');
    var edibleForH = new QuestionNode('Is it edible for humans?', 'Yes', 'No');
    
    /*** subtree nodes of animal checklist***/

    // sub tree A
    var animalPlantBasedA = new QuestionNode('Is it animal-based or plant-based?', 'Animal-based', 'Plant-based');
    var eggProd = new QuestionNode('Is it an egg product, dairy, or the rest?', 'Egg', 'Dairy');
    var procAndUn = new QuestionNode('Is it both a) processed and b) unpacked?', 'Yes', 'No');
    var specific = new AnswerNode('Animal Feed (Under specific regulations)');
    var unproAndUn = new QuestionNode('Is it both a) unprocessed and b) unpacked?', 'Yes', 'No');
    
    var singleOrMixedA = new QuestionNode('Is it a single or mixed product?', 'Mixed', 'Single');
    var reqA1 = new QuestionNode('Are the following requirements met?\n\n'
        + '- Not in contact with or containing meat, animal by-products or raw eggs\n'
        + '- Processed\n'
        + '- Unpacked/ Separable from packaging\n'
        + '- Non-catering ', 'Yes', 'No');
    var reqA2 = new QuestionNode('Are the following requirements met?\n\n'
        + '- Unpacked/ Separable from packaging\n'
        + '- Non-catering', 'Yes', 'No');

    //sub tree B
    var animalPlantBasedB = new QuestionNode('Is it animal-based or plant-based?', 'Animal-based', 'Plant-based');
    var reqB1 = new QuestionNode('Are the following requirements met?\n\n'
        + '- Is one of these: egg products, animal fats, fish oils, hydrolysed proteins, gelantine and collagen '
        + 'from non-ruminant sources, glycerine (from certain approved biodiesel plants), fishmeal '
        + '(not for same type of fish), blood products (from non-ruminant animals), dicalcium and tricalcium phosphate, '
        + 'processed animal protein from non-ruminant animals (just for fish farms)\n'
        + '- Non-catering', 'Yes', 'No');
    var singleOrMixedB = new QuestionNode('Is it a single or mixed product?', 'Mixed', 'Single');
    var nonCat = new QuestionNode('Is it non-catering waste?', 'Yes', 'No');
    var reqB2 = new QuestionNode('Are the following requirements met?\n\n'
        + '- Not in contact with or containing meat, animal by-products or raw eggs\n' +
        'Non-catering', 'Yes', 'No');

    // building of animal feed checklist
    buildSubtreeA = function () {
        animalPlantBasedA.addYesNode(eggProd);
        animalPlantBasedA.addNoNode(singleOrMixedA);
        animalPlantBasedA.addPrev(edibleForH);

        // left
        eggProd.addYesNode(procAndUn);
        eggProd.addNoNode(unproAndUn);
        eggProd.addPrev(animalPlantBasedA);
        procAndUn.addYesNode(specific);
        procAndUn.addNoNode(notSu);
        procAndUn.addPrev(eggProd);
        unproAndUn.addYesNode(anFeed);
        unproAndUn.addNoNode(notSu);
        unproAndUn.addPrev(eggProd);
        anFeed.addPrev(unproAndUn);
        specific.addPrev(procAndUn);
        notSu.addPrev(unproAndUn);
        notSu.addPrev(procAndUn);
        
        // right
        singleOrMixedA.addYesNode(reqA1);
        singleOrMixedA.addNoNode(reqA2);
        singleOrMixedA.addPrev(animalPlantBasedA);
        reqA1.addYesNode(anFeed);
        reqA1.addNoNode(notSu);
        reqA1.addPrev(singleOrMixedA);
        reqA2.addYesNode(anFeed);
        reqA2.addNoNode(notSu);
        reqA2.addPrev(singleOrMixedA);
        anFeed.addPrev(reqA1);
        anFeed.addPrev(reqA2);
        notSu.addPrev(reqA1);
        notSu.addPrev(reqA2);
    };

    buildSubtreeB = function () {
        animalPlantBasedB.addYesNode(reqB1);
        animalPlantBasedB.addNoNode(singleOrMixedB);
        animalPlantBasedB.addPrev(edibleForH);
        
        //left
        reqB1.addYesNode(anFeed);
        reqB1.addNoNode(notSu);
        reqB1.addPrev(animalPlantBasedB);
        anFeed.addPrev(reqB1);
        notSu.addPrev(reqB1);

        //right
        singleOrMixedB.addYesNode(nonCat);
        singleOrMixedB.addNoNode(reqB2);
        singleOrMixedB.addPrev(animalPlantBasedB);
        nonCat.addYesNode(anFeed);
        nonCat.addNoNode(notSu);
        nonCat.addPrev(singleOrMixedB);
        anFeed.addPrev(nonCat);
        notSu.addPrev(nonCat);
        reqB2.addYesNode(anFeed);
        reqB2.addNoNode(notSu);
        reqB2.addPrev(singleOrMixedB);
        anFeed.addPrev(reqB2);
        notSu.addPrev(reqB2);
    };

    buildFullChecklist = function () {
        // build head
        edibleForH.addYesNode(animalPlantBasedA);
        edibleForH.addNoNode(animalPlantBasedB);
        edibleForH.addPrev(safeForA);
        
        buildSubtreeA();
        buildSubtreeB();

        //link to next node
        notSu.addNext(iaEEQns);
        specific.addNext(iaEEQns);
    };

    // building of tree 
    buildTree = function () {
        // manual linking of nodes OMGGGGGGG ded
        start1.addNext(processOpt);
        processOpt.addPrev(start1);
        processOpt.addNext(safeForH);
        safeForH.addPrev(processOpt);
        safeForH.addYesNode(desirCons);
        safeForH.addNoNode(safeForA);
        desirCons.addPrev(safeForH);
        desirCons.addYesNode(donation);
        desirCons.addNoNode(safeForA);

        start2.addNext(equipRedesign);
        donation.addPrev(desirCons);
        donation.addNext(safeForA);
        equipRedesign.addPrev(start2);
        equipRedesign.addNext(safeForA);
        safeForA.addPrev(desirCons);
        safeForA.addPrev(equipRedesign);
        safeForA.addPrev(safeForH);
        safeForA.addPrev(donation);
        safeForA.addPrev(start3);
        start3.addNext(safeForA);
        safeForA.dontKnow = function () {
            // returning head of animal checklist
            return edibleForH;
        };
        //build and connect animal checklist
        buildFullChecklist();
        safeForA.addYesNode(anFeed);
        safeForA.addNoNode(iaEEQns);
        iaEEQns.addPrev(safeForA);
        //safeForA.addNoNode(highOil);
        // highOil.addPrev(safeForA);
        // highOil.addPrev(anFeed);
        // highOil.addPrev(anFeedList);
        // anFeedList.addNoNode(highOil);
        anFeed.addPrev(safeForA);
        anFeed.addNext(iaEEQns);
        iaEEQns.addPrev(anFeed);
        iaEEQns.addYesNode(iaEE);
        iaEE.addPrev(iaEEQns);
        iaEEQns.addNoNode(disease);
        disease.addPrev(iaEEQns);
        iaEE.addNext(disease);
        disease.addPrev(iaEE);
        // anFeed.addNext(highOil);
        // highOil.addYesNode(oilSep);
        // highOil.addNoNode(moistCon);
        // oilSep.addPrev(highOil);
        // moistCon.addPrev(highOil);
        // oilSep.addYesNode(eeTrans);
        // oilSep.addNoNode(moistCon);
        // eeTrans.addPrev(oilSep);
        // moistCon.addPrev(oilSep);
        // eeTrans.addNext(moistCon);
        // moistCon.addPrev(eeTrans);
        // moistCon.addYesNode(iaSludge);
        // iaSludge.addPrev(moistCon);
        // moistCon.addNoNode(hulls);
        // hulls.addPrev(moistCon);
        // iaSludge.addNext(hulls);
        // hulls.addPrev(iaSludge);
        // hulls.addYesNode(iaBioPlastics);
        // iaBioPlastics.addPrev(hulls);
        // hulls.addNoNode(eggShells);
        // eggShells.addPrev(hulls);
        // iaBioPlastics.addNext(fruitWaste);
        // fruitWaste.addPrev(iaBioPlastics);
        // eggShells.addYesNode(iaRubber);
        // iaRubber.addPrev(eggShells);
        // eggShells.addNoNode(fruitWaste);
        // fruitWaste.addPrev(eggShells);
        // iaRubber.addNext(fruitWaste);
        // fruitWaste.addPrev(iaRubber);
        // fruitWaste.addYesNode(iaSoap);
        // iaSoap.addPrev(fruitWaste);
        // fruitWaste.addNoNode(dairy);
        // dairy.addPrev(fruitWaste);
        // iaSoap.addNext(dairy);
        // dairy.addPrev(iaSoap);
        // dairy.addYesNode(iaLactic);
        // iaLactic.addPrev(dairy);
        // dairy.addNoNode(starch);
        // starch.addPrev(dairy);
        // iaLactic.addNext(starch);
        // starch.addPrev(iaLactic);
        // starch.addYesNode(iaPolymersAndBut);
        // iaPolymersAndBut.addPrev(starch);
        // starch.addNoNode(oilCont);
        // oilCont.addPrev(starch);
        // iaPolymersAndBut.addNext(oilCont);
        // oilCont.addPrev(iaPolymersAndBut);
        // oilCont.addYesNode(moistHigh);
        // moistHigh.addPrev(oilCont);
        // oilCont.addNoNode(moistMod);
        // moistMod.addPrev(oilCont);
        // moistHigh.addYesNode(fwte);
        // fwte.addPrev(moistHigh);
        // moistHigh.addNoNode(disease);
        // disease.addPrev(moistHigh);
        // moistMod.addYesNode(anaerobic);
        // anaerobic.addPrev(moistMod);
        // moistMod.addNoNode(disease);
        // disease.addPrev(moistMod);
        // fwte.addNext(disease);
        // disease.addPrev(fwte);
        disease.addYesNode(incineration);
        incineration.addPrev(disease);
        disease.addNoNode(compost);
        compost.addPrev(disease);
        compost.addNext(incineration);
        incineration.addPrev(compost);

    };

    // for updating the relevant buttons on the screen after each action by the user
    displayCorrectButtons = function () {
        $scope.otherOptions = true;
        $scope.dontKnow = false;
        $scope.theRest = false;
        $scope.displayBackButton = true;
        if ($scope.curNode === $scope.startingNode) {
            $scope.displayBackButton = false;
        }
        if ($scope.curNode instanceof AnswerNode) {
            $scope.curDisplay = "answerNodeDisplay";
            if ($scope.curNode === incineration) {
                $scope.otherOptions = false; // NOTE REFLECT IN HTML
            }
        } else if ($scope.curNode instanceof QuestionNode) {
            $scope.curDisplay = "questionNodeDisplay";
            if ($scope.curNode === safeForA) {
                $scope.dontKnow = true;
            } else if ($scope.curNode === eggProd) {
                $scope.theRest = true;
            }
            
        } else if ($scope.curNode instanceof StartNode) {
            $scope.curDisplay = "startNodeDisplay";
        } else {
            alert("not an instance of any node!");
        }
    };

    // for updating the relevant content on the screen after action by the user
    displayCurrentContent = function () {
        if ($scope.curNode === start1) {
            $scope.displayCurNode = false;
        } else {
            $scope.displayCurNode = true;
        }
    };

    // for answer nodes to move on to next question
    $scope.getToNextNode = function () {
        if ($scope.curNode.getNext() === null) {
            alert("next node is null"); // should not happen, for debugging
        } else {
            saveHistory();

            $scope.curNode = $scope.curNode.getNext();
            saveAns();
        }
        displayCurrentContent();
        displayCorrectButtons();
    };

    // for question nodes to get to yes answer nodes
    $scope.getToYesNode = function () {
        if ($scope.curNode.getYesNode() === null) {
            alert("next node is null"); // should not happen, for debugging
        } else {
            saveHistory();
            $scope.curNode = $scope.curNode.getYesNode();
            saveAns();
        }
        displayCurrentContent();
        displayCorrectButtons();
    };

    // for question nodes to get to no answer nodes
    $scope.getToNoNode = function () {
        if ($scope.curNode.getNoNode() === null) {
            alert("next node is null"); // should not happen, for debugging
        } else {
            saveHistory();
            $scope.curNode = $scope.curNode.getNoNode();
            saveAns();
        }
        displayCurrentContent();
        displayCorrectButtons();
    };

    // for aniaml feed node to get to don't know answer node
    $scope.getToDontKnow = function () {
        saveHistory();
        $scope.curNode = safeForA.dontKnow();
        saveAns();
        displayCurrentContent();
        displayCorrectButtons();
        $scope.dontKnow = false;
    };

    // for animal feed node to get to the rest answer node
    $scope.getToTheRest = function () {
        saveHistory();
        $scope.curNode = notSu;
        saveAns();
        displayCurrentContent();
        displayCorrectButtons();
        $scope.theRest = false;
    };

    // when user clicks save, this stores results in the sharedProperties service and takes them back to the base page (hotspoteval.timed.js) 
    // on that base page, the results will be stored both locally on that page and into the database
    $scope.saveEvaluation = function () {
        // if user has not reached the end of the flowchart and alr chose to save answers n go back to base page
        if ($scope.curNode !== incineration) {
            if (confirm("Saving results will take the current results and go back to the checklist page, are you sure you do not want to checkout the other options?")) {
                // if user clicks ok
                sharedProperties.setRecs($scope.redHist, $scope.ansHist);
                sharedProperties.setSave(true);
            } else {
                // if user clicks cancel
                return;
            }
        } else {
            // user has reached end of flowchart and saves, so dont need to confirm w them whether or not to save and go back to base page
            sharedProperties.setRecs($scope.redHist, $scope.ansHist);
            sharedProperties.setSave(true);
        }
        // close the dialog and head back to base page
        ngDialog.closeAll();

    };
}]);