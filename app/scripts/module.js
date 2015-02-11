'use strict';
angular.module('openattic', [
  'ngResource',
  'ui.router',
  'openattic.auth',
  'openattic.datatable',
  'openattic.datatree',
  'openattic.graph',
  'smartadmin.smartmenu'
]);

angular.module('openattic').config(function($httpProvider){
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

// kate: space-indent on; indent-width 2; replace-tabs on;
