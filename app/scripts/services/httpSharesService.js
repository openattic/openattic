angular.module('openattic')
  .factory('HttpSharesService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/httpshares/:id', {
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
        method: 'GET',
        url: '/openattic/api/httpshares'
      }
    });
  });
