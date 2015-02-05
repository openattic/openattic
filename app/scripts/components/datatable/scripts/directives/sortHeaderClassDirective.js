angular.module('openattic.datatable')
  .directive('sortheaderclass', function ($compile) {
    return {
      // TODO: Default remove
      restrict: 'A',
      terminal: true,
      priority: 1000,
      link: function link(scope, element, attrs) {
        var replace = scope.sortfields[$(element).text()];
        element.attr("ng-click", "sortByField('" + replace + "')");
        element.attr("ng-class",
          "{ sorting_asc: sortfield == '" + replace + "' && sortorder == 'ASC'," +
          "sorting: sortfield != '" + replace + "'," +
          "sorting_desc: sortfield == '" + replace + "' && sortorder == 'DESC'" +
          "}");
        element.removeAttr('sortheaderclass');
        $compile(element)(scope);
      }
    };
  });