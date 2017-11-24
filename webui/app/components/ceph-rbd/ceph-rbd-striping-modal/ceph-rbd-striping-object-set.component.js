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

class CephRbdStripingObjectSet {

  constructor (SizeParserService) {
    this.SizeParserService = SizeParserService;
  }

  $onInit () {
    this.size = this.SizeParserService.parseInt(this.sizeStr, "b");
    this.objectSize = this.SizeParserService.parseInt(this.objectSizeStr, "b");
    this.stripeUnit = this.SizeParserService.parseInt(this.stripeUnitStr, "b");
    let objectSetSize = this.objectSize * this.stripeCount;
    let stripeSize = this.stripeUnit * this.stripeCount;
    this.numStripesObjectSet = objectSetSize / stripeSize;
    this.numStripUnitsObjectSet = this.stripeCount * this.numStripesObjectSet;
    this.maxStripeUnit = Math.ceil(this.size / this.stripeUnit) - 1;
    let remainingSize = this.size - objectSetSize * this.objectSetIndex;
    this.numStripesCurrentObjectSet = Math.min(Math.ceil(remainingSize / stripeSize), this.numStripesObjectSet);
    this.isLastStripeUnitPartial = this.size % this.stripeUnit !== 0;
  }

  getStripUnitText (stripeUnitNumber) {
    if (stripeUnitNumber === this.maxStripeUnit && this.isLastStripeUnitPartial) {
      return `<small>Stripe unit<br>(partial)</small><br>${stripeUnitNumber}`;
    }
    if (stripeUnitNumber <= this.maxStripeUnit) {
      return `<small>Stripe unit</small><br>${stripeUnitNumber}`;
    }
    return "";
  }

  getStripUnitStyle (stripeUnitNumber, stripeNumber) {
    let classes = [];
    if (stripeUnitNumber === this.maxStripeUnit && this.isLastStripeUnitPartial) {
      classes.push("warning");
    } else if (stripeUnitNumber <= this.maxStripeUnit) {
      classes.push("info");
    } else {
      classes.push("danger");
    }
    let lastStripeNumber = this.objectSetIndex * this.numStripesObjectSet + this.numStripesCurrentObjectSet - 1;
    let isBottom = lastStripeNumber === stripeNumber;
    let isTop = (this.objectSetIndex * this.numStripesObjectSet) === stripeNumber;
    if (isBottom) {
      classes.push("rbd-striping-cell-bottom");
    }
    if (isTop) {
      classes.push("rbd-striping-cell-top");
    }
    if ((!isBottom && !isTop) || (isBottom && !isTop)) {
      classes.push("rbd-striping-cell-center");
    }
    return classes.join(" ");
  }
}

export default {
  template: require("./ceph-rbd-striping-object-set.component.html"),
  bindings: {
    sizeStr: "<",
    objectSizeStr: "<",
    stripeUnitStr: "<",
    stripeCount: "<",
    objectSetIndex: "<"
  },
  controller: CephRbdStripingObjectSet
};
