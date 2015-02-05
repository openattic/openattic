"use strict";

angular.module('openattic').config(function ($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/pools");

  $stateProvider
      .state('pools', {
        url: "/pools",
        controller: 'PoolCtrl',
        views: {
          "main": {templateUrl: "templates/pools.html"}
        }
      })
      .state('pools.status', {
        url: "/:pool/status",
        views: {
          "tab-content": {template: "<h1>Status</h1>"}
        }
      })
      .state('pools.storage', {
        url: "/:pool/storage",
        views: {
          "tab-content": {template: "<h1>Storage</h1>"}
        }
      })
});