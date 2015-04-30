'use strict';

angular.module('openattic.oaWizards')
  .directive('wizard', function(){
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: 'components/oaWizards/templates/wizard.html',
      link: function(scope, elem, attr, controller, transclude){
        var wizardscope = scope.$parent.$new();
        transclude(wizardscope, function(clone) {
          scope.divs = clone.filter('div');
          var rawTabs = elem.find('.tab-pane');
          var tabs = [];

          for(var i=0; i <  rawTabs.length; i++){
            rawTabs[i].index = i + 1;
            tabs.push(rawTabs[i]);
          }

          scope.tabs = tabs;
        });
      },
      controller: function($scope){
      }
    }
  });