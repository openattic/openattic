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
app.filter("humanizeInt", function () {
  return function (inp) {
    inp = parseInt(inp, 10);
    if (inp < 0 || inp > 12) {
      return inp;
    }
    return {
      0: "no",
      1: "one",
      2: "two",
      3: "three",
      4: "four",
      5: "five",
      6: "six",
      7: "seven",
      8: "eight",
      9: "nine",
      10: "ten",
      11: "eleven",
      12: "twelve"
    }[inp];
  };
});

/**
 * Split a string into an array of substrings.
 * @param {string} separator Specifies the character, or the regular expression, to use for
 *   splitting the string.
 * @param {number} limit Optional. An integer that specifies the number of splits, items after
 *   the split limit will not be included in the array.
 * @return Returns an array containing the substrings or undefined in case of an error.
 */
app.filter("split", function () {
  return function (input, separator, limit) {
    if (!angular.isString(input)) {
      return undefined;
    }
    var parts = input.split(separator, limit);
    return parts;
  };
});

/**
 * Get the item at the specified index.
 * @param {number} Specifies the index of the item.
 * @return Returns the item at the specified index.
 */
app.filter("getAt", function () {
  return function (input, index) {
    if (!angular.isArray(input) || index > input.length) {
      return undefined;
    }
    return input[index];
  };
});
