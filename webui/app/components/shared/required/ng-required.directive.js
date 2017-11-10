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

/**
 * @name ngRequired
 * @restrict A
 * @description
 *
 * This directive adds a '*' sign to the label of the associated form field to visualize that
 * the field is required.
 *
 * An optional expression can be set. If the expression is truthy, then the '*' sign is added
 * to the label of the form field.
 */
export default ($document, $compile) => {
  return {
    restrict: "A",
    link: (scope, element, attrs) => {
      setTimeout(() => {
        let labelNode = $document[0].body.querySelector("label[for='" + attrs.id + "']");
        if (labelNode) {
          let labelElement = angular.element(labelNode);
          let spanElement = angular.element("<span class=\"required\"> *</span>");
          labelElement.append(spanElement);
          if (attrs.ngRequired) {
            spanElement.attr("ng-if", attrs.ngRequired);
            $compile(spanElement)(scope);
          }
        }
      });
    }
  };
};
