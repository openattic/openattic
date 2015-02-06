angular.module('openattic')
  .factory('VolumeService', function ($resource) {
    'use strict';
    return $resource('/openattic/api/volumes/:id', {
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
      services: {
        method: 'GET',
        url: '/openattic/api/volumes/:id/services'
      },
      storage: {
        method: 'GET',
        url: '/openattic/api/volumes/:id/storage'
      },
      snapshots: {
        method: 'GET',
        url: '/openattic/api/volumes/:id/snapshots'
      },
      filter: {
        method: 'GET',
        url: '/openattic/api/volumes'
      }
    });
  })
  .config(function($provide) {
    $provide.decorator('VolumeService', function($delegate) {
      var saveOld = $delegate.filter;
      $delegate.filter = function(){
        console.log(arguments);
        return saveOld.apply(arguments);
      }
      return $delegate;
    });
  });
