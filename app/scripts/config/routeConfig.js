"use strict";

angular.module('openattic').config(function ($stateProvider) {
  $stateProvider
      .state('index', {
        url: "",
        views: {
          "viewA": { template: "index.viewA" },
          "viewB": { template: "index.viewB" }
        }
      })
      .state('route1', {
        url: "/route1",
        views: {
          "viewA": { template: "route1.viewA" },
          "viewB": { template: "route1.viewB" }
        }
      })
      .state('route2', {
        url: "/route2",
        views: {
          "viewA": { template: "route2.viewA" },
          "viewB": { template: "route2.viewB" }
        }
      })
});