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
   * @param {number} value The value in MiB.
   * @param {number} precision The number of digits after the decimal point.
   *   Default is 2.
   * @param {number|string} unit The unit to output, e.g. 2 or 'MiB'.
   *   If not set, the best matching unit is calculated. Default is auto-calc.
   */
  return function (value, precision, unit) {
    var units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB"];
    if (isNaN(parseFloat(value)) || !isFinite(value)) {
      return "-";
    }
    if (value === 0) {
      return value + " " + units[0];
    }
    value = (value * Math.pow(1024, 2)).toFixed(0); // Convert to bytes
    precision = precision || 2;
    if (angular.isDefined(unit)) {
      // Manually set the unit.
      if (angular.isString(unit)) {
        unit = units.indexOf(unit);
      }
      if (!unit || unit < 0 || unit > units.length) {
        unit = 0;
      }
    } else {
      // Calculate the best matching unit.
      unit = Math.floor(Math.log(value) / Math.log(1024));
    }
    return (value / Math.pow(1024, unit)).toFixed(precision) +  " " + units[unit];
  };
});