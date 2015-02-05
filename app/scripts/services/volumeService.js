angular.module('openattic')
  .factory("VolumeService", function ($resource) {
    return $resource("/openattic/api/volumes/:id", {
      id: "@id"
    }, {
      update: {method: "PUT"},
      query: {
        method: 'GET',
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
      filesystems: {
        method: "GET",
        url: "/openattic/api/volumes/:id/filesystems"
      },
      filter: {
        method: "GET",
        url: '/openattic/api/volumes'
      }
    });
  });
