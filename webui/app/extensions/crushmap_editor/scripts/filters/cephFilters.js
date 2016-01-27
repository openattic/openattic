/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
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