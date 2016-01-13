"use strict";

var app = angular.module("openattic");
app.filter("humanizeRuleNum", function (humanizeIntFilter) {
  var getRealNum = function (activeRuleset, step) {
    if (!step) {
      return;
    }
    if (step.num <= 0) {
      return {
        min: activeRuleset.min_size + step.num,
        max: activeRuleset.max_size + step.num
      };
    }

    return { min: step.num };
  };

  return function (inp, activeRuleset) {
    if (!inp || !activeRuleset) {
      return "";
    }
    var num = getRealNum(activeRuleset, inp);
    var ret = humanizeIntFilter(num.min);
    if (num.min === 0 && num.max > 0) {
      // if num is 0 but max is > 0, say "up to x" instead of "no to x"
      ret = "up";
    }
    if (num.max && num.min !== num.max) {
      ret += " to " + humanizeIntFilter(num.max);
    }
    return ret;
  };
});