'use strict';

var wizardDefinitions = [{
  title: 'File Storage',
  icon: 'fa fa-folder-o fa-4x',
  page: 'filestorage.html'
},{
  title: 'VM Storage',
  icon: 'fa fa-align-left fa-rotate-270 fa-stack-1x',
  page: 'vmstorage.html',
  stackedIcon: true
},{
  title: 'Raw Block Storage',
  icon: 'fa fa-cube fa-4x',
  page: 'blockstorage.html'
}/*,{
  title: 'Ceph',
  icon: 'fa fa-bullseye fa-4x',
  page: ''
}*/];

angular.module('openattic.oaWizards')
  .directive('wizardselector', function(){
    return {
      template: '<div ng-include="page"></div>',
      controller: function($scope, $element){
        var setSize = function(width) {
          if(width >= 1200) {
            $scope.size = 'lg';
          } else if(width >= 992) {
            $scope.size = 'md';
          } else if(width >= 768) {
            $scope.size = 'sm';
          } else {
            $scope.size = 'xs';
          }
        };
        var initWidth = $element.closest('.dashboard-widget-area').width() / 100 * parseFloat($scope.widget.size.width);
        setSize(initWidth);
        $scope.$on('widgetResized', function(event, values) {
          setSize(values.widthPx);
          // Save apply
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$digest();
          }
        });
        $scope.page = 'components/oaWizards/templates/wizardSelector.html';
        $scope.wizards = wizardDefinitions;
        $scope.selectPage = function(page){
          if(page !== '' && typeof page !== 'undefined') {
            $scope.page = 'components/oaWizards/templates/' + page;
          }
        };
        $scope.selectSelector = function(){
          $scope.page = 'components/oaWizards/templates/wizardSelector.html';
        };
      }
    };
  });
