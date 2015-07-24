angular.module('openattic')
  .factory('PeerHostService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/peers/:id', {
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
