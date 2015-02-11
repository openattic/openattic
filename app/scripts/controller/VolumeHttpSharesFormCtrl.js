angular.module('openattic')
  .controller('VolumeHttpSharesFormCtrl', function ($scope, $state, $stateParams, HttpSharesService) {
    if(!$stateParams.share){
      $scope.share = {
        'volume': {id: $scope.selection.item.id},
        'path':   $scope.selection.item.path
      };
      $scope.editing = false;

      $scope.submitAction = function() {
        HttpSharesService.save($scope.share)
          .$promise
          .then(function() {
            goToListView();
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    }

    $scope.cancelAction = function() {
        goToListView();
    }

    var goToListView = function() {
        $state.go('volumes.detail.http');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
