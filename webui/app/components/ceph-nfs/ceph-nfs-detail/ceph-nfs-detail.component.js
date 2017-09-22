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

var app = angular.module("openattic.cephNfs");
app.component("cephNfsDetail", {
  template: require("./ceph-nfs-detail.component.html"),
  bindings: {
    selection: "<"
  },
  controller: function (cephNfsFsal, cephNfsAccessType) {
    var self = this;

    self.getFsalDesc = function (fsal) {
      var fsalItem = cephNfsFsal.find(function (currentFsalItem) {
        if (fsal === currentFsalItem.value) {
          return currentFsalItem;
        }
      });
      return angular.isDefined(fsalItem) ? fsalItem.descr : fsal;
    };

    self.getAccessTypeHelp = function (accessType) {
      var accessTypeItem = cephNfsAccessType.find(function (currentAccessTypeItem) {
        if (accessType === currentAccessTypeItem.value) {
          return currentAccessTypeItem;
        }
      });
      return angular.isDefined(accessTypeItem) ? accessTypeItem.help : "";
    };

    self.getMountCommand = function () {
      var command = "";
      if (angular.isDefined(self.selection.item) && self.selection.item !== null) {
        command = "# mount.nfs " +
          self.selection.item.host +
          ":";
        if (angular.isDefined(self.selection.item.pseudo) && self.selection.item.pseudo !== null) {
          command += self.selection.item.pseudo;
        } else if (angular.isDefined(self.selection.item.tag) && self.selection.item.tag !== null) {
          command += self.selection.item.tag;
        } else {
          command += self.selection.item.path;
        }
        command += " /mnt";
      }
      return command;
    };
  }
});
