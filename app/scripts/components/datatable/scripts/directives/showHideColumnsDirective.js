angular.module('openattic.datatable')
  .directive('showhidecolumns', function () {
    return {
      restrict: 'E',
      templateUrl: 'scripts/components/datatable/templates/showhidecolumnsmenu.html'
    };
  });