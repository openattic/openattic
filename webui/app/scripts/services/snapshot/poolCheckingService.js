angular.module('openattic')
  .factory('poolCheckingService', function(PoolService){
    var saved = {source:'', pool:'', special: false};

    function get(selection){
      if (!selection.item || !selection.item.source_pool){
        return;
      }
      var source = selection.item.source_pool;
      if (angular.equals(saved.source, source)){
        return saved;
      }
      new PoolService.get(source).$promise.then(
        function(res){
          saved.source = source
          saved.pool = res.type;
          if(!saved.pool){
            return;
          }
          var pool = saved.pool.app_label;
          saved.special = pool === 'zfs' || pool === 'btrfs';
        }
      );
      return saved;
    }
    return {
      get: get
    }
  })
