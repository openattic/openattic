'use strict';

angular.module('openattic.auth', [
  'ngResource'
]);

angular.module('openattic.auth').config(function($httpProvider){
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});