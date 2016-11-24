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

var app = angular.module("openattic");
/**
 * @param {string} oaClipboardTarget The identifer of the DOM element whose
 *   text is copied into the clipboard.
 * @param {string} oaClipboardText An alternative text. Default is 'text'.
 */
app.directive("oaClipboard", function (toasty) {
  return {
    restrict: "A",
    scope: {
      oaClipboardTarget: "@",
      oaClipboardText: "@"
    },
    link: function (scope, element, attrs) {
      element.bind("click", function () {
        var toastyOptions = {};
        attrs.oaClipboardText = angular.isString(attrs.oaClipboardText) ?
          attrs.oaClipboardText : "text";
        try {
          // Get the DOM element by id.
          var node = $("#" + attrs.oaClipboardTarget);
          // Copy text to clipboard.
          var selection = document.getSelection();
          selection.removeAllRanges();
          node.select();
          document.execCommand("copy");
          selection.removeAllRanges();
          // Set success message.
          toastyOptions = {
            type: "success",
            msg: "Successfully copied the " + attrs.oaClipboardText +
              " to the clipboard."
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
        scope.$apply(function () {
          toasty(toastyOptions.msg, toastyOptions.type);
        });
      });
    }
  };
});
