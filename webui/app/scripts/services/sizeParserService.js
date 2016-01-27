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

var app = angular.module("openattic.sizeparser", []);
app.factory("SizeParserService", function () {
  var mult = ["m", "g", "t", "p", "e"];

  var _parseInt = function (value) {
    // If it's a plain number, just parseInt() it
    if (!value) {
      return null;
    }

    if (/^[\d.]+$/.test(value)) {
      return parseInt(parseFloat(value), 10);
    }

    value = value.toLowerCase().replace(/\s/g, "");
    // If it's a valid size string, calc its int value
    var facs = mult.join("");
    var rgx = new RegExp("^([\\d.]+)([" + facs + "]?)(i?)(b?)$");

    if (rgx.test(value)) {
      var matched = rgx.exec(value);
      return parseInt(parseFloat(matched[1], 10) * Math.pow(1024, mult.indexOf(matched[2])), 10);
    }

    // It didn't parse...
    return null;
  };

  var _parseFloat = function (value) {
    // If it's a plain number, just parseInt() it
    if (!value) {
      return null;
    }

    if (/^[\d.]+$/.test(value)) {
      return parseFloat(value);
    }

    value = value.toLowerCase().replace(/\s/g, "");
    // If it's a valid size string, calc its int value
    var facs = mult.join("");
    var rgx = new RegExp("^([\\d.]+)([" + facs + "]?)(i?)(b?)$");

    if (rgx.test(value)) {
      var matched = rgx.exec(value);
      return parseFloat(matched[1], 10) * Math.pow(1024, mult.indexOf(matched[2]));
    }

    // It didn't parse...
    return null;
  };

  var _isValid = function (value) {
    return _parseInt(value) !== null;
  };

  return {
    parseInt: _parseInt,
    parseFloat: _parseFloat,
    isValid: _isValid
  };
});