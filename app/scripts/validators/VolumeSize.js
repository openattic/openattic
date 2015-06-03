angular.module('openattic')
  .directive('volumeSizeFormat', function(SizeParserService) {
    'use strict';

    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$validators.volumeSizeFormat = function(modelValue){
          return ctrl.$isEmpty(modelValue) || SizeParserService.isValid(modelValue);
        };
      }
    };
  })
  .directive('volumeSizeValue', function(SizeParserService) {
    'use strict';

    return {
      require: 'ngModel',
      scope: {
        maxValue: '@',
        minValue: '@'
      },
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$validators.volumeSizeValue = function(modelValue){
          if( !modelValue || !SizeParserService.isValid(modelValue) ){
            return true;
          }

          var megs = SizeParserService.parseFloat(modelValue),
              maxv = parseFloat(scope.maxValue),
              minv = parseFloat(scope.minValue) || 100;

          return !maxv || megs >= minv && megs <= maxv;
        };
      }
    };
  });