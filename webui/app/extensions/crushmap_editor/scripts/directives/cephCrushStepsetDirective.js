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

var app = angular.module("openattic.extensions");
app.directive("cephCrushStepset", function () {
  return {
    restrict: "E",
    templateUrl: "extensions/crushmap_editor/templates/crushStepset.html",
    scope: {
      "stepset": "=",
      "rule": "=",
      "cluster": "="
    },
    controller: function ($scope) {
      if ($scope.stepset.num === 0) {
        $scope.replicas_source = "fix";
        $scope.replicas_pos = 1;
        $scope.replicas_neg = 1;
      } else if ($scope.stepset.num < 0) {
        $scope.replicas_source = "neg";
        $scope.replicas_pos = -$scope.stepset.num;
        $scope.replicas_neg = -$scope.stepset.num;
      } else {
        $scope.replicas_source = "pos";
        $scope.replicas_pos = $scope.stepset.num;
        $scope.replicas_neg = $scope.stepset.num;
      }

      $scope.$watchGroup(["replicas_source", "replicas_pos", "replicas_neg"], function () {
        if ($scope.replicas_source === "fix") {
          $scope.stepset.num = 0;
        } else if ($scope.replicas_source === "pos") {
          $scope.stepset.num = $scope.replicas_pos;
        } else if ($scope.replicas_source === "neg") {
          $scope.stepset.num = -$scope.replicas_neg;
        }
      });

      $scope.getRealNum = function (step) {
        if (!step) {
          return;
        }
        if (step.num <= 0) {
          return {
            min: $scope.rule.min_size + step.num,
            max: $scope.rule.max_size + step.num
          };
        }
        return {
          min: step.num
        };
      };
    }
  };
});