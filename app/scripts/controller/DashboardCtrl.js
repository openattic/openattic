'use strict';

angular.module('openattic')
  .value('widgetDefinitions', [{
      name: 'volumes',
      directive: 'volumewidget'
    }
  ])
  .value('defaultWidgets', [
    { name: 'volumes' }
  ])
  .controller('DashboardCtrl', function ($scope, $window, widgetDefinitions, defaultWidgets){
    $scope.dashboardOptions = {
      widgetButtons: true,
      widgetDefinitions: widgetDefinitions,
      defaultWidgets: defaultWidgets,
      storage: $window.localStorage,
      storageId: 'oa_widgets'
    };
  });
// kate: space-indent on; indent-width 2; replace-tabs on;
