angular.module('openattic')
  .controller('HostAttributesCtrl', function ($scope, $state, $stateParams, PeerHostService, InitiatorService) {
    $scope.data = {
      peerHostUrl: '',
      iscsiIqn: '',
      fcWwn: ''
    };

    $scope.host = $scope.selection.item;

    PeerHostService.get({host: $stateParams.host})
      .$promise
      .then(function(res){
        $scope.data.peerHost = res.results[0];
      }, function(error){
        console.log('An error occurred', error);
      });

    InitiatorService.get({host: $stateParams.host})
      .$promise
      .then(function(res){
        for( var i = 0; i < res.results.length; i++ ){
          if( res.results[i].type === 'iscsi' ){
            $scope.data.iscsi = res.results[i];
          }
          else{
            $scope.data.fc = res.results[i];
          }
        }
      }, function(error){
        console.log('An error occurred', error);
      });

    $scope.submitAction = function() {
    }

    $scope.cancelAction = function() {
        goToListView();
    }

    var goToListView = function() {
        $state.go('hosts');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
