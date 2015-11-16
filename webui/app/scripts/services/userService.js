angular.module('openattic')
  .factory('UserService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/users/:id', {
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
      },
      current: {
        method: 'GET',
        url: '/openattic/api/users/current'
      }
    });
  });
