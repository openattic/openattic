angular.module('openattic.datatable')
  .directive('actions', function () {
    return {
      restrict: 'E',
      // TODO: Use JSLint to use only " or '
      templateUrl: "scripts/components/datatable/templates/actionmenu.html",
      transclude: true,
      link: function (scope, element, attr, controller, transclude) {
        // TODO: Whaa? 100% not reusable/isolated ... oowww
        // TODO: May try to use
        var actionsscope = scope.$parent.$parent.$new();
        actionsscope.oadatatable = scope;
        transclude(actionsscope, function (clone, scope) {
          element.find(".oadatatableactionsmenu").append(clone);
        });
      }
    };
  });