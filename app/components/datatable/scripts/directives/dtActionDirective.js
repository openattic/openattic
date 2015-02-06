angular.module('openattic.datatable')
  .directive('dtaction', function ($sce) {
    return {
      // TODO: A is default, remove
      restrict: 'A',
      transclude: true,
      template: '<a ng-transclude></a>',
      scope: {
        "trigger": "&",
        "filter": "&",
        "minSelected": "@",
        "maxSelected": "@"
      },
      link: function (scope, element, attr, transclude) {
        var oadatatable = scope.$parent.oadatatable;
        var triggerfunc = function () {
          scope.trigger({"oadatatable": oadatatable});
        }
        scope.is_active = function () {
          // TODO: General parseint, add exponent!! https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
          if (oadatatable.getSelection().length < parseInt(scope.minSelected)) {
            return false;
          }
          if (oadatatable.getSelection().length > parseInt(scope.maxSelected)) {
            return false;
          }
          if (scope.filter({"oadatatable": oadatatable}) === false) {
            return false;
          }
          return true;
        }
        oadatatable.watchSelection(function () {
          if (scope.is_active()) {
            element.removeClass("disabled");
          }
          else {
            element.addClass("disabled");
          }
        });
        oadatatable.addAction({
          html: $sce.trustAsHtml($(element).find("a").html()),
          fn: triggerfunc,
          is_active: scope.is_active
        });

        element.bind('click', triggerfunc);
      }
    };
  });