'use strict';

angular.module('openattic.auth')
  .factory('authService', function($resource) {
    return $resource('/openattic/api/auth', {}, {
      login:    {method: 'POST'},
      logout:   {method: 'DELETE'},
      kerberos: {
        method: 'GET',
        url:    '/openattic/accounts/kerblogin.js'
      }
    });
  });