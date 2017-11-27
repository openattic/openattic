/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 Tiago Melo <tspmelo@gmail.com>
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

export default ($uibModal, $transitions) => {

  let registerListener = (scope) => {
    let cancelTrans = $transitions.onStart({}, (trans) => {
      let isDirty = false;
      scope.oaCheckForm.forEach((element) => {
        if (!element.$submitted && element.$dirty) {
          isDirty = true;
        }
      }, this);

      if (!isDirty) {
        cancelTrans();
        return;
      }

      /**
       * prevents the  state change and ask the user
       * if he wants to dismiss the changes
       */
      trans.abort();

      $uibModal.open({
        animation: true,
        ariaLabelledBy: "modal-title-bottom",
        ariaDescribedBy: "modal-body-bottom",
        component: "oaCheckFormModal",
        resolve: {
          trans: () => {
            return trans;
          },
          cancelTrans: () => {
            return cancelTrans;
          }
        }
      });

    });
  };

  return {
    restrict: "A",
    link: (scope, element) => {
      // Get the associated form. Note, the name can be 'userForm' or '$ctrl.userForm'.
      // Because of that use the lodash _.get() function to be able to access forms
      // declared in dotted notation.
      const name = element.attr("name");
      const form = _.get(scope, name);

      // Checks if another form was already registered.
      if (_.isArray(scope.oaCheckForm)) {
        scope.oaCheckForm.push(form);
      } else {
        registerListener(scope);
        scope.oaCheckForm = [form];
      }
    }
  };
};
