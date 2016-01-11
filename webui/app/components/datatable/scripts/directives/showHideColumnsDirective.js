"use strict";

var app = angular.module("openattic.datatable");
app.directive("showhidecolumns", function () {
  return {
    restrict: "E",
    templateUrl: "components/datatable/templates/showhidecolumnsmenu.html"
  };
});