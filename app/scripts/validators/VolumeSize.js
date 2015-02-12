angular.module('openattic')
  .directive('volumeSizeFormat', function(SizeParserService) {
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$validators.volumeSizeFormat = function(modelValue, viewValue){
          return ctrl.$isEmpty(modelValue) || SizeParserService.isValid(modelValue);
        };
      }
    };
  })
  .directive('volumeSizeValue', function(SizeParserService) {
    return {
      require: 'ngModel',
      scope: {
        maxValue: '@'
      },
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$validators.volumeSizeValue = function(modelValue, viewValue){
          if( !modelValue || !SizeParserService.isValid(modelValue) ){
            return; // don't care
          }
          var megs = SizeParserService.parseInt(modelValue),
              maxv = parseInt(scope.maxValue, 10);
          return !maxv || megs >= 100 && megs <= maxv;
        };
      }
    };
  });

