angular.module('openattic.extensions')
  .directive('cephPoolAttributesEditor', function(){
    return {
      restrict: 'E',
      templateUrl: 'extensions/ceph_pool_attributes_editor/templates/editor.html'
    };
  });


// kate: space-indent on; indent-width 2; replace-tabs on;
