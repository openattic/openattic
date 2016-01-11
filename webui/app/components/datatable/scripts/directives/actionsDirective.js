"use strict";

var app = angular.module("openattic.datatable");
app.directive("actions", function () {
  return {
    restrict: "E",
    templateUrl: "components/datatable/templates/actionmenu.html",
    transclude: true,
    link: function (scope, element, attr, controller, transclude) {
      var actionsscope = scope.$parent.$new();
      transclude(actionsscope, function (clone) {
        var i;
        var liElems = clone.filter("li");
        for (i = 0; i < liElems.length; i++) {
          element.find(".oa-dropdown-actions").append(liElems[i]);
        }
        var aElems = clone.filter(".btn-primary");
        for (i = aElems.length - 1; i >= 0; --i) {
          element.find(".btn-group").prepend(aElems[i]);
        }
      });
    }
  };
});