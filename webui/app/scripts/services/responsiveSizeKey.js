"use strict";

var app = angular.module("openattic");
app.factory("ResponsiveSizeKey", function ($window, RESPONSIVE) {
  return {
    getKey: function () {
      var width = $window.innerWidth;
      var key;

      for (var k in RESPONSIVE) {
        if (width > RESPONSIVE[k]) {
          key = k;
        }
      }

      return key;
    }
  };
});
