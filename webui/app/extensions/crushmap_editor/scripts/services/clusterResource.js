angular.module('openattic')
  .factory('ClusterResource', function ($resource) {
    'use strict';
    return $resource('/openattic/api/cephclusters/:id', {
      id: '@id'
    }, {
      update: {method: 'PUT'},
      query: {
        method: 'GET',
        isArray: true,
        transformResponse: function (data) {
          return JSON.parse(data).results;
        }
      }
    });
  });
