"use strict";

var app = angular.module("openattic");
app.factory("InitiatorService", function ($resource) {
  return $resource("/openattic/api/initiators/:id", {
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