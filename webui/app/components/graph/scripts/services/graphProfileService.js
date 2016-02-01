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

var app = angular.module("openattic.graph");
app.factory("GraphProfileService", function () {
  var profiles = [{
    title: "4h",
    duration: 6 * 60 * 60,
    tiny: true
  }, {
    title: "24h",
    duration: 24 * 60 * 60,
    tiny: true
  }, {
    title: "48h",
    duration: 48 * 60 * 60,
    tiny: true
  }, {
    title: "1w",
    duration: 7 * 24 * 60 * 60,
    tiny: true
  }, {
    title: "2w",
    duration: 14 * 24 * 60 * 60,
    tiny: false
  }, {
    title: "1m",
    duration: 30 * 24 * 60 * 60,
    tiny: true
  }, {
    title: "3m",
    duration: 90 * 24 * 60 * 60,
    tiny: false
  }, {
    title: "6m",
    duration: 180 * 24 * 60 * 60,
    tiny: false
  }, {
    title: "1y",
    duration: 365 * 24 * 60 * 60,
    tiny: true
  }];

  return {
    getProfiles: function () {
      return profiles;
    },
    getProfile: function (title) {
      for (var i = 0; i < profiles.length; i++) {
        if (profiles[i].title === title) {
          return profiles[i];
        }
      }
    }
  };
});