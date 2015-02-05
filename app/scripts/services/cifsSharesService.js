angular.module('openattic')
  .factory('CifsSharesService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/sambashares/:id', {
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
        url: '/openattic/api/sambashares'
      }
    });
  });
