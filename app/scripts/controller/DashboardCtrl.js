'use strict';

angular.module('openattic')
  .value('widgetDefinitions', [{
      name: 'Volume Stats',
      title: 'Volume Stats',
      directive: 'volumestatwidget'
    }, {
      name: 'Clock',
      title: 'Clock',
      directive: 'clockwidget',
      size: {
        width: '15%'
      }
    }, {
      name: 'ToDos',
      title: 'ToDos',
      directive: 'todowidget'
    }
  ])
  .value('defaultWidgets', [
    { name: 'Volume Stats' },
    { name: 'Clock' },
    { name: 'ToDos' }
  ])
  .controller('DashboardCtrl', function ($scope, $window, widgetDefinitions, defaultWidgets){
    $scope.dashboardOptions = {
      widgetButtons: false,
      widgetDefinitions: widgetDefinitions,
      defaultWidgets: defaultWidgets,
      storage: $window.localStorage,
      storageId: 'oa_widgets',
      hideWidgetName: true
    };
  });
// kate: space-indent on; indent-width 2; replace-tabs on;
