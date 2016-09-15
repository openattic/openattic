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

var app = angular.module("openattic.runnersQ");
app.directive("runnersQ", function () {
  return {
    restrict: "A",
    controller: function ($scope, toasty, $uibModal) {
      //example
      $scope.randomList = function () {
        var sum = Math.floor(Math.random() * 80);
        var run = Math.floor(Math.random() * sum);
        var fin = Math.floor(Math.random() * (sum - run));
        var fail = sum - run - fin;
        var avr = run !== 0 ? run / sum * 100 : 0;
        var icons = ["fa-hourglass-o", "fa-hourglass-end", "fa-hourglass-half", "fa-hourglass-start"];
        var icon = run !== 0 ? icons[Math.floor(avr / 33.3) + 1] : icons[0];
        $scope.tasks = {
          sum: sum,
          run: run,
          fin: fin,
          fail: fail,
          avr: avr,
          icon: icon
        };
        $scope.tasks.pending = [];
        var today = new Date();
        var diff = new Date(today.getFullYear(), today.getMonth());
        var word = "eeeeeennniiissrraattddhhulcgmobwf";
        for (var i = 0; i < run; i++) {
          var runtime = Math.floor(Math.random() * (today.getTime() - diff.getTime()));
          var started = new Date( runtime + diff.getTime());
          var done = Math.floor(Math.random() * 100);
          if (done === 0) {
            done = 1;
          }
          var approx = new Date(Math.floor((100 / done) * (runtime / 1000)));
          var days = approx.getDate() - 1;
          var h = approx.getHours() - 1;
          var m = approx.getMinutes();
          var approxFormat = (days > 0) ? days + "d " : "";
          approxFormat += (h > 0) ? h + "h " : "";
          approxFormat += (approxFormat !== "" || m > 0) ? m + "m" : "< 1m";
          var name = "";
          for (var j = 0; j < Math.floor(Math.random() * 6) + 3; j++) {
            name += word[Math.floor(Math.random() * word.length)];
          }
          $scope.tasks.pending.push({
            name: "Create ceph pool '" + name + "'",
            started: started,
            done: done,
            approx: approx,
            approxFormat: approxFormat
          });
        }
        console.log($scope.tasks);
      };

      $scope.randomList();

      $scope.runnersDialog = function (selection) {
        var modalInstance = $uibModal.open({
          windowTemplateUrl: "templates/messagebox.html",
          templateUrl: "components/runnersQ/templates/runners-q-dialog.html",
          controller: "RunnersQModalCtrl",
          size: 'lg',
          resolve: {
            tasks: function () {
              return $scope.tasks;
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.filterConfig.refresh = new Date();
        });
      };
    },
    templateUrl: "components/runnersQ/templates/runners-q.html"
  };
});
