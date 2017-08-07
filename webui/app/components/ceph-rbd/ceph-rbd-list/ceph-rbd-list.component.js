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

var app = angular.module("openattic.cephRbd");
app.component("cephRbdList", {
  templateUrl: "components/ceph-rbd/ceph-rbd-list/ceph-rbd-list.component.html",
  controller: function ($scope, $state, $filter, $uibModal, cephRbdService,
      registryService, cephPoolsService, Notification, oaTabSetService) {
    var self = this;

    self.registry = registryService;
    self.cluster = undefined;
    self.rbd = {};
    self.error = false;

    self.filterConfig = {
      page: 0,
      entries: 10,
      search: "",
      sortfield: null,
      sortorder: null
    };

    self.selection = {};

    self.onClusterLoad = function (cluster) {
      self.cluster = cluster;
    };

    self.getRbdList = function () {
      if (self.cluster.results.length > 0 && self.registry.selectedCluster) {
        var obj = $filter("filter")(self.cluster.results, {
          fsid: self.registry.selectedCluster.fsid
        }, true);
        if (obj.length === 0) {
          self.registry.selectedCluster = self.cluster.results[0];
        }

        self.rbd = {};
        self.error = false;

        cephRbdService
          .get({
            fsid: self.registry.selectedCluster.fsid,
            page: self.filterConfig.page + 1,
            pageSize: self.filterConfig.entries,
            search: self.filterConfig.search,
            ordering: (self.filterConfig.sortorder === "ASC" ? "" : "-") +
              self.filterConfig.sortfield
          })
          .$promise
          .then(function (res) {
            self.rbdError = false;
            cephPoolsService.get({
              fsid: self.registry.selectedCluster.fsid
            }).$promise.then(function (pools) {
              self.poolError = false;
              res.results.forEach(function (rbd) {
                pools.results.some(function (pool) {
                  if (pool.id === rbd.pool) {
                    rbd.pool = pool;
                    return true;
                  }
                });
                rbd.free = rbd.size - rbd.used_size;
                rbd.usedPercent = rbd.used_size / rbd.size * 100;
                rbd.freePercent = rbd.free / rbd.size * 100;
              });
              self.rbd = res;
            }).catch(function (error) {
              self.poolError = error;
            });
          })
          .catch(function (error) {
            self.rbdError = error;
          });
      }
    };

    self.tabData = {
      active: 0,
      tabs: {
        status: {
          show: "$ctrl.selection.item",
          state: "cephRbds.detail.details",
          class: "tc_statusTab",
          name: "Status"
        },
        statistics: {
          show: "$ctrl.selection.item",
          state: "cephRbds.detail.statistics",
          class: "tc_statisticsTab",
          name: "Statistics"
        }
      }
    };
    self.tabConfig = {
      type: "cephRbds",
      linkedBy: "id",
      jumpTo: "more"
    };

    $scope.$watch("$ctrl.filterConfig", function (newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        return;
      }

      self.getRbdList();
    }, true);

    self.onSelectionChange = function (selection) {
      self.selection = selection;
      var items = selection.items;

      self.multiSelection = items && items.length > 1;
      self.hasSelection = items && items.length === 1;

      if (!items || items.length !== 1) {
        $state.go("cephRbds");
        return;
      }

      if ($state.current.name === "cephRbds") {
        oaTabSetService.changeTab("cephRbds.detail.details", self.tabData,
          self.tabConfig, selection);
      } else {
        oaTabSetService.changeTab($state.current.name, self.tabData,
          self.tabConfig, selection);
      }
    };

    self.addAction = function () {
      $state.go("cephRbds-add", {
        fsid: self.registry.selectedCluster.fsid
      });
    };

    self.deleteAction = function () {
      if (!self.hasSelection && !self.multiSelection) {
        return;
      }
      var modalInstance = $uibModal.open({
        windowTemplateUrl: "templates/messagebox.html",
        component: "cephRbdDeleteModal",
        resolve: {
          fsid: function () {
            return self.registry.selectedCluster.fsid;
          },
          rbdSelection: function () {
            return self.selection.items;
          }
        }
      });

      modalInstance.result.then(function () {
        self.filterConfig.refresh = new Date();
      });
    };
  }
});
