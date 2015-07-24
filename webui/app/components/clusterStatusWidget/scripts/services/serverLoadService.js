'use strict';

angular.module('openattic.clusterstatuswidget').factory('serverLoadService', function($resource) {
    return $resource('/openattic/api/services/1/fetch?srcname=load1', {}, {});
});