angular.module('openattic.extensions')
  .directive('cephCrushMapEditor', function(){
    return {
      restrict: 'E',
      templateUrl: 'extensions/crushmap_editor/templates/editor.html',
      controller: function($scope, ClusterResource){
        $scope.query = function(){
          $scope.clusters = ClusterResource.query(function(clusters){
            $scope.cluster = clusters[0];
          });
        };
        $scope.query();

        $scope.setActiveRuleset = function(activeRuleset){
          $scope.activeRuleset = activeRuleset;
        };
        $scope.setActiveRuleset(null);

        $scope.repsize = 3;

        $scope.findNodeByName = function(name){
          var node = null;
          var iterfn = function(item){
            if( item.name === name ){
              node = item;
            }
            else{
              item.items.map(iterfn);
            }
          };
          $scope.cluster.crushmap.crushmap.buckets.map(iterfn);
          return node;
        };
        $scope.findTypeByName = function(name){
          return $scope.cluster.crushmap.crushmap.types.find(function(item){
            return item.name === name
          });
        };

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
          // Standard (non-deep) watcher
          $scope.newstepset = {
            take:       $scope.findNodeByName('default'),
            acrosstype: $scope.findTypeByName('host'),
            groupbytype: null,
            num:        0,
          };
          $scope.replicas_pos = 1;
          $scope.replicas_neg = 1;
          $scope.replicas_source = 'fix';
          $scope.addnewrule = false;
        }, false);

        $scope.$watch('activeRuleset', function(activeRuleset){
          // deep watcher that keeps track of min/max sanity etc
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
                stepset.take = $scope.findNodeByName(step.item_name);
              }
              else if( step.op === 'choose_firstn' ){
                stepset.groupbytype = step.type;
              }
              else if( step.op === 'chooseleaf_firstn' ){
                stepset.acrosstype = step.type;
                stepset.num = step.num;
                stepset.replicas = $scope.getRealNum(stepset);
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
              resetNodes(node.items);
            }
          };
          renderNodes = function(steps, nodes, isBelowRootNode){
            var i, node, substeps;

            for( i = 0; i < nodes.length; i++ ){
              substeps = steps;
              node = nodes[i];

              if(steps[0].op === 'take'){
                if( steps[0].item === node.id ){
                  node.isRootNode = true;
                  isBelowRootNode = true;
                  node.nextStep = steps[1];
                  steps.shift();
                }
              }
              else if(steps[0].op === 'choose_firstn' || steps[0].op === 'chooseleaf_firstn'){
                node.isBelowRootNode = isBelowRootNode;
                if( steps[0].type === node.type_name ){
                  typeMatch = true;
                  node.isSelectorNode = true;
                  node.nextStep = steps[1];
                  substeps = steps.slice();
                  substeps.shift();
                }
              }
              if( node.items.length > 0 ){
                renderNodes(substeps, node.items, isBelowRootNode);
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
          resetNodes($scope.cluster.crushmap.crushmap.buckets);
          while(rendersteps.length > 0){
            prevStepCount = rendersteps.length;
            renderNodes(rendersteps, $scope.cluster.crushmap.crushmap.buckets, false);
            if( rendersteps.length >= prevStepCount ){
              // Safety measure: renderNodes should consume a coupl'a steps. If it
              // didn't, something seems to be wrong.
              throw 'The CRUSH map renderer seems unable to render this CRUSH map ruleset.';
            }
          }
        }, true);

        $scope.treeOptions = {
          accept: function(sourceNodeScope, destNodesScope, destIndex) {
            return sourceNodeScope.$modelValue.type_id < destNodesScope.$parent.$modelValue.type_id;
          },
        };

        $scope.$watchGroup(['replicas_source', 'replicas_pos', 'replicas_neg'], function(){
          if($scope.replicas_source == 'fix'){
            $scope.newstepset.num = 0;
          }
          else if($scope.replicas_source == 'pos'){
            $scope.newstepset.num = $scope.replicas_pos;
          }
          else if($scope.replicas_source == 'neg'){
            $scope.newstepset.num = -$scope.replicas_neg;
          }
        });

        $scope.getRealNum = function(step){
          if( !step ) return;
          if( step.num <= 0 ){
            return {
              min: $scope.activeRuleset.min_size + step.num,
              max: $scope.activeRuleset.max_size + step.num
            };
          }
          return {
            min: step.num
          };
        };

        $scope.treeNodeClicked = function(node){
          if( $scope.edittakenode ){
            $scope.newstepset.take = node;
            $scope.edittakenode = false;
          }
        };
      }
    };
  });


// kate: space-indent on; indent-width 2; replace-tabs on;
