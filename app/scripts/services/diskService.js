angular.module('openattic')
  .factory('DiskService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/disks/:id', {
      id: '@id'
    }, {
      update: {method: 'PUT'},
      query: {
        method: 'GET',
        isArray: true,
        transformResponse: function (data) {
          return JSON.parse(data).results;
        }
      },
      filter: {
        method: 'GET'
      }
    });
  });
