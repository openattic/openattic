"use strict";

angular.module('openattic').config(function ($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/dashboard");

  $stateProvider
      .state('dashboard', {
        url: "/dashboard",
        views: {
          "main": {templateUrl: "templates/dashboard.html"}
        }
      })
});