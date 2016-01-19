"use strict";

var app = angular.module("openattic");
app.factory("VolumeService", function ($resource) {
  return $resource("/openattic/api/volumes/:id", {
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
    storage: {
      method: "GET",
      url: "/openattic/api/volumes/:id/storage"
    },
    snapshots: {
      method: "GET",
      url: "/openattic/api/volumes/:id/snapshots"
    },
    createSnapshot: {
      method: "POST",
      url: "/openattic/api/volumes/:id/snapshots"
    },
    filter: {
      method: "GET",
      url: "/openattic/api/volumes"
    },
    clone: {
      method: "POST",
      url: "/openattic/api/volumes/:id/clone"
    }
  });
});
app.factory("VolumeSnapshotService", function ($resource) {
  return $resource("/openattic/api/volumes/:volumeId/snapshots", {
    volumeId: "@volumeId"
  }, {
  });
});
