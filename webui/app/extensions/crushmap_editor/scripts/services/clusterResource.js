"use strict";

var app = angular.module("openattic");
app.factory("ClusterResource", function ($resource) {
  return $resource("/openattic/api/cephclusters/:id", {
    id: "@id"
  }, {
    update: {method: "PUT"},
    query: {
      method: "GET",
      isArray: true,
      transformResponse: function (data) {
        return JSON.parse(data).results;
      }
    }
  });
});
