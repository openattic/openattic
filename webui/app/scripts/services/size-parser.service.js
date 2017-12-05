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

export default class SizeParserService {

  // If a number can't hold such a large number 1 will be returned.
  // Example: SizeParserService.parseInt(868, "b", "e")
  parseInt (value, outputSize = "m", inputSize) {
    return parseInt(this.parseFloat(value, outputSize, inputSize), 10);
  }

  parseFloat (value, outputSize, defaultInputSize = "m") {
    let units = ["b", "k", "m", "g", "t", "p", "e", "z", "y"];
    if (outputSize) {
      units = units.slice(units.indexOf(outputSize));
    }
    if (/^[\d.]+$/.test(value)) {
      value += defaultInputSize;
    }
    value = value && value.toLowerCase().replace(/\s/g, "");
    const rgx = new RegExp("^([\\d.]+)([" + units.join("") + "]?)(i?)(b?)$");
    if (!rgx.test(value)) {
      return null;
    }
    const matched = rgx.exec(value);
    return parseFloat(matched[1], 10) * Math.pow(1024, units.indexOf(matched[2]));
  }

  isValid (value) {
    return this.parseInt(value) !== null;
  }
}
