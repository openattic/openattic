"use strict";

var app = angular.module("openattic.required");
app.directive("required", function ($document) {
  return {
    restrict: "A",
    link: function (scope, element, attrs) {
      var labelNode = $document[0].body.querySelector("label[for='" + attrs.id + "']");
      if (labelNode) {
        var labelElement = angular.element(labelNode);
        labelElement.append("<span class=\"required\"> *</span>");
      }
    }
  };
});

app.directive("ngRequired", function ($document) {
  return {
    restrict: "A",
    link: function (scope, element, attrs) {
      var labelNode = $document[0].body.querySelector("label[for='" + attrs.id + "']");
      if (labelNode) {
        var labelElement = angular.element(labelNode);
        labelElement.append("<span class=\"required\"> *</span>");
      }
    }
  };
});