angular.module('openattic')
  .filter('humanizeInt', function() {
    'use strict';
    return function(inp) {
      inp = parseInt(inp, 10);
      if( inp < 0 || inp > 12 ){
        return inp;
      }
      return {
        0: 'no',
        1: 'one',
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
        6: 'six',
        7: 'seven',
        8: 'eight',
        9: 'nine',
        10: 'ten',
        11: 'eleven',
        12: 'twelve'
      }[inp];
    };
  });
