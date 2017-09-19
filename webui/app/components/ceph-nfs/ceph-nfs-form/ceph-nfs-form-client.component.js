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
app.component("cephNfsFormClient", {
  template: require("./ceph-nfs-form-client.component.html"),
  bindings: {
    clientBlocks: "<",
    form: "<",
    accessType: "<",
    squash: "<"
  },
  controller: function ($timeout, cephNfsAccessType, cephNfsSquash) {
    var self = this;

    self.cephNfsAccessType = cephNfsAccessType;
    self.cephNfsSquash = cephNfsSquash;

    self.addClient = function (clientBlock) {
      clientBlock.clients.push("");
      $timeout(function () {
        var clientsInputs = jQuery("#clients input");
        clientsInputs[clientsInputs.length - 1].focus();
      });
    };

    self.getNoAccessTypeDescr = function (clientBlock) {
      if (!clientBlock.accessType && self.accessType) {
        return self.accessType + " (inherited from global config)";
      }
      return "-- Select the access type --";
    };

    self.getAccessTypeHelp = function (accessType) {
      var accessTypeItem = cephNfsAccessType.find(function (currentAccessTypeItem) {
        if (accessType === currentAccessTypeItem.value) {
          return currentAccessTypeItem;
        }
      });
      return angular.isDefined(accessTypeItem) ? accessTypeItem.help : "";
    };

    self.getNoSquashDescr = function (clientBlock) {
      if (!clientBlock.squash && self.squash) {
        return self.squash + " (inherited from global config)";
      }
      return "-- Select what kind of user id squashing is performed --";
    };

    self.removeClientBlock = function (index) {
      self.clientBlocks.splice(index, 1);
    };

    self.addClientBlock = function () {
      self.clientBlocks.push({
        clients: "",
        accessType: "",
        squash: ""
      });
      $timeout(function () {
        jQuery("#clients" + (self.clientBlocks.length - 1)).focus();
      });
    };
  }
});
