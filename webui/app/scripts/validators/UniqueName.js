'use strict';

angular.module('openattic')
  .directive('uniquename', function(VolumeService, HostService, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var stop_timeout;
        ctrl.model=attrs.uniquename;

        return scope.$watch(function () {
          return ctrl.$modelValue;
        }, function (modelValue) {
          ctrl.$setValidity('uniquename', true);
          $timeout.cancel(stop_timeout);

          if (modelValue !== '' && typeof modelValue !== 'undefined') {
            stop_timeout = $timeout(function () {
              var model;
              switch(ctrl.model){
                case 'host':
                  model = HostService;
                  break;
                case 'volume':
                  model = VolumeService;
                  break;
                default:
                  console.log('Error: Service not implemented yet');
                  return;
              }
              model.query({'name': modelValue})
                .$promise
                .then(function (res) {
                  return ctrl.$setValidity('uniquename', res.length === 0);
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
