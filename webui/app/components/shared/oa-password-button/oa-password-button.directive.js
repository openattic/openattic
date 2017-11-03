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

/**
 * Show or hide the password of the associated input field in plain text or encrypted when
 * the button is pressed. An icon visualizes the current status.
 * E.g.:
 * <button type="button"
 *         class="btn btn-default"
 *         oa-password-button="password">
 * </button>
 * @param {string} The identifier of the password input field.
 */
export default () => {
  return {
    restrict: "A",
    template: "<i class=\"icon-prepend {{iconClass}}\" uib-tooltip=\"{{iconTooltip}}\"></i>",
    scope: {},
    link: (scope, element, attrs) => {
      const inputElement = $("#" + attrs.oaPasswordButton);

      const update = () => {
        if (inputElement.attr("type") === "text") {
          scope.iconClass = "fa fa-eye-slash";
          scope.iconTooltip = "Hide";
        } else {
          scope.iconClass = "fa fa-eye";
          scope.iconTooltip = "Show";
        }
      };

      const onClick = () => {
        // Modify the type of the input field.
        inputElement.attr("type", (inputElement.attr("type") === "password") ?
          "text" : "password");
        // Update the button icon/tooltip.
        scope.$apply(update());
      };

      if (inputElement) {
        // Update the button icon/tooltip based on the current input type.
        update();
        // Register listener to react on button clicks.
        element.bind("click", onClick);
      }
    }
  };
};
