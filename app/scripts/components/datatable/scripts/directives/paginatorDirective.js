angular.module('openattic.datatable')
  .directive('paginator', function () {
    return {
      restrict: 'E',
      templateUrl: "scripts/components/datatable/templates/pagination.html",
      scope: {
        page: "=",
        pages: "="
      },
      link: function (scope, element, attr) {
        // TODO: Extract this in a service
        var _range = function () {
          var start, end, i, nums = [];
          if (arguments.length == 1) {
            start = 0;
            end = arguments[0];
          }
          else {
            start = arguments[0];
            end = arguments[1];
          }
          for (i = start; i < end; i++) {
            nums.push(i);
          }
          return nums;
        }

        // TODO: Extract this in a service
        var _numbers = function (page, pages, buttons) {
          // Shamelessly stolen from DataTables:
          // https://github.com/DataTables/DataTables/blob/master/media/js/jquery.dataTables.js#L13852
          var numbers = [],
            half = Math.floor(buttons / 2);
          if (pages <= buttons) {
            numbers = _range(0, pages);
          }
          else if (page <= half) {
            numbers = _range(0, buttons - 2);
            numbers.push('ellipsis');
            numbers.push(pages - 1);
          }
          else if (page >= pages - 1 - half) {
            numbers = _range(pages - (buttons - 2), pages);
            numbers.splice(0, 0, 'ellipsis'); // no unshift in ie6
            numbers.splice(0, 0, 0);
          }
          else {
            numbers = _range(page - 1, page + 2);
            numbers.push('ellipsis');
            numbers.push(pages - 1);
            numbers.splice(0, 0, 'ellipsis');
            numbers.splice(0, 0, 0);
          }
          numbers.DT_el = 'span';
          return numbers;
        }

        var update_pages = function () {
          scope.buttons = _numbers(scope.page, scope.pages, 7);
        }

        scope.switchPage = function (page) {
          scope.page = page;
          // TODO: Should be done automatically, we should take a look at it
          update_pages();
        }

        // TODO: Should be done automatically via view, we should take a look at it
        scope.$watch("pages", update_pages);
      }
    };
  });