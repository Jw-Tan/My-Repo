/**
 * NEUBOARD - Responsive Admin Theme
 * Copyright 2014 Authentic Goods Co. http://authenticgoods.co
 *
 * TABLE OF CONTENTS
 * Use @ along with function name to search for the directive.
 *
 *  @pageTitle - Page Title Directive for page title name
 *  @toggleLeftSidebar - Left Sidebar Directive to toggle sidebar navigation
 *  @toggleProfile - Show/Hide Profile View
 *  @toggleRightSidebar - Right Sidebar Directive to toggle sidebar navigation
 *  @navToggleSub - Directive to toggle sub-menu down
 *
 */
/*
 * @pageTitle - Page Title Directive for page title name
 */
function pageTitle($rootScope, $timeout) {
    return {
        link: function (scope, element) {
            var listener = function (event, toState, toParams, fromState, fromParams) {
                var title = 'NeuBoard - Responsive Admin Theme';
                if (toState.data && toState.data.pageTitle) title = 'NeuBoard | ' + toState.data.pageTitle;
                $timeout(function () {
                    element.text(title);
                });
            };
            $rootScope.$on('$stateChangeStart', listener);
        }
    };
}

/*
 * @toggleLeftSidebar - Left Sidebar Directive to toggle sidebar navigation
 */
function toggleLeftSidebar() {
    return {
        restrict: 'A',
        template: '<button ng-click="toggleLeft()" class="sidebar-toggle" id="toggle-left"><i class="fa fa-bars"></i></button>',
        controller: function($scope, $element) {
            $scope.toggleLeft = function () {
                ($(window).width() > 768) ? $('#main-wrapper').toggleClass('sidebar-mini') : $('#main-wrapper').toggleClass('sidebar-opened');
            };
        }
    };
}


/*
 * @toggleProfile - Show/Hide Profile View
 */
function toggleProfile() {
    return {
        restrict: 'A',
        template: '<button ng-click="toggleProfile()" type="button" class="btn btn-default" id="toggle-profile"><i class="icon-user"></i></button>',
        controller: function($scope, $element) {
            $scope.toggleProfile = function () {
                $('.sidebar-profile').slideToggle();
            };
        }
    };
}

/*
 * @toggleRightSidebar - Right Sidebar Directive to toggle sidebar navigation
 */
function toggleRightSidebar() {
    return {
        restrict: 'A',
        template: '<button ng-click="toggleRight()" class="sidebar-toggle" id="toggle-right"><i class="fa fa-indent"></i></button>',
        controller: function($scope, $element) {
            $scope.toggleRight = function () {
                $('#sidebar-right').toggleClass("show");
                $("#toggle-right .fa").toggleClass("fa-indent fa-dedent");
            };
        }
    };
}

/**
 * @navToggleSub - Directive to toggle sub-menu down
 */
function navToggleSub() {
    return {
        restrict: 'A',
        link: function(scope, element) {
            element.navgoco({
                caretHtml: false,
                accordion: true
            });
        }
    };
}

/*
 * Pass functions to module
 */
angular
    .module('neuboard')
    .directive('pageTitle', pageTitle)
    .directive('toggleLeftSidebar', toggleLeftSidebar)
    .directive('toggleProfile', toggleProfile)
    .directive('toggleRightSidebar', toggleRightSidebar)
    .directive('navToggleSub', navToggleSub);

/*
 * Directive for hotspot controller to draw process chart
 */

// This directive draws the chart using the d3 library.
// The current version of the app uses kendo instead, and the d3 function to draw is commented out.
// This code is kept for refernce, and can be removed.
angular
    .module("hotspot")
    .directive("paretoChart", function ($window) {
        return {
            restrict: "EA",
            template: "<svg width='920' height='500'></svg>",
            link: function (scope, elem, attrs) {
                var processData;
                var d3 = $window.d3;
                var rawSvg = elem.find("svg");
                var svg = d3.select(rawSvg[0]);

                // Set dimensions
                var h = 400;
                var w = 860;
                var padding = 30;
                var xScale, xAxis,
                    yHist, yCumu,
                    yAxis, yAxis2,
                    percentLine,
                    pointsForDottedLine, guideDotted,
                    tip;

                setChartParameters = function () {
                    d3.selectAll("svg > *").remove();

                    console.log("drawing chart");
                    processData = scope.chartData;

                    // Axes and scales
                    xScale = d3.scale.ordinal().rangeRoundBands([0, w], 0.05);
                    xScale.domain(processData.map(function (d) { return d.id; }));

                    yHist = d3.scale.linear()
                              .domain([0, d3.max(processData, function (d) { return d.wasteAmount; })])
                              .range([h, 0]);

                    yCumu = d3.scale.linear().domain([0, 100]).range([h, 0]);

                    xAxis = d3.svg.axis()
                              .scale(xScale)
                              .orient("bottom");

                    yAxis = d3.svg.axis()
                              .scale(yHist)
                              .orient("left");

                    yAxis2 = d3.svg.axis()
                               .scale(yCumu)
                               .orient("right");

                    // Cumulative % line. x is translated by rangeBand / 2 to
                    // make the line match with center of each bar.
                    percentLine = d3.svg.line()
                                    //.x(function (d) { return xScale(d.name) + (xScale.rangeBand() / 2); })
                                    .x(function (d) { return xScale(d.id) + (xScale.rangeBand() / 2); })
                                    .y(function (d) { return yCumu(d.CumulativePercentage); })
                                    .interpolate("cardinal");

                    // Dotted line to show last hotspot
                    guideDotted = d3.svg.line()
                                    .x(function (d) { return d.x; })
                                    .y(function (d) { return d.y; });

                    tip = d3.tip()
                            .attr('class', 'd3-tip')
                            .html(function (d) {
                                var tooltipText = "Process Name: " + d.name + "<br />"
                                                  + "Waste: " + d.wasteAmount + " kg<br />"
                                                  + "Proportion: " + d.percent.toFixed(2) + "%";

                                // if this process is a hotspot, add additional label
                                if (d.id <= scope.identifiedProcesses.length && d.name !== "Others") {
                                    // exclude the combined "Others" column
                                    tooltipText += "<br /><span style='color:red'>Hotspot</span>";
                                }
                                return tooltipText;
                            });

                    tip.offset(function (d) {
                        if (d.id === "1" && processData.length > 1) {
                            // when there are more than 1 processes
                            // shift the tooltip of the first bar to keep it in view
                            //return [-10, 50];
                            return [-10, xScale.rangeBand() / 2];
                        } else {
                            return [-10, 0];
                        }
                    });
                };

                // Function to assign different colour to the bars, depending on if the bar is a hotspot.
                getBarColour = function (id) {
                    if (parseInt(id) <= scope.identifiedProcesses.length) {
                        return "darkred";
                    } else {
                        return "steelblue";
                    }
                };

                scope.drawChart = function () {
                    setChartParameters();

                    // For dotted line to show which are the hotspots, only drawn if there are any hotspots.
                    // This is drawn before the bars so that the bar's body will be drawn over it.
                    if (scope.identifiedProcesses.length > 0) {
                        // From right axis til the last hotspot, then down towards x-axis
                        pointsForDottedLine = [{ "x": w - padding, "y": yCumu(scope.currentPercent) },
                                               { "x": xScale(scope.identifiedProcesses.length), "y": yCumu(scope.currentPercent) },
                                               { "x": xScale(scope.identifiedProcesses.length), "y": yCumu(0) }];
                        // Draw dotted line
                        svg.append("path")
                           .datum(pointsForDottedLine)
                           .attr("d", guideDotted)
                           .attr("class", "line")
                           .attr("stroke", "black")
                           .style("stroke-dasharray", ("5, 5"))
                           .attr("transform", "translate(" + (padding + xScale.rangeBand() / 2) + "," + padding + ")");
                    }

                    svg.call(tip); // for mouseover tooltip

                    // Draw histogram
                    var bar = svg.selectAll(".bar")
                            .data(processData)
                            .enter().append("g")
                            .attr("class", "bar"); // this uses the style settings defined in the class "bar"

                    bar.append("rect")
                    //.attr("x", function (d) { return xScale(d.name); })
                    .attr("x", function (d) { return xScale(d.id); })
                    .attr("width", xScale.rangeBand())
                    .attr("y", function (d) { return yHist(d.wasteAmount); })
                    .attr("height", function (d) { return h - yHist(d.wasteAmount); })
                    .attr("transform", "translate(" + padding + "," + padding + ")")
                    .attr("fill", function (d) { return getBarColour(d.id); })
                    .on("mouseover", tip.show)
                    .on("mouseout", tip.hide);

                    // Draw cumulative % line.
                    // Translate by padding to allow full visibility
                    svg.append("path")
                       .datum(processData)
                       .attr("d", percentLine)
                       .attr("class", "line")
                       .attr("stroke", "red")
                       .attr("transform", "translate(" + padding + "," + padding + ")");

                    // Add the cumulative percentage points to the line
                    svg.selectAll("dot")
                       .data(processData)
                       .enter().append("circle")
                       .attr("r", 3.5)
                       //.attr("cx", function (d) { return xScale(d.name) + (xScale.rangeBand() / 2); })
                       .attr("cx", function (d) { return xScale(d.id) + (xScale.rangeBand() / 2); })
                       .attr("cy", function (d) { return yCumu(d.CumulativePercentage); })
                       .attr("transform", "translate(" + padding + "," + padding + ")");

                    /*
                        Add the % text to each point. Transate the numbers along 
                        x-axis because the text anchor is to the left of first char.
                        Translate along y-axis to move text above dot.
                    */
                    svg.selectAll(".myPercentText")
                       .data(processData)
                       .enter().append("text")
                       .attr("class", "myPercentText")
                       .attr("text-anchor", "middle")
                       //.attr("x", function (d) { return xScale(d.name) + (xScale.rangeBand() / 2); })
                       .attr("x", function (d) { return xScale(d.id) + (xScale.rangeBand() / 2); })
                       .attr("y", function (d) { return yCumu(d.CumulativePercentage) - 10; })
                       .attr("dx", ".71em")
                       .attr("dy", ".35em")
                       .text(function (d) { return d.CumulativePercentage + "%"; })
                       .attr("transform", "translate(" + padding + "," + padding + ")");

                    // Draw x-axis
                    svg.append("g")
                       .attr("class", "x axis")
                       .attr("transform", "translate(" + padding + "," + (h + padding) + ")")
                       .call(xAxis)
                       .append("text")
                       .attr("x", 460 - padding)
                       .attr("y", 30)
                       .style("text-anchor", "middle")
                       .text("Process IDs");

                    // Draw left y-axis
                    svg.append("g")
                       .attr("class", "y axis")
                       .attr("transform", "translate(" + padding + "," + padding + ")")
                       .call(yAxis)
                       .append("text")
                       //.attr("transform", "rotate(-90)") // rotate & remove the translate line for vertical title
                       .attr("y", 6)
                       .attr("dy", ".71em")
                       .style("text-anchor", "end")
                       .text("Waste Amount (kg)")
                       .attr("transform", "translate(65,-32)");

                    // Draw right y-axis
                    svg.append("g")
                       .attr("class", "y axis")
                       .attr("transform", "translate(" + (w + padding) + "," + padding + ")")
                       .call(yAxis2)
                       .append("text")
                       //.attr("transform", "rotate(-90)")
                       .attr("y", 4)
                       .attr("dy", "-.71em")
                       .style("text-anchor", "end")
                       .text("Cumulative %")
                       .attr("transform", "translate(25,-15)");
                };
            }
        };
    });
app.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});