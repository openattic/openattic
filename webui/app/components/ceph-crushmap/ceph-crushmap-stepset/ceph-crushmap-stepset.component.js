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

class CephCrushmapStepsetComponent {
  $onInit () {
    if (this.stepset.num === 0) {
      this.replicas_source = "fix";
      this.replicas_pos = 1;
      this.replicas_neg = 1;
    } else if (this.stepset.num < 0) {
      this.replicas_source = "neg";
      this.replicas_pos = -this.stepset.num;
      this.replicas_neg = -this.stepset.num;
    } else {
      this.replicas_source = "pos";
      this.replicas_pos = this.stepset.num;
      this.replicas_neg = this.stepset.num;
    }
  }

  onUpdate () {
    if (this.replicas_source === "fix") {
      this.stepset.num = 0;
    } else if (this.replicas_source === "pos") {
      this.stepset.num = this.replicas_pos;
    } else if (this.replicas_source === "neg") {
      this.stepset.num = -this.replicas_neg;
    }
  }

  getRealNum (step) {
    if (!step) {
      return;
    }
    if (step.num <= 0) {
      return {
        min: this.rule.min_size + step.num,
        max: this.rule.max_size + step.num
      };
    }
    return {
      min: step.num
    };
  }
}

export default {
  template: require("./ceph-crushmap-stepset.component.html"),
  bindings: {
    "stepset": "=",
    "rule": "=",
    "cluster": "="
  },
  controller:  CephCrushmapStepsetComponent
};

