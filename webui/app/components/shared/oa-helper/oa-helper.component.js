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
 * Displays an helper icon that will show a popover when clicked.
 * The content of the popover can be customized through one of the following
 * bindings: helperText, helperHtml or helperTemplate.
 *
 *  E.g.:
 * <oa-helper helper-text="'This is a message.'"></oa-helper>
 *
 * @param {string} helperText Takes text only and will escape any HTML provided.
 * @param {string} helperHtml Takes an expression that evaluates to an HTML string.
 * @param {string} helperTemplate A URL representing the location of a template.
 * @param {string} helperData Data that will be used on the template.
 */
export default {
  template: require("./oa-helper.component.html"),
  transclude: false,
  bindings: {
    helperText: "<",
    helperHtml: "<",
    helperTemplate: "<",
    helperData: "<"
  }
};
