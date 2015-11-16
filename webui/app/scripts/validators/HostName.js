'use strict';

angular.module('openattic')
  .directive('uniqueHostName', function(HostService, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var stop_timeout;

        return scope.$watch(function () {
          return ctrl.$modelValue;
        }, function (modelValue) {
          ctrl.$setValidity('uniquename', true);
          $timeout.cancel(stop_timeout);

          if (modelValue !== '' && typeof modelValue !== 'undefined') {
            stop_timeout = $timeout(function () {
              HostService.query({'name': modelValue})
                .$promise
                .then(function (res) {
                  return ctrl.$setValidity('uniqueHostName', res.length === 0);
                })
                .catch(function (error) {
                  console.log('An error occurred', error);
                });
            }, 300);
          }
        });
      }
    };
  });
