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
app.component("cephIscsiFormImageSettingsModal", {
  templateUrl: "components/ceph-iscsi/ceph-iscsi-form/ceph-iscsi-form-image-settings-modal.component.html",
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: function (cephIscsiImageAdvangedSettings) {
    var self = this;

    self.image = self.resolve.image;
    self.cephIscsiImageAdvangedSettings = cephIscsiImageAdvangedSettings;

    self.settings = angular.copy(self.image.settings);

    self.advancedSettingsEnabled = cephIscsiImageAdvangedSettings.some(function (value) {
      return self.settings.hasOwnProperty(value.property);
    });

    self.confirm = function () {
      angular.forEach(self.settings, function (value, key) {
        if (value === "" || value === null) {
          delete self.settings[key];
        } else if (key === "retry_errors" && angular.isString(self.settings[key])) {
          self.settings[key] = angular.fromJson("[" + value + "]");
        }
      });
      if (!self.advancedSettingsEnabled) {
        angular.forEach(cephIscsiImageAdvangedSettings, function (value) {
          delete self.settings[value.property];
        });
      }
      self.image.settings = self.settings;
      self.modalInstance.close("confirmed");
    };

    self.cancel = function () {
      self.modalInstance.dismiss("cancel");
    };
  }
});
