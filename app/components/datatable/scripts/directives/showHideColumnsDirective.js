angular.module('openattic.datatable')
  .directive('showhidecolumns', function () {
    return {
      restrict: 'E',
      templateUrl: 'components/datatable/templates/showhidecolumnsmenu.html'
    };
  });