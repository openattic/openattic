"use strict";

var app = angular.module("openattic");

app.value("widgetDefinitions", [
    {
        name: "Cluster Status",
        title: "Cluster Status",
        directive: "clusterstatuswidget",
        enableVerticalResize: false,
        size: {
            width: "100%"
        },
        settingsModalOptions: {
            lockHorizontalResize: true
        }
    }, {
        name: "openATTIC Wizards",
        title: "openATTIC Wizards",
        directive: "wizardselector",
        enableVerticalResize: false,
        size: {
            width: "50%"
        },
        style: {
            minWidth: "270px"
        }
    }, {
        name: "Volume Stats",
        title: "Volume Stats",
        directive: "volumestatwidget",
        enableVerticalResize: false,
        size: {
            width: "100%"
        }
    }, {
        name: "ToDos",
        title: "ToDos",
        directive: "todowidget",
        size: {
            width: "50%"
        },
        enableVerticalResize: false
    }
]);

app.value("defaultWidgets", [
    {
        name: "Cluster Status"
    }, {
        name: "openATTIC Wizards"
    }
]);

app.controller("DashboardCtrl", function ($scope, $window, widgetDefinitions, defaultWidgets) {
    if (!window.EventSource) {
        defaultWidgets.splice(_.findIndex(defaultWidgets, {name: "Cluster Status"}), 1);
    }

    $scope.dashboardOptions = {
        widgetButtons: false,
        widgetDefinitions: widgetDefinitions,
        defaultWidgets: defaultWidgets,
        storage: $window.localStorage,
        storageId: "oa_widgets",
        hideWidgetName: true,
        hideToolbar: true,
        hideWidgetSettings: true,
        hideWidgetClose: true
    };
});
