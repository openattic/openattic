angular.module('openattic.extensions')
  .directive('cephCrushStepset', function(){
    return {
      restrict: 'E',
      templateUrl: 'extensions/crushmap_editor/templates/crushStepset.html',
      scope: {
        "stepset": "=",
        "rule":    "=",
        "cluster": "="
      },
      controller: function($scope){
        if( $scope.stepset.num === 0 ){
          $scope.replicas_source = 'fix';
          $scope.replicas_pos = 1;
          $scope.replicas_neg = 1;
        }
        else if( $scope.stepset.num < 0 ){
          $scope.replicas_source = 'neg';
          $scope.replicas_pos = -$scope.stepset.num;
          $scope.replicas_neg = -$scope.stepset.num;
        }
        else{
          $scope.replicas_source = 'pos';
          $scope.replicas_pos = $scope.stepset.num;
          $scope.replicas_neg = $scope.stepset.num;
        }

        $scope.$watchGroup(['replicas_source', 'replicas_pos', 'replicas_neg'], function(){
          if($scope.replicas_source == 'fix'){
            $scope.stepset.num = 0;
          }
          else if($scope.replicas_source == 'pos'){
            $scope.stepset.num = $scope.replicas_pos;
          }
          else if($scope.replicas_source == 'neg'){
            $scope.stepset.num = -$scope.replicas_neg;
          }
        });

        $scope.getRealNum = function(step){
          if( !step ) return;
          if( step.num <= 0 ){
            return {
              min: $scope.rule.min_size + step.num,
              max: $scope.rule.max_size + step.num
            };
          }
          return {
            min: step.num
          };
        };

      }
    };
  });



// kate: space-indent on; indent-width 2; replace-tabs on;
