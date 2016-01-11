"use strict";

var app = angular.module("openattic.extensions");
app.directive("cephPoolAttributesEditor", function () {
  return {
    restrict: "E",
    templateUrl: "extensions/ceph_pool_attributes_editor/templates/editor.html"
  };
});