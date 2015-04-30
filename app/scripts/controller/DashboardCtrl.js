'use strict';

angular.module('openattic')
  .value('widgetDefinitions', [{
      name: 'Volume Stats',
      title: 'Volume Stats',
      directive: 'volumestatwidget',
      size: {
        width: '100%'
      }
    }, {
      name: 'Clock',
      title: 'Clock',
      directive: 'clockwidget',
      size: {
        width: '245px'
      }
    }, {
      name: 'ToDos',
      title: 'ToDos',
      directive: 'todowidget'
    }, {
      name: 'openATTIC Wizards',
      title: 'openATTIC Wizards',
      directive: 'wizardselector'
    }
  ])
  .value('defaultWidgets', [
    { name: 'Volume Stats' },
    { name: 'ToDos' },
    { name: 'openATTIC Wizards'}
  ])
  .controller('DashboardCtrl', function ($scope, $window, widgetDefinitions, defaultWidgets){
    $scope.dashboardOptions = {
      widgetButtons: false,
      widgetDefinitions: widgetDefinitions,
      defaultWidgets: defaultWidgets,
      storage: $window.localStorage,
      storageId: 'oa_widgets',
      hideWidgetName: true,
      hideToolbar: true,
      hideWidgetSettings: true,
      hideWidgetClose: true
    };
  });
// kate: space-indent on; indent-width 2; replace-tabs on;
