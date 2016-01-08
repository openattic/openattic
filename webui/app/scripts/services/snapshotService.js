"use strict";

var app = angular.module("openattic");
app.factory("SnapshotService", function ($resource) {
  return $resource("/openattic/api/snapshots/:id", {
    id: "@id"
  }, {
    update: {method: "PUT"},
    query: {
      method: "GET",
      isArray: true,
      transformResponse: function (data) {
        return JSON.parse(data).results;
      }
    },
    filter: {
      method: "GET"
    },
    clone: {
      method: "POST",
      url: "/openattic/api/snapshots/:id/clone"
    }
  });
});