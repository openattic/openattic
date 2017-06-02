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
   * @param {boolean} appendUnit Set to FALSE to do not append the unit.
   *   Defaults to TRUE.
   * @param {string} separator The separator to use between the number and unit.
   *   Defaults to ' '.
   * @param {boolean} shortPrefixes Set to TRUE to use short binary prefixes,
   *   e.g. B, M, G, T. Defaults to FALSE.
   */
  return function (value, inUnit, outPrecision, outUnit, appendUnit, separator, shortPrefixes) {
    if (angular.isObject(arguments[1]) && (arguments.length === 2)) {
      inUnit = arguments[1].inUnit;
      outPrecision = arguments[1].outPrecision;
      outUnit = arguments[1].outUnit;
      appendUnit = arguments[1].appendUnit;
      separator = arguments[1].separator;
      shortPrefixes = arguments[1].shortPrefixes;
    }
    // Set default values.
    appendUnit = angular.isDefined(appendUnit) ? appendUnit : true;
    separator = angular.isDefined(separator) ? separator : " ";
    shortPrefixes = angular.isDefined(shortPrefixes) ? shortPrefixes : false;
    var result;
    var units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    if (shortPrefixes) {
      units = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];
    }
    // Validate the input value.
    if (isNaN(parseFloat(value)) || !isFinite(value)) {
      return "-";
    }
    if (value === 0) {
      result = value;
      if (appendUnit) {
        result = result + separator + units[0];
      }
      return result;
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
    outPrecision = angular.isDefined(outPrecision) ? outPrecision : 2;
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
    result = (value / Math.pow(1024, outUnit)).toFixed(outPrecision);
    if (appendUnit) {
      result = result + separator + units[outUnit];
    }
    return result;
  };
});

app.filter("toBytes", function () {
  /**
   * Convert the given value into bytes.
   * @param {string} value The value to be converted, e.g. 1024B, 10M, 300KiB or 1ZB.
   */
  return function (value) {
    var base = 1024;
    var units = {
      "B": 1,
      "K": Math.pow(base, 1),
      "KB": Math.pow(base, 1),
      "KiB": Math.pow(base, 1),
      "M": Math.pow(base, 2),
      "MB": Math.pow(base, 2),
      "MiB": Math.pow(base, 2),
      "G": Math.pow(base, 3),
      "GB": Math.pow(base, 3),
      "GiB": Math.pow(base, 3),
      "T": Math.pow(base, 4),
      "TB": Math.pow(base, 4),
      "TiB": Math.pow(base, 4),
      "P": Math.pow(base, 5),
      "PB": Math.pow(base, 5),
      "PiB": Math.pow(base, 5),
      "E": Math.pow(base, 6),
      "EB": Math.pow(base, 6),
      "EiB": Math.pow(base, 6),
      "Z": Math.pow(base, 7),
      "ZB": Math.pow(base, 7),
      "ZiB": Math.pow(base, 7),
      "Y": Math.pow(base, 8),
      "YB": Math.pow(base, 8),
      "YiB": Math.pow(base, 8)
    };
    var m = RegExp("^(\\d+)\\s*(B|K(B|iB)?|M(B|iB)?|G(B|iB)?|T(B|iB)?|P(B|iB)?|" +
      "E(B|iB)?|Z(B|iB)?|Y(B|iB)?)?$").exec(value);
    if (m === null) {
      return value;
    }
    var bytes = m[1];
    if (angular.isString(m[2])) {
      bytes = bytes * units[m[2]];
    }
    return bytes;
  };
});
