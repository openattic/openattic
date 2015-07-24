angular.module('openattic.datatable')
  .directive('paginator', function (paginatorService) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl: 'components/datatable/templates/pagination.html',
      scope: {
        page: '=',
        pages: '='
      },
      link: function (scope) {

        var update_pages = function () {
          scope.buttons = paginatorService.getNumbers(scope.page, scope.pages, 7);
        };

        scope.switchPage = function (page) {
          scope.page = page;
          // TODO: Should be done automatically, we should take a look at it
          update_pages();
        };

        // TODO: Should be done automatically via view, we should take a look at it
        scope.$watch('pages', update_pages);
      }
    };
  });
