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

var app = angular.module("openattic.shared");
app.directive("paginator", function () {
  return {
    restrict: "E",
    template: require("./paginator.directive.html"),
    scope: {
      page: "=",
      pages: "="
    },
    link: function (scope) {
      scope.displayNumber = scope.page + 1;

      scope.instantChange = function (event) {
        if (event.keyCode === 38) { //up arrow key
          scope.switchPage(scope.displayNumber + 1);
        } else if (event.keyCode === 40) { //down arrow key
          scope.switchPage(scope.displayNumber - 1);
        }
      };

      scope.switchPage = function (page) {
        page = parseInt(page, 10);
        if (!page || page < 1) {
          page = 1;
        } else if (page > scope.pages) {
          page = scope.pages;
        }
        scope.page = page - 1;
        scope.displayNumber = page;
        // TODO: Should be done automatically, we should take a look at it
      };

      /**
       * This will watch the count of all pages.
       * The pages count will change if you search for something or
       * if you change the entries size.
       * The watch prevents having a wrong page size.
       */
      scope.$watch("pages", function () {
        scope.switchPage(scope.page);
      });
    }
  };
});
