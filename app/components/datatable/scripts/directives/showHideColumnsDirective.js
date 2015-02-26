angular.module('openattic.datatable')
  .directive('showhidecolumns', function () {
    'use strict';

    return {
      restrict: 'E',
      templateUrl: 'components/datatable/templates/showhidecolumnsmenu.html'
    };
  });