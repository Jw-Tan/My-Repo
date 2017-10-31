function config($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/index");
    $stateProvider
        .state('index', {
            url: "/index",
            templateUrl: "views/index.html",
            data: { pageTitle: 'index' }
        })
        .state('initialisation', {
            abstract: true,
            url: "/initialisation",
            templateUrl: "views/common.html"
        })
        .state('initialisation.initialisation', {
            url: "/initialisation",
            templateUrl: "views/initialisation/initialisation.html",
            //controller: "datainputCtrl",
            data: { pageTitle: 'Initialisation' }
        })
        .state('data', {
            abstract: true,
            url: "/data",
            templateUrl: "views/common.html"
        })
        .state('data.entry', {
            url: "/entry",
            templateUrl: "views/data/entry.html",
            //controller: "datainputCtrl",
            data: { pageTitle: 'Entry' }
        })
        .state('data.edit', {
            url: "/edit",
            templateUrl: "views/data/edit.html",
            //controller: "datainputCtrl",
            data: { pageTitle: 'Edit' }
        })
        .state('analysis', {
            abstract: true,
            url: "/analysis",
            templateUrl: "views/common.html"
        })
        .state('analysis.wasteOverview', {
            url: "/wasteOverview",
            templateUrl: "views/analysis/wasteOverview.html",
            //controller: "datainputCtrl",
            data: { pageTitle: 'Waste Overview' }
        })
        .state('analysis.wasteIntensity', {
            url: "/wasteIntensity",
            templateUrl: "views/analysis/wasteIntensity.html",
            //controller: "datainputCtrl",
            data: { pageTitle: 'Waste Intensity' }
        })
        .state('analysis.wasteHotspots', {
            url: "/wasteHotspots",
            templateUrl: "views/analysis/wasteHotspots.html",
            //controller: "datainputCtrl",
            data: { pageTitle: 'Waste Hotspots' }
        })
        .state('planning', {
            abstract: true,
            url: "/planning",
            templateUrl: "views/common.html"
        })
        .state('planning.measuresRec', {
            url: "/measuresRec",
            templateUrl: "views/planning/measuresRec.html",
            controller: "hotspotevaltimedCtrl",
            data: { pageTitle: 'Measures Recommendations' }
        })
        .state('planning.industrialSym', {
            url: "/industrialSym",
            templateUrl: "views/planning/industrialSym.html",
            //controller: "datainputCtrl",
            data: { pageTitle: 'Industrial Symbiosis' }
        })
        .state('pages', {
            abstract: true,
            url: "/pages",
            templateUrl: "views/common.html"
        })
        .state('pages.blank_page', {
            url: "/blank_page",
            templateUrl: "views/blank-page.html",
            data: { pageTitle: 'Blank page' }
        })
         .state('pages.blank_page2', {
            url: "/blank_page2",
            templateUrl: "views/blank-page2.html",
            data: { pageTitle: 'Another blank page' }
         })
    .state('pages.datainput', {
        url: "/datainput",
        templateUrl: "views/datainput.html",
        controller: "datainputCtrl",
        data: { pageTitle: 'Data Input' }
    })
         .state('pages.hotspot', {
             url: "/hotspot",
             templateUrl: "views/hotspot.html",
             controller: "hotspotCtrl",
             data: { pageTitle: 'Hotspot Analysis' }
         })
         .state('pages.normalisation', {
             url: "/normalisation",
             templateUrl: "views/normalisation.html",
             controller: "normalisationCtrl",
             data: { pageTitle: 'Normalisation' }
         })
        .state('pages.hotspoteval', {
            url: "/hotspoteval",
            templateUrl: "views/hotspoteval.html",
            controller: "hotspotevalCtrl",
            data: { pageTitle: 'Hotspots Evaluation'}
        })
        .state('pages.hotspoteval.timed', {
            url: "/timed",
            templateUrl: "views/timed.html",
            controller: "hotspotevaltimedCtrl",
            data: { pageTitle: 'Hotspots Timed' }
        })
        .state('pages.hotspoteval.timeless', {
            url: "/timeless",
            templateUrl: "views/timeless.html",
            controller: "hotspotevaltimelessCtrl",
            data: {pageTitle: 'Hotspots Timeless'}
        })
         .state('pages.scoringsystem', {
             url: "/scoringsystem",
             templateUrl: "views/scoringsystem.html",
             controller: "scoringsystemCtrl",
             data: { pageTitle: 'Scoring System' }
         });
}
angular
    .module('neuboard')
    .config(config)
    .run(function ($rootScope, $state) {
        $rootScope.$state = $state;

        $rootScope.$on('$viewContentLoaded',
            function (event, viewConfig) {
                $rootScope.toggleLeft = function () {
                    ($(window).width() > 767) ? $('#main-wrapper').toggleClass('sidebar-mini') : $('#main-wrapper').toggleClass('sidebar-opened');
                };

                if (!($('#main-wrapper').hasClass('sidebar-mini'))) {
                    $rootScope.toggleLeft();
                }
            });
    });