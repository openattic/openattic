/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
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
/**
 * @param {string} oaClipboardTarget The identifer of the DOM element whose
 *   text is copied into the clipboard. Take care that the identifier is
 *   selectable (e.g. input or textarea), otherwise it is not possible to copy
 *   the element value into the clipboard.
 * @param {string} oaClipboardText An alternative text. Default is 'text'.
 */
export default (Notification) => {
  return {
    restrict: "A",
    scope: {
      oaClipboardTarget: "@",
      oaClipboardText: "@"
    },
    link: (scope, element, attrs) => {
      element.bind("click", () => {
        let toastyOptions = {};
        attrs.oaClipboardText = _.isString(attrs.oaClipboardText) ?
          attrs.oaClipboardText : "text";
        try {
          // Get the DOM element by id.
          const node = $("#" + attrs.oaClipboardTarget);
          // Create the input to hold our text.
          element = document.createElement("input");
          element.value = node.val();
          document.body.appendChild(element);
          // Copy text to clipboard.
          element.select();
          document.execCommand("copy");
          // Finally remove the element.
          document.body.removeChild(element);
          // Set success message.
          toastyOptions = {
            type: "success",
            msg: "Copied " + attrs.oaClipboardText +
              " to the clipboard successfully."
          };
        } catch (err) {
          // Set error message.
          toastyOptions = {
            type: "error",
            msg: "Failed to copy the " + attrs.oaClipboardText +
              " to the clipboard."
          };
        }
        // Display a toasty/message.
        // Note, the scope is not updated automatically because we are inside
        // a click event, so we need to do this ourself.
        scope.$apply(() => {
          Notification[toastyOptions.type](toastyOptions);
        });
      });
    }
  };
};
