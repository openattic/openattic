/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

var wizardDefinitions = [{
  title: "File Storage",
  icon: "fa fa-folder-o fa-4x",
  page: "filestorage.html"
}, {
  title: "VM Storage",
  icon: "fa fa-align-left fa-rotate-270 fa-stack-1x",
  page: "vmstorage.html",
  stackedIcon: true
}, {
  title: "Raw Block Storage",
  icon: "fa fa-cube fa-4x",
  page: "blockstorage.html"
}/*, {
  title: "Ceph",
  icon: "fa fa-bullseye fa-4x",
  page: ""
}*/];

var app = angular.module("openattic.oaWizards");
app.directive("wizardselector", function () {
  return {
    template: "<div ng-include=\"page\"></div>",
    controller: function ($scope, $element, RESPONSIVE) {
      var setSize = function (width) {
        if (width >= RESPONSIVE.lg) {
          $scope.size = "lg";
        } else if (width >= RESPONSIVE.md) {
          $scope.size = "md";
        } else if (width >= RESPONSIVE.sm) {
          $scope.size = "sm";
        } else {
          $scope.size = "xs";
        }
      };
      var initWidth = $element.closest(".dashboard-widget-area").width() / 100 * parseFloat($scope.widget.size.width);
      setSize(initWidth);
      $scope.$on("widgetResized", function (event, values) {
        setSize(values.widthPx);
        // Save apply
        if ($scope.$root.$$phase !== "$apply" && $scope.$root.$$phase !== "$digest") {
          $scope.$digest();
        }
      });
      $scope.page = "components/oaWizards/templates/wizardSelector.html";
      $scope.wizards = wizardDefinitions;
      $scope.selectPage = function (page) {
        if (page !== "" && typeof page !== "undefined") {
          $scope.page = "components/oaWizards/templates/" + page;
        }
      };
      $scope.selectSelector = function () {
        $scope.page = "components/oaWizards/templates/wizardSelector.html";
      };
    }
  };
});