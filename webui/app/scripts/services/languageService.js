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

import "angular-gettext";

class LanguageService {
  constructor ($http, gettextCatalog) {
    this._$http = $http;
    this._lib = gettextCatalog;
    this._language = "de";
    this._debug = false;

    console.log(gettextCatalog);
    this.selectLanguage();
    this.setLanguage();
  }

  selectLanguage () {
    this._$http({
      method: "GET",
      url: "locale/" + this._language + ".json"
    }).then(function (response) {
      console.log(response);
    });
  }

  setLanguage () {
    this._lib.setCurrentLanguage(this._language);
    this._lib.loadRemote("locale/" + this._language + ".json");
  }
}

angular
  .module("openattic.i18n", ["gettext"])
  .service("LanguageService", LanguageService);
