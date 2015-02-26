angular.module('openattic.datatable')
  .directive('sortheaderclass', function ($compile) {
    'use strict';
    return {
      terminal: true,
      priority: 1000,
      link: function link(scope, element) {
        var fieldName = scope.sortfields[$(element).text()];
        element.attr('ng-click', "sortByField('" + fieldName + "')");
        element.attr('ng-class',
          "{ sorting_asc: filterConfig.sortfield == '" + fieldName + "' && filterConfig.sortorder == 'ASC'," +
            "sorting: filterConfig.sortfield != '" + fieldName + "'," +
            "sorting_desc: filterConfig.sortfield == '" + fieldName + "' && filterConfig.sortorder == 'DESC'" +
          "}");
        element.removeAttr('sortheaderclass');
        $compile(element)(scope);
      }
    };
  });
