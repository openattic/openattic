/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
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

var app = angular.module("openattic.drbd");
/**
 * Validate the DRBD synchronization rate value, e.g. 30M.
 */
app.directive("drbdSyncRateValidate", function () {
  return {
    // Restrict to an attribute type.
    restrict: "A",
    // Element must have ng-model attribute.
    require: "ngModel",
    // scope = The parent scope
    // elem  = The element the directive is on
    // attrs = A dictionary of attributes on the element
    // ctrl  = The controller for ngModel
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$validators.drbdSyncRateValidate = function (value) {
        if (ctrl.$isEmpty(value)) {
          return true;
        }
        // Syncer rate must be in <number>[K|M|G] format.
        var m = RegExp("^(\\d+)([KMG]?)$").exec(value);
        if (null === m) {
          return false;
        }
        // Syncer rate must be between 500K and 100M.
        var exp = { "": 0, "K": 1, "M": 2, "G": 3 };
        var rate = m[1] * Math.pow(1024, exp[m[2]]);
        if (500 * 1024 > rate) {
          return false;
        }
        if (100 * 1024 * 1024 < rate) {
          return false;
        }
        return true;
      };
    }
  };
});
