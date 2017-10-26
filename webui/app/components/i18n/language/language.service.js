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

import _ from "lodash";

/**
 * Class to manage multiple languages in openATTIC
 *
 * Find all country codes on: https://www.fincher.org/Utilities/CountryLanguageList.shtml
 */
export default class LanguageService {
  /**
   * Constructor injects all required modules
   * and defines defaults
   *
   * @param gettextCatalog
   */
  constructor (gettextCatalog, supportedLanguages) {
    this._lib = gettextCatalog;
    this._localePath = "locale/";
    this._fileExtension = ".json";
    this._supportedLanguages = supportedLanguages;

    // Determine the language
    let lang = navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);

    // If requested country code cannot be found
    if (!_.has(this._supportedLanguages, lang)) {
      // Check if a more specific country code is in object
      let result = _.pickBy(this._supportedLanguages, function (value, key) {
        return key.startsWith(lang);
      });

      if (_.isEmpty(result)) {
        // Define default language
        lang = "en-US";
      } else {
        // Use more specific country code (e.g. en is en-US)
        lang = _.keys(result)[0];
      }
    }

    this.setLanguage(lang);
  }

  /**
   * Loads the language file
   *
   * @param lang
   */
  setLanguage (lang) {
    this._language = lang;
    this._lib.setCurrentLanguage(this._language);
    this._lib.loadRemote(this._localePath + this._language + this._fileExtension);
  }

  /**
   * Returns the selected language
   *
   * @returns {string} Country code of the active language
   */
  getLanguage () {
    return this._language;
  }

  /**
   * Enables the debug mode
   */
  debug () {
    this._lib.debug = true;
  }
}
