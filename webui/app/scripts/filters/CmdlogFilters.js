angular.module('openattic')
  .filter('shortlog', function() {
    'use strict';
    return function(inp) {
      var lines = inp.split('\n');
      if (lines.length <= 5) {
        return lines.join('<br />');
      }

      return [lines[0], lines[1], '...', lines[lines.length - 2], lines[lines.length - 1]].join('<br />');
    };
  });