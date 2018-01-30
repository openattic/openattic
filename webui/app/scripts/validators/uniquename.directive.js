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

import _ from "lodash";

export default (cephErasureCodeProfilesService, cephPoolsService,
    cephRbdService, usersService, Notification) => {
  return {
    restrict: "A",
    require: "ngModel",
    link: (scope, elem, attrs, ctrl) => {
      let stopTimeout;
      ctrl.model = attrs.uniquename;
      ctrl.field = attrs.name;

      return scope.$watch(() => {
        return ctrl.$modelValue;
      }, (modelValue) => {
        ctrl.$setValidity("uniquename", true);
        clearTimeout(stopTimeout);

        if (modelValue === "" || _.isUndefined(modelValue)) {
          return;
        }
        stopTimeout = setTimeout(() => {
          let obj;
          let query = {};
          switch (ctrl.model) {
            case "user":
              obj = {
                model: usersService,
                current: scope.$ctrl.user.id,
                attribute: "id"
              };
              break;
            case "rbd":
              query.fsid = scope.$ctrl.data.cluster.fsid;
              obj = {
                model: cephRbdService,
                current: scope.$ctrl.rbd.id,
                attribute: "id"
              };
              break;
            case "ceph-pool":
              if (!scope.$ctrl.data.cluster.fsid) {
                return;
              }
              query.fsid = scope.$ctrl.data.cluster.fsid;
              obj = {
                model: cephPoolsService,
                current: scope.$ctrl.pool.id,
                attribute: "id"
              };
              break;
            case "erasure-code-profiles":
              query.fsid = scope.$ctrl.cluster.fsid;
              obj = {
                model: cephErasureCodeProfilesService,
                current: null, // Has no renaming feature.
                attribute: "id"
              };
              break;

            default:
              Notification.warning({
                title: "Service not implemened",
                msg: "Please add the Service to 'UniqueName.js'."
              });
              return;
          }
          query[ctrl.field] = modelValue;
          obj.model.query(query)
            .$promise
            .then((res) => {
              if (res.length !== 0 && obj.current) {
                ctrl.$setValidity("uniquename", res[0][obj.attribute] === obj.current);
              } else {
                ctrl.$setValidity("uniquename", res.length === 0);
              }
            });
        }, 300);
      });
    }
  };
};
