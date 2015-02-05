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
          "tab-content": {templateUrl: "templates/pools/status.html"}
        }
      })
      .state('pools.detail.storage', {
        url: "/storage",
        views: {
          "tab-content": {templateUrl: "templates/pools/storage.html"}
        }
      })
       .state("disks", {
        url: "/disks",
        views: {
            "main": {
                templateUrl: "templates/disks.html"
            }
        }
      })
      .state("volumes", {
        url: "/volumes",
        views: {
            "main": {
                templateUrl: "templates/volumes.html"
            }
        }
      })
      .state("hosts", {
        url: "/hosts",
        views: {
            "main": {
                templateUrl: "templates/hosts.html"
            }
        }
      })
      .state("users", {
        url: "/users",
        views: {
            "main": {
                templateUrl: "templates/users.html"
            }
        }
      })
      .state("apikeys", {
        url: "/apikeys",
        views: {
            "main": {
                templateUrl: "templates/apikeys.html"
            }
        }
      })
});