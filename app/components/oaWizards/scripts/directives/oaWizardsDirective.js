'use strict';

var wizardDefinitions = [{
  title: 'Filestorage',
  icon: 'fa fa-folder-o fa-4x',
  page: 'filestorage.html'
},{
  title: 'VM Storage',
  icon: 'fa fa-desktop fa-4x',
  page: ''
},{
  title: 'Raw Blockstorage',
  icon: 'fa fa-cube fa-4x',
  page: ''
}/*,{
  title: 'Ceph',
  icon: 'fa fa-rocket fa-4x',
  page: ''
}*/];

angular.module('openattic.oaWizards')
  .directive('oawizards', function(){
    return {
      template: '<div ng-include="page"></div>',
      controller: function($scope){
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
