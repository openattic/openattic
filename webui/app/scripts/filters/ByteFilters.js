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

app.filter("bytes", function () {
  /**
   * Display the given size in the best matching unit.
   * @param {number} value The value to be displayed.
   * @param {number|string} inUnit The input unit, e.g. 1 or 'KiB'.
   *   Default is 'B'.
   * @param {number} outPrecision The number of digits after the decimal point.
   *   Default is 2.
   * @param {number|string} outUnit The unit to output, e.g. 2 or 'MiB'.
   *   If not set, the best matching unit is calculated. Default is auto-calc.
   */
  return function (value, inUnit, outPrecision, outUnit) {
    var units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB"];
    // Validate the input value.
    if (isNaN(parseFloat(value)) || !isFinite(value)) {
      return "-";
    }
    if (value === 0) {
      return value + " " + units[0];
    }
    // Get the input unit.
    if (angular.isDefined(inUnit)) {
      if (angular.isString(inUnit)) {
        inUnit = units.indexOf(inUnit);
      }
      if (!inUnit || inUnit < 0 || inUnit > units.length) {
        inUnit = 0;
      }
    } else {
      inUnit = 0;
    }
    // Convert the value to bytes if necessary.
    if (0 < inUnit) {
      value = (value * Math.pow(1024, inUnit)).toFixed(0);
    }
    // Set the output precision and unit.
    outPrecision = outPrecision || 2;
    if (angular.isDefined(outUnit)) {
      if (angular.isString(outUnit)) {
        outUnit = units.indexOf(outUnit);
      }
      if (!outUnit || outUnit < 0 || outUnit > units.length) {
        outUnit = 0;
      }
    } else {
      // Calculate the best matching unit.
      outUnit = Math.floor(Math.log(value) / Math.log(1024));
    }
    return (value / Math.pow(1024, outUnit)).toFixed(outPrecision) +  " " + units[outUnit];
  };
});
