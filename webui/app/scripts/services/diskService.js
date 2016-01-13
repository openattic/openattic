"use strict";

var app = angular.module("openattic");
app.factory("DiskService", function ($resource) {
  return $resource("/openattic/api/disks/:id", {
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
    }
  });
});