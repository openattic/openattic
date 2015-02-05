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
      .state('pools.detail', {
        url: "/:pool",
        views: {
          "tab": {templateUrl: "templates/pools/tab.html"}
        }
      })
      .state('pools.detail.status', {
        url: "/status",
        views: {
          "tab-content": {template: "Status"}
        }
      })
      .state('pools.detail.storage', {
        url: "/storage",
        views: {
          "tab-content": {template: "Storage"}
        }
      })
});