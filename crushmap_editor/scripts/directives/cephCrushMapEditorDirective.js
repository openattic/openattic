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

        $scope.repsize = 3;
        $scope.$watch('repsize', function(repsize){
          if( $scope.activeRuleset ){
            if( repsize < $scope.activeRuleset.min_size ){
              $scope.repsize = $scope.activeRuleset.min_size;
            }
            if( repsize > $scope.activeRuleset.max_size ){
              $scope.repsize = $scope.activeRuleset.max_size;
            }
          }
        });

        $scope.$watch('activeRuleset', function(activeRuleset){
          var checkNode, checksteps, c, init, prev_step_count;
          if( !$scope.cluster ){
            return;
          }
          $scope.repsize = activeRuleset.min_size;
          var checkNode = function(steps, node, isBelowRootNode, init){
            var step, i;

            if(init){
              node.isRootNode      = false;
              node.isBelowRootNode = false;
              node.isSelectorNode  = false;
              node.nextStep        = null;
            }

            if( steps.length > 0 ){
              step = steps[0];
              if(step.op === 'take'){
                if( step.item === node.ceph_id ){
                  node.isRootNode = true;
                  isBelowRootNode = true;
                  node.nextStep = steps[1];
                  steps.shift();
                }
              }
              else if(step.op === 'choose_firstn' || step.op === 'chooseleaf_firstn'){
                node.isBelowRootNode = isBelowRootNode;
                if( step.type === node.type ){
                  node.isSelectorNode = true;
                  node.nextStep = steps[1];
                  steps.shift();
                }
              }
              if(steps[0].op === 'emit' && node.children.length === 0 ){
                steps.shift();
              }
            }
            for( i = 0; i < node.children.length; i++ ){
              checkNode(steps, node.children[i], isBelowRootNode, init);
            }
          };

          checksteps = (activeRuleset ? activeRuleset.steps.slice() : []);
          init = true;
          do{
            prev_step_count = checksteps.length;
            for( c = 0; c < $scope.cluster.crush_map.length; c++ ){
              checkNode(checksteps, $scope.cluster.crush_map[c], false, init);
            }
            init = false;
            console.log(checksteps);
            if( checksteps.length >= prev_step_count ){
              // Safety measure: checkNode should consume a coupl'a steps. If it
              // didn't, something seem to be wrong.
              throw "The CRUSH map renderer seems unable to render this CRUSH map ruleset."
            }
          } while(checksteps.length > 0);
        });

        $scope.getRealNum = function(step){
          if( !step ) return;
          if( step.num <= 0 ){
            return step.num + $scope.repsize;
          }
          return step.num;
        }
      }
    };
  });


// kate: space-indent on; indent-width 2; replace-tabs on;
