'use strict';

angular.module('openattic')
  .value('widgetDefinitions', [{
    name: 'Cluster Status',
    title: 'Cluster Status',
    directive: 'clusterstatuswidget',
    enableVerticalResize: false,
    size: {
      width: '100%'
    },
    settingsModalOptions: {
      lockHorizontalResize: true
    }
  }, {
    name: 'openATTIC Wizards',
    title: 'openATTIC Wizards',
    directive: 'wizardselector',
    enableVerticalResize: false,
    size: {
      width: '50%'
    },
    style: {
      minWidth: '270px'
    }
  }, {
    name: 'Volume Stats',
    title: 'Volume Stats',
    directive: 'volumestatwidget',
    enableVerticalResize: false,
    size: {
      width: '100%'
    }
  }, {
    name: 'ToDos',
    title: 'ToDos',
    directive: 'todowidget',
    size: {
      width: '50%'
    },
    enableVerticalResize: false
  }])
  .value('defaultWidgets', [
    { name: 'Cluster Status' },
    { name: 'openATTIC Wizards' }
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
