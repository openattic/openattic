/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

var app = angular.module("openattic.graph");
app.component("graphCreationComponent", {
  templateUrl: "components/graph/templates/graphCreation.html",
  bindings: {
    /*
     *  config = {
     *    graphs: {...}, // Described in graphFactory.js. (needed)
     *    api: {
     *      call: function () {}, // Function to call the api from the service object. (needed)
     *      filterApi: function (selectedItem) { // Return object that the service function will filter.
     *        return {};
     *      },
     *      extractValues: function (apiResult, item) { // Return the array with the graph data.
     *        return [{"values":[], "key": "api_name"}];
     *      }
     *    }
     *  }
     */
    config: "<",
    selection: "="
  },
  controller: function ($scope, $interval, toasty, graphFactory) {
    var interval;
    var refreshInterval = 60000; // 1min
    var self = this;
    this.isLoading = false;

    this.$onInit = function () {
      graphFactory.initializeGraphConfig(self.config.graphs);
    };

    /*
     * Triggers the API with the filterApi and extractValues function if any.
     */
    this.getData = function () {
      var item = self.selection.items[0];
      var api = self.config.api;
      if (angular.isUndefined(item)) {
        return;
      }
      self.isLoading = true;
      api.call(angular.isFunction(api.filterApi) ? api.filterApi(item) : undefined)
        .$promise
        .then(function (res) {
          var values = angular.isFunction(api.extractValues) ? api.extractValues(res, item) : res;
          graphFactory.setUpGraphs(values);
        })
        .catch(function (err) {
          if ("detail" in err.data) {
            toasty.error({
              title: "Error " + err.status + " when loading performance data",
              msg: err.data.detail
            });
          }
          throw err;
        })
        .finally(function () {
          $interval(function () {
            self.isLoading = false;
          }, 1000, 1);
        });
    };

    /*
     * Starts or restarts the interval that refreshes the graphs.
     */
    this.startInterval = function () {
      self.stopInterval();
      interval = $interval(function () {
        self.getData();
      }, refreshInterval, false);
    };

    /*
     * Stops the interval.
     */
    this.stopInterval = function () {
      $interval.cancel(interval);
    };

    /*
     * Watches the selection for changes.
     * It will stop the interval if there is no selection and triggers the initialization if there is a selection.
     */
    $scope.$watch("$ctrl.selection.item", function (newValue) {
      if (newValue !== null) {
        self.getData();
        self.startInterval();
      } else {
        self.stopInterval();
      }
    });

    /*
     * Stops the interval if the scope is destroyed.
     * This happens if you click on another tab, list item or menu item,
     * but not if you deselect your selection.
     */
    this.$onDestroy = function () {
      self.stopInterval();
    };
  }
});
