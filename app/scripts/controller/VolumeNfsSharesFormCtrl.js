angular.module('openattic')
  .controller('VolumeNfsSharesFormCtrl', function ($scope, $state, $stateParams, NfsSharesService) {
    if(!$stateParams.share){
      $scope.share = {
        'volume': $scope.selection.item.id,
        'path':   $scope.selection.item.path,
        'address':  '',
        'options':  'rw,no_subtree_check,no_root_squash'
      };
      $scope.editing = false;

      $scope.submitAction = function() {
        NfsSharesService.save($scope.share)
          .$promise
          .then(function() {
            goToListView();
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    }
    else {
      $scope.editing = true;

      NfsSharesService.get({id: $stateParams.share})
        .$promise
        .then(function(res){
          $scope.share = res;
        }, function(error){
          console.log('An error occurred', error);
        });

      $scope.submitAction = function() {
        NfsSharesService.update({id: $scope.share.id}, $scope.share)
          .$promise
          .then(function() {
            goToListView();
          }, function(error){
            console.log('An error occured', error);
          });
      }
    }

    $scope.cancelAction = function() {
        goToListView();
    }

    var goToListView = function() {
        $state.go('volumes.detail.nfs');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
