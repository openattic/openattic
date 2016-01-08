"use strict";

var app = angular.module("openattic");
app.factory("HttpSharesService", function ($resource) {
  return $resource("/openattic/api/httpshares/:id", {
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
      method: "GET",
      url: "/openattic/api/httpshares"
    }
  });
});