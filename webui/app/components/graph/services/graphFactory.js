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
app.service("graphFactory", function (graphConfigService, graphOptionsService) {
  var graphConfig = {};

  /**
   * Sets up the graph objects.
   * It extends each object with the default configuration, than it amends those the configured parts.
   *
   * @param {Object} graphs - looks like this:
   *    {
   *      graph1: {
   *        name: "name of the graph", // required
   *        bindings: ["array_of", "api_attribute_names"], // required
   *        yLabel: "y axis label name",
   *        xLabel: "x axis label name",
   *        tickFormat: function (value) {
   *          return value + " Byte";
   *        }
   *      },
   *      ...
   *    }
   */
  this.initializeGraphConfig = function (graphs) {
    graphConfig = angular.forEach(graphs, function (graph) {
      angular.extend(graph, {
        api: {},
        config: angular.copy(graphConfigService),
        data: [],
        options: angular.copy(graphOptionsService)
      });
      if (angular.isString(graph.yLabel)) {
        graph.options.chart.yAxis.axisLabel = graph.yLabel;
      } else {
        graph.options.chart.yAxis.axisLabel = graph.name;
      }
      if (angular.isString(graph.xLabel)) {
        graph.options.chart.xAxis.axisLabel = graph.xLabel;
      }
      if (angular.isFunction(graph.tickFormat)) {
        graph.options.chart.yAxis.tickFormat = graph.tickFormat;
      }
    });
  };

  /*
   * Generates graph out of the API response.
   *
   * graph.data has to be an Array with key-values objects to be rendered in nv3d.
   *
   * The default tickformat will convert the values to a human readable file size.
   *
   * @param {Object} item - API response consists of a key and values.
   * @param {string} item.key - Name of the graph.
   * @param {number[][]} item.values - Monitored values.
   */
  this.setUpGraphs = function (items) {
    angular.forEach(graphConfig, function (graph) {
      graph.data = items.filter(function (item) {
        return angular.isObject(item) && item.hasOwnProperty("key") && graph.bindings.indexOf(item.key) !== -1;
      });
      var chart = graph.options.chart;
      var item = graph.data[0];
      var domain = [
        d3.min(item.values)[0],
        d3.max(item.values)[0],
        0,
        d3.max(graph.data, function (item) {
          return d3.max(item.values.map(function (array) {
            return d3.max(array.slice(1));
          }));
        })
      ];
      chart.xDomain = [domain[0], domain[1]];
      chart.yDomain = [domain[2], Math.ceil((domain[3] + 2) * 1.1)];
    });
    angular.forEach(graphConfig, function (graph) {
      graph.api.update();
    });
  };
});
