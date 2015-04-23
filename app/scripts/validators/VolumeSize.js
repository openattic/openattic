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

          var megs = SizeParserService.parseInt(modelValue),
              maxv = parseInt(scope.maxValue, 10),
              minv = parseInt(scope.minValue, 10) || 100;

          return !maxv || megs >= minv && megs <= maxv;
        };
      }
    };
  });