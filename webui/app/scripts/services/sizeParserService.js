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