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