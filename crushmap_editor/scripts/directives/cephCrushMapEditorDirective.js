angular.module('openattic.extensions')
  .directive('cephCrushMapEditor', function(){
    return {
      restrict: 'E',
      templateUrl: 'extensions/crushmap_editor/templates/editor.html',
      controller: function($scope, ClusterResource){
        $scope.clusters = ClusterResource.query(function(clusters){
          if(clusters.length === 1){
            $scope.cluster = clusters[0];
          }
          else{
            $scope.cluster = null;
          }
        });
      }
    };
  });


// kate: space-indent on; indent-width 2; replace-tabs on;
