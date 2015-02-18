angular.module('openattic.enterprise')
  .directive('cephPoolAttributesEditor', function(){
    return {
      restrict: 'E',
      templateUrl: 'enterprise_components/ceph_pool_attributes_editor/templates/editor.html'
    };
  });


// kate: space-indent on; indent-width 2; replace-tabs on;
