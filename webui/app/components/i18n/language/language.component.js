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
 * Class to change the language via a button in the utility navbar
 */
class LanguageComponent {
  /**
   * Constructor injects all required modules,
   * defines a list of supported languages and
   * determines the initial language
   *
   * @param languageService
   */
  constructor (languageService, supportedLanguages) {
    this._languageService = languageService;
    this._supportedLanguages = supportedLanguages;

    //languageService.debug();
  }

  /**
   * Sets the active language
   *
   * @param {string} lang
   */
  changeLanguage (lang) {
    this._languageService.setLanguage(lang);
  }

  /**
   * Returns the active language
   *
   * @returns {string} Country code of the active language
   */
  getActiveLanguage () {
    return this._languageService.getLanguage();
  }

  /**
   * Returns a list of available languages
   *
   * @returns {object}
   */
  getLanguages () {
    return this._supportedLanguages;
  }
}

export default {
  template: require("./language.component.html"),
  controller: LanguageComponent
};
