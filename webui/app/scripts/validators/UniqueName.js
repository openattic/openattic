'use strict';

angular.module('openattic')
  .directive('uniquename', function(VolumeService, HostService, UserService, $timeout){
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl){
        var stop_timeout;
        ctrl.model = attrs.uniquename;
        ctrl.field = attrs.name;

        return scope.$watch(function(){
          return ctrl.$modelValue;
        }, function(modelValue){
          ctrl.$setValidity('uniquename', true);
          $timeout.cancel(stop_timeout);

          if(modelValue === '' || typeof modelValue === 'undefined'){
            return;
          }
          stop_timeout = $timeout(function(){
            var model;
            var current;
            var query = {};
            switch(ctrl.model){
              case 'host':
                model = HostService;
                current = scope.host.id;
                break;
              case 'volume':
                model = VolumeService;
                break;
              case 'user':
                model = UserService;
                current = scope.user.id;
                break;
              default:
                console.log('Error: Service not implemented yet.');
                return;
            }
            query[ctrl.field] = modelValue;
            model.query(query)
              .$promise
              .then(function (res) {
                if(res.length !== 0 && current){
                  ctrl.$setValidity('uniquename', res[0].id === current);
                }else{
                  ctrl.$setValidity('uniquename', res.length === 0);
                }
              })
              .catch(function (error) {
                console.log('An error occurred', error);
              });
          }, 300);
        });
      }
    };
  });
