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

        $scope.setActiveRuleset = function(activeRuleset){
          $scope.activeRuleset = activeRuleset;
        };
        $scope.setActiveRuleset(null);

        $scope.$watch('activeRuleset', function(activeRuleset){
          if( !$scope.cluster ){
            return;
          }
          var checkNode = function(steps, node, isBelowRootNode){
            var step, i;

            node.isRootNode      = false;
            node.isBelowRootNode = false;
            node.isSelectorNode  = false;

            if( steps.length > 0 ){
              step = steps[0];
              if(step.op === 'take'){
                if( step.item === node.ceph_id ){
                  node.isRootNode = true;
                  isBelowRootNode = true;
                  steps = steps.slice();
                  steps.shift();
                }
              }
              else if(step.op === 'choose_firstn' || step.op === 'chooseleaf_firstn'){
                node.isBelowRootNode = isBelowRootNode;
                if( step.type === node.type ){
                  node.isSelectorNode = true;
                  steps = steps.slice();
                  steps.shift();
                }
              }
            }
            for( i = 0; i < node.children.length; i++ ){
              checkNode(steps, node.children[i], isBelowRootNode);
            }
          };
          for( var c = 0; c < $scope.cluster.crush_map.length; c++ ){
            checkNode( (activeRuleset ? activeRuleset.steps : []), $scope.cluster.crush_map[c], false);
          }
        });
      }
    };
  });


// kate: space-indent on; indent-width 2; replace-tabs on;
