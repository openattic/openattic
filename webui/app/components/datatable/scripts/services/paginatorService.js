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

var app = angular.module("openattic.datatable");
app.factory("paginatorService", function () {
    var _range = function () {
      var start;
      var end;
      var i;
      var nums = [];

      if (arguments.length === 1) {
        start = 0;
        end = arguments[0];
      } else {
        start = arguments[0];
        end = arguments[1];
      }

      for (i = start; i < end; i++) {
        nums.push(i);
      }
      return nums;
    };

    var _numbers = function (page, pages, buttons) {
      // Shamelessly stolen from DataTables:
      // https://github.com/DataTables/DataTables/blob/master/media/js/jquery.dataTables.js#L13852
      if (arguments.length !== 3) {
        throw new Error("Need exactly <page>, <pages>, <buttons> args");
      }
      var numbers = [];
      var half = Math.floor(buttons / 2);

      if (pages <= buttons) {
        numbers = _range(0, pages);
      } else if (page <= half) {
        numbers = _range(0, buttons - 2);
        numbers.push("ellipsis");
        numbers.push(pages - 1);
      } else if (page >= pages - 1 - half) {
        numbers = _range(pages - (buttons - 2), pages);
        numbers.splice(0, 0, "ellipsis"); // no unshift in ie6
        numbers.splice(0, 0, 0);
      } else {
        numbers = _range(page - 1, page + 2);
        numbers.push("ellipsis");
        numbers.push(pages - 1);
        numbers.splice(0, 0, "ellipsis");
        numbers.splice(0, 0, 0);
      }
      return numbers;
    };

    return {
      getNumbers: _numbers
    };
  });