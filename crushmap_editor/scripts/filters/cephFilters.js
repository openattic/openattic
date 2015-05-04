angular.module('openattic')
  .filter('humanizeRuleNum', function(humanizeIntFilter) {
    'use strict';

    var getRealNum = function(activeRuleset, step){
      if( !step ) return;
      if( step.num <= 0 ){
        return {
          min: activeRuleset.min_size + step.num,
          max: activeRuleset.max_size + step.num
        };
      }
      return {
        min: step.num
      };
    };

    return function(inp, activeRuleset) {
      if( !inp || !activeRuleset ) return '';
      var num = getRealNum(activeRuleset, inp);
      var ret = humanizeIntFilter(num.min);
      if( num.max ){
        ret += " to " + humanizeIntFilter(num.max);
      }
      return ret;
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
