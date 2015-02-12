'use strict';

angular.module('openattic.auth', [
  'ngResource'
]);

angular.module('openattic.auth').config(function($httpProvider){
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

angular.module('openattic.auth').config(function($provide, $httpProvider){
  $provide.factory('AuthHttpInterceptor', function($q){
    return {
      responseError: function(rejection){
        if(rejection.status === 401){
          window.location.href = 'login.html';
        }
        return $q.reject(rejection);
      }
    };
  });

  $httpProvider.interceptors.push('AuthHttpInterceptor');
});
