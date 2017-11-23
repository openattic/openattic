"use strict";

class EcProfilePage {
  constructor () {
    this.name = element(by.model("$ctrl.erasureCodeProfile.name"));
    this.k = element(by.model("$ctrl.erasureCodeProfile.k"));
    this.m = element(by.model("$ctrl.erasureCodeProfile.m"));
    this.rulesetDomain = element(by.model("$ctrl.erasureCodeProfile.ruleset_failure_domain"));
    this.submitBtn = element(by.id("bot2-Msg1"));
    this.cancelBtn = element(by.id("bot1-Msg1"));
  }
}

module.exports = EcProfilePage;
