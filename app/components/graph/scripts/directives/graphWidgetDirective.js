angular.module('openattic.graph')
  .directive('graphWidget', function(){
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            params: '='
        },
        templateUrl: 'components/graph/templates/graphWidget.html',
        controller: function($scope, GraphProfileService){
            $scope.profiles = GraphProfileService.getProfiles();

            $scope.setActiveProfile = function(profile){
                $scope.params.profile = profile;
                delete $scope.params['start'];
                delete $scope.params['end'];
            }
        }
    };
});

// kate: space-indent on; indent-width 4; replace-tabs on;
