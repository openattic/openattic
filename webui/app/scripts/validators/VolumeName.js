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

var app = angular.module("openattic");
app.directive("validname", function () {
  return {
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$parsers.unshift(function (viewValue) {
        ctrl.$setValidity("validname", true);

        if (typeof viewValue !== "undefined" && viewValue.length > 0) {
          var match = viewValue.match("[^a-zA-Z0-9+_.-]") || [];

          if (viewValue === "." || viewValue === "..") {
            ctrl.$setValidity("validname", false);
            scope.errortext = "LV names may not be \".\" or \"..\"!";
          } else if (viewValue[0] === "-") {
            ctrl.$setValidity("validname", false);
            scope.errortext = "LV names must not begin with a hyphen.";
          } else if (match.length > 0) {
            ctrl.$setValidity("validname", false);
            scope.errortext = "The following characters are valid: " +
            "a-z A-Z 0-9 + _ . -";
          }  else if (viewValue.indexOf("snapshot") === 0 || viewValue.indexOf("pvmove") === 0) {
            ctrl.$setValidity("validname", false);
            scope.errortext = "The volume name must not begin with \"snapshot\" or \"pvmove\".";
          } else if (viewValue.indexOf("_mlog") !== -1 || viewValue.indexOf("_mimage") !== -1) {
            ctrl.$setValidity("validname", false);
            scope.errortext = "The volume name must not contain \"_mlog\" or \"_mimage\".";
          }
        }

        return viewValue;
      });
    }
  };
});
