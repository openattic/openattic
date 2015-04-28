angular.module('openattic.extensions')
  .directive('cephCrushMapEditor', function(){
    return {
      restrict: 'E',
      templateUrl: 'extensions/crushmap_editor/templates/editor.html',
      controller: function($scope, ClusterResource){
        $scope.query = function(){
          $scope.clusters = ClusterResource.query(function(clusters){
            if(clusters.length === 1){
              $scope.cluster = clusters[0];
            }
            else{
              $scope.cluster = null;
            }
          });
        };
        $scope.query();

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
          var resetNodes, renderNodes, rendersteps, s, step, stepset, init, prevStepCount;
          if( !$scope.cluster ){
            return;
          }
          $scope.repsize = 3;
          $scope.stepsets = [];
          if( activeRuleset ){
            // Force sensible min/max
            if( activeRuleset.min_size < 1 ){
              activeRuleset.min_size = 1;
            }
            if( activeRuleset.max_size < activeRuleset.min_size ){
              activeRuleset.max_size = activeRuleset.min_size;
            }
            // Try to keep the repsize to 3 if the ruleset allows it
            if( activeRuleset.min_size <= 3 && 3 <= activeRuleset.max_size ){
              $scope.repsize = 3;
            }
            // It does not. Try 2...
            else if( activeRuleset.min_size <= 2 && 2 <= activeRuleset.max_size ){
              $scope.repsize = 2;
            }
            // Seems we'll just have to use whatever the minimum is then :(
            else{
              $scope.repsize = activeRuleset.min_size;
            }
            // Split the steps into stepsets, where each describes steps from "take" to "emit".
            for(s = 0; s < activeRuleset.steps.length; s++){
              step = activeRuleset.steps[s];
              if( step.op === 'take' ){
                stepset = {};
                stepset.take = step.item_name;
              }
              else if( step.op === 'choose_firstn' ){
                stepset.groupbytype = step.type;
              }
              else if( step.op === 'chooseleaf_firstn' ){
                stepset.acrosstype = step.type;
                stepset.replicas = $scope.getRealNum(step);
              }
              else if( step.op === 'emit' ){
                $scope.stepsets.push(stepset);
              }
            }
          }
          resetNodes = function(nodes){
            var i, node;
            for( i = 0; i < nodes.length; i++ ){
              node = nodes[i];
              node.isRootNode      = false;
              node.isBelowRootNode = false;
              node.isSelectorNode  = false;
              node.nextStep        = null;
              resetNodes(node.children);
            }
          };
          renderNodes = function(steps, nodes, isBelowRootNode){
            var i, node, substeps;

            for( i = 0; i < nodes.length; i++ ){
              substeps = steps;
              node = nodes[i];

              if(steps[0].op === 'take'){
                if( steps[0].item === node.ceph_id ){
                  node.isRootNode = true;
                  isBelowRootNode = true;
                  node.nextStep = steps[1];
                  steps.shift();
                }
              }
              else if(steps[0].op === 'choose_firstn' || steps[0].op === 'chooseleaf_firstn'){
                node.isBelowRootNode = isBelowRootNode;
                if( steps[0].type === node.type ){
                  typeMatch = true;
                  node.isSelectorNode = true;
                  node.nextStep = steps[1];
                  substeps = steps.slice();
                  substeps.shift();
                }
              }
              if( node.children.length > 0 ){
                renderNodes(substeps, node.children, isBelowRootNode);
              }
              if( node.isRootNode ){
                while(steps.length > 0 && steps[0].op !== 'take'){
                  steps.shift();
                }
              }
              if(steps.length === 0){
                return;
              }
            }
          };

          rendersteps = (activeRuleset ? activeRuleset.steps.slice() : []);
          resetNodes($scope.cluster.crush_map);
          while(rendersteps.length > 0){
            prevStepCount = rendersteps.length;
            renderNodes(rendersteps, $scope.cluster.crush_map, false);
            if( rendersteps.length >= prevStepCount ){
              // Safety measure: renderNodes should consume a coupl'a steps. If it
              // didn't, something seems to be wrong.
              throw 'The CRUSH map renderer seems unable to render this CRUSH map ruleset.';
            }
          }
        }, true);

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
