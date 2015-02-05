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
       .state("disks", {
        url: "/disks",
        views: {
            "main": {
                templateUrl: "templates/disks.html"
            }
        }
      })
      .state("pools", {
        url: "/pools",
        views: {
            "main": {
                templateUrl: "templates/pools.html"
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