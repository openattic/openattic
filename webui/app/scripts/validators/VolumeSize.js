"use strict";

var app = angular.module("openattic");
app.directive("volumeSizeFormat", function (SizeParserService) {
  return {
    require: "ngModel",
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$validators.volumeSizeFormat = function (modelValue) {
        return ctrl.$isEmpty(modelValue) || SizeParserService.isValid(modelValue);
      };
    }
  };
})
.directive("volumeSizeValue", function (SizeParserService) {
  return {
    require: "ngModel",
    scope: {
      maxValue: "@",
      minValue: "@"
    },
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$validators.volumeSizeValue = function (modelValue) {
        if (!modelValue || !SizeParserService.isValid(modelValue)) {
          return true;
        }

        var megs = SizeParserService.parseFloat(modelValue);
        var maxv = parseFloat(scope.maxValue);
        var minv = parseFloat(scope.minValue) || 100;

        return !maxv || megs >= minv && megs <= maxv;
      };
    }
  };
});