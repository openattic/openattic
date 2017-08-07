/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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
'use strict';

angular.module('openattic.grafana').component('grafana', {
  templateUrl: 'components/grafana/grafana.component.html',
  bindings: {
    data: '<',
    mode: '<'
  },
  controller: function GrafanaController($interval) {
    var vm = this;
    vm.baseUrl = 'api/grafana/';
    vm.dashboardName = '';
    vm.src = '';
    vm.urlParameterName = '';
    vm.resizePromise = undefined;

    /**
     * Set some information to determine the correct iframe source
     */
    vm.$onInit = function () {
      /*
       * Check the given mode and set the correct dashboard name and url parameter name
       */
      switch (vm.mode) {
        case 'rbd':
          vm.dashboardName = 'ceph-rbd';
          vm.urlParameterName = 'var-rbd';
          break;
        case 'pool':
          vm.dashboardName = 'ceph-pools';
          vm.urlParameterName = 'var-pool';
          break;
        case 'osd':
          vm.dashboardName = 'ceph-osd';
          vm.urlParameterName = 'var-osd';
          break;
        case 'node':
          vm.dashboardName = 'node-statistics';
          vm.urlParameterName = 'var-instance';
          break;

        default:
          vm.dashboardName = 'ceph-cluster';
          vm.mode = 'dashboard';
          break;
      }

      /*
       * Set src of the iframe.
       */
      if (vm.mode === 'dashboard') {
        vm.src = vm.baseUrl + 'dashboard/db/' + vm.dashboardName;
      } else {
        vm.src = vm.baseUrl + 'dashboard/db/' + vm.dashboardName + '?' + vm.urlParameterName + '=' + vm.data;
      }

      vm.resizePromise = $interval(vm.resize, 500);
    };

    vm.$onChanges = function (values) {
      // Only update the source if binding 'data' changes
      if (angular.isDefined(values.data)) {
        vm.src = vm.src.replace(values.data.previousValue, values.data.currentValue);
      }
    };

    vm.$onDestroy = function () {
      $interval.cancel(vm.resizePromise);
    };

    /**
     * Resize the iframe in a certain period of time
     */
    vm.resize = function () {
      // Use height of the main-view div, because that's the div of the content
      var h = $('.grafana').contents().find('.main-view').height();
      $('.grafana').height(h);
    };
  }
});
