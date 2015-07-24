angular.module('openattic')
  .controller('CmdlogDeleteBySelectionCtrl', function($scope, CmdlogService, $modalInstance, $filter, selection) {
    'use strict';

    $scope.selectionLength = selection.length;
    $scope.itemText = false;
    if(selection.length === 1) {
      $scope.itemText = $filter('shortlog')(selection[0].text);
    }

    var ids = [];
    for(var i=0; i<selection.length; i++){
      ids.push(selection[i].id);
    }

    $scope.yes = function(){
      CmdlogService.delete({'ids': ids})
        .$promise
        .then(function() {
          $modalInstance.close('cloned');
        }, function (error) {
          console.log('An error occured', error);
        });
    };

    $scope.no = function(){
      $modalInstance.dismiss('cancel');

      $.smallBox({
        title: 'Delete log entry',
        content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
        color: '#C46A69',
        iconSmall: 'fa fa-times fa-2x fadeInRight animated',
        timeout: 4000
      });
    };
  });