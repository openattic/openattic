'use strict';

angular.module('openattic.auth', [
  'ngResource'
]);

angular.module('openattic.auth')
  .config(function($httpProvider){
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
  });

angular.module('openattic.auth')
  .factory('AuthHttpInterceptor', function($q){
    return {
      request: function(config) {
        // Give the backend a clue that we're using AJAX here...
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        return config;
      },
      responseError: function(rejection){
        if(rejection.status === 401){
          window.location.href = 'login.html';
        }
        return $q.reject(rejection);
      }
    };
  })
  .config(function($httpProvider){
    $httpProvider.interceptors.push('AuthHttpInterceptor');
  });
