/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
app.factory("graphOptionsService", function () {
  return {
    chart: {
      color: ["#288cea", "#6430ec", "#ffdb1b", "#ffa21b", "#19f13f", "#ff2b1b"],
      forceY: [0],
      interpolate: "linear",
      legend: {
        vers: "furious",
        margin: {
          top: 3,
          right: 0,
          bottom: 10,
          left: -64
        },
        rightAlign: false
      },
      legendPosition: "top",
      margin: {
        top: 0,
        right: 0,
        bottom: 40,
        left: 80
      },
      type: "lineChart",
      useInteractiveGuideline: true,
      x: function (d) {
        return d[0];
      },
      xAxis: {
        axisLabel: "Time",
        fontSize: 11,
        showMaxMin: false,
        tickFormat: function (d) {
          return d3.time.format("%d.%m %H:%M")(new Date(d * 1000));
        }
      },
      y: function (d) {
        if (d[1] === null) {
          d[1] = 0;
        }
        return d[1];
      },
      yAxis: {
        axisLabel: "placeholder",
        axisLabelDistance: 20,
        fontSize: 11,
        tickFormat: function (d) {
          return d;
        }
      }
    }
  };
});
