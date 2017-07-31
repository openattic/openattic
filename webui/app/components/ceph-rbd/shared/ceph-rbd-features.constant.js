/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

var app = angular.module("openattic.cephRbd");
app.constant("cephRbdFeatures", {
  "deep-flatten": {
    desc: "Deep flatten",
    helpText: "",
    requires: null,
    excludes: null,
    isSupportedISCSI: false,
    isDisplayed: true
  },
  "layering": {
    desc: "Layering",
    helpText: "",
    requires: null,
    excludes: null,
    isSupportedISCSI: true,
    isDisplayed: true
  },
  "stripingv2": {
    desc: "Striping (currently unsupported)",
    helpText: "This feature is currently unsupported.",
    requires: "unsupported",
    excludes: null,
    isSupportedISCSI: true,
    isDisplayed: true
  },
  "exclusive-lock": {
    desc: "Exclusive lock",
    helpText: "",
    requires: null,
    excludes: null,
    isSupportedISCSI: false,
    isDisplayed: true
  },
  "object-map": {
    desc: "Object map",
    helpText: "",
    requires: "exclusive-lock",
    excludes: null,
    isSupportedISCSI: false,
    isDisplayed: true
  },
  "journaling": {
    desc: "Journaling",
    helpText: "",
    requires: "exclusive-lock",
    excludes: null,
    isSupportedISCSI: false,
    isDisplayed: true
  },
  "fast-diff": {
    desc: "Fast diff",
    helpText: "",
    requires: "object-map",
    excludes: null,
    isSupportedISCSI: false,
    isDisplayed: true
  },
  "data-pool": {
    desc: "Data pool",
    helpText: "",
    requires: null,
    excludes: null,
    isSupportedISCSI: false,
    isDisplayed: false
  }
});
