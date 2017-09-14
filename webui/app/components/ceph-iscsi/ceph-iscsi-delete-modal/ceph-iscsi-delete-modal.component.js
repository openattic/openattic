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
"use strict";

var app = angular.module("openattic.cephIscsi");
app.component("cephIscsiDeleteModal", {
  templateUrl: "components/ceph-iscsi/ceph-iscsi-delete-modal/ceph-iscsi-delete-modal.component.html",
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: function ($q, cephIscsiService) {
    var self = this;

    self.delete = function () {
      return $q(function (resolve, reject) {
        var targetIds = [];
        self.resolve.iscsiTargetSelection.forEach(function (isciTarget) {
          targetIds.push(isciTarget.targetId);
        });
        cephIscsiService.bulk_delete({
          fsid: self.resolve.fsid,
          targetIds: targetIds
        })
          .$promise
          .then(function () {
            resolve();
            self.modalInstance.close("deleted");
          }, function () {
            reject();
          });
      });
    };

    self.cancel = function () {
      self.modalInstance.dismiss("cancel");
    };
  }
});
