angular.module('openattic.datatable')
  .directive('actions', function () {
    'use strict';

    return {
      restrict: 'E',
      templateUrl: 'components/datatable/templates/actionmenu.html',
      transclude: true,
      link: function (scope, element, attr, controller, transclude) {
        var actionsscope = scope.$parent.$new();
        transclude(actionsscope, function (clone) {
          var i;
          var liElems = clone.filter('li');
          for(i = 0; i < liElems.length; i++){
            element.find('.oa-dropdown-actions').append(liElems[i]);
          }
          var aElems = clone.filter('.btn-primary');
          for(i = aElems.length - 1; i >= 0; --i){
            element.find('.btn-group').prepend(aElems[i]);
          }
        });
      }
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
