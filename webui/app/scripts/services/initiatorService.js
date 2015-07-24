angular.module('openattic')
  .factory('InitiatorService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/initiators/:id', {
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
