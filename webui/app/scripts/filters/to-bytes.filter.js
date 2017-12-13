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

import _ from "lodash";

export default () => {
  /**
   * Convert the given value into bytes.
   * @param {string} value The value to be converted, e.g. 1024B, 10M, 300KiB or 1ZB.
   * @returns Returns the given value in bytes without any appended unit.
   */
  return (value) => {
    const base = 1024;
    const units = {
      "b": 1,
      "k": Math.pow(base, 1),
      "kb": Math.pow(base, 1),
      "kib": Math.pow(base, 1),
      "m": Math.pow(base, 2),
      "mb": Math.pow(base, 2),
      "mib": Math.pow(base, 2),
      "g": Math.pow(base, 3),
      "gb": Math.pow(base, 3),
      "gib": Math.pow(base, 3),
      "t": Math.pow(base, 4),
      "tb": Math.pow(base, 4),
      "tib": Math.pow(base, 4),
      "p": Math.pow(base, 5),
      "pb": Math.pow(base, 5),
      "pib": Math.pow(base, 5),
      "e": Math.pow(base, 6),
      "eb": Math.pow(base, 6),
      "eib": Math.pow(base, 6),
      "z": Math.pow(base, 7),
      "zb": Math.pow(base, 7),
      "zib": Math.pow(base, 7),
      "y": Math.pow(base, 8),
      "yb": Math.pow(base, 8),
      "yib": Math.pow(base, 8)
    };
    const m = RegExp("^(\\d+)\\s*(B|K(B|iB)?|M(B|iB)?|G(B|iB)?|T(B|iB)?|P(B|iB)?|" +
      "E(B|iB)?|Z(B|iB)?|Y(B|iB)?)?$", "i").exec(value);
    if (m === null) {
      return value;
    }
    let bytes = m[1];
    if (_.isString(m[2])) {
      bytes = bytes * units[m[2].toLowerCase()];
    }
    return bytes;
  };
};
