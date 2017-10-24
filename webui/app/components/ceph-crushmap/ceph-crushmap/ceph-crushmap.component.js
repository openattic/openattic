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

class CephCrushmapComponent {
  constructor (cephCrushmapService, registryService) {
    this.cephCrushmapService = cephCrushmapService;
    this.registryService = registryService;

    this.cluster = undefined;
    this.clusters = undefined;
    this.registry = registryService;
    this.repsize = 3;

    this.treeOptions = {
      accept: (sourceNodeScope, destNodesScope) => {
        if (!destNodesScope.$parent.$modelValue) {
          return true; // moved to the root level
        }
        // If there are any other nodes in the destination, only accept if their types match ours
        for (var i = 0; i < destNodesScope.$modelValue.length; i++) {
          if (destNodesScope.$modelValue[i].type_id !== sourceNodeScope.$modelValue.type_id) {
            return false;
          }
        }
        // Now make sure we put racks in datacenters and not vice versa
        return sourceNodeScope.$modelValue.type_id < destNodesScope.$parent.$modelValue.type_id;
      },
      beforeDrag: (sourceNodeScope) => {
      // ok, so beforeDrag gets fired once for the node clicked, and if that returns
      // false, it gets fired AGAIN for each parent node right up to the root.
      // So, if we're supposed to find a new "take" node, defer setting
      // edittakenode to false by 25 ms, so we can return false for ALL tree nodes,
      // and then only execute the first update (otherwise we'd choose the root
      // node instead of the one that has actually been clicked).
        if (this.edittakenode) {

          setTimeout(() => {
            if (this.edittakenode) {
              this.newstepset.take = sourceNodeScope.$modelValue;
              this.edittakenode = false;
            }
          }, 25);
          return false;
        }
        return true;
      },
      dropped: () => {
        this.rerenderNodes();
      }
    };
  }

  $onInit () {
    this.setActiveRuleset(null);
  }

  getCrushmap () {
    if (angular.isObject(this.clusters) && this.clusters.results &&
        this.clusters.results.length > 0 && this.registry.selectedCluster) {
      this.error = false;
      this.cephCrushmapService
        .get({fsid: this.registry.selectedCluster.fsid})
        .$promise
        .then((res) => {
          this.cluster = res;
        })
        .catch((error) => {
          this.error = error;
        });
    }
  }

  onClusterLoad (cluster) {
    this.clusters = cluster;
    this.getCrushmap();
  }

  setActiveRuleset (activeRuleset) {
    this.activeRuleset = activeRuleset;
  }

  findNodeByName (name) {
    var node = null;
    var iterfn = (item) => {
      if (item.name === name) {
        node = item;
      } else {
        item.items.map(iterfn);
      }
    };
    this.cluster.crushmap.buckets.map(iterfn);
    return node;
  }

  findTypeByName (name) {
    return this.cluster.crushmap.types.find((item) => {
      return item.name === name;
    });
  }

  rerenderNodes () {
    // deep watcher that keeps track of min/max sanity etc
    var resetNodes;
    var renderNodes;
    var rendersteps;
    var s;
    var step;
    var stepset;
    var prevStepCount;
    var activeRuleset = this.activeRuleset;
    if (!this.cluster) {
      return;
    }
    this._changeRepSize(3);
    this.stepsets = [];
    if (activeRuleset) {
      // Force sensible min/max
      if (activeRuleset.min_size < 1) {
        activeRuleset.min_size = 1;
      }
      if (activeRuleset.max_size < activeRuleset.min_size) {
        activeRuleset.max_size = activeRuleset.min_size;
      }
      // Try to keep the repsize to 3 if the ruleset allows it
      if (activeRuleset.min_size <= 3 && 3 <= activeRuleset.max_size) {
        this._changeRepSize(3);
      } else if (activeRuleset.min_size <= 2 && 2 <= activeRuleset.max_size) {
        // It does not. Try 2...
        this._changeRepSize(2);
      } else {
        // Seems we'll just have to use whatever the minimum is then :(
        this. _changeRepSize(activeRuleset.min_size);
      }
      // Split the steps into stepsets, where each describes steps from "take" to "emit".
      for (s = 0; s < activeRuleset.steps.length; s++) {
        step = activeRuleset.steps[s];
        if (step.op === "take") {
          stepset = {};
          stepset.take = this.findNodeByName(step.item_name);
        } else if (step.op === "choose_firstn") {
          stepset.groupbytype = this.findTypeByName(step.type);
        } else if (step.op === "chooseleaf_firstn") {
          stepset.acrosstype = this.findTypeByName(step.type);
          stepset.num = step.num;
          stepset.replicas = this.getRealNum(stepset);
        } else if (step.op === "emit") {
          this.stepsets.push(stepset);
        }
      }
    }
    resetNodes = (nodes) => {
      var i;
      var node;
      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        node.isRootNode = false;
        node.isBelowRootNode = false;
        node.isSelectorNode = false;
        node.nextStep = null;
        resetNodes(node.items);
      }
    };
    renderNodes = (steps, nodes, isBelowRootNode) => {
      var i;
      var node;
      var substeps;

      for (i = 0; i < nodes.length; i++) {
        substeps = steps;
        node = nodes[i];

        if (steps[0].op === "take") {
          if (steps[0].item === node.id) {
            node.isRootNode = true;
            isBelowRootNode = true;
            node.nextStep = steps[1];
            steps.shift();
          }
        } else if (steps[0].op === "choose_firstn" || steps[0].op === "chooseleaf_firstn") {
          node.isBelowRootNode = isBelowRootNode;
          if (steps[0].type === node.type_name) {
            node.isSelectorNode = true;
            node.nextStep = steps[1];
            substeps = steps.slice();
            substeps.shift();
          }
        }
        if (node.items.length > 0) {
          renderNodes(substeps, node.items, isBelowRootNode);
        }
        if (node.isRootNode) {
          while (steps.length > 0 && steps[0].op !== "take") {
            steps.shift();
          }
        }
        if (steps.length === 0) {
          return;
        }
      }
    };

    rendersteps = (activeRuleset ? activeRuleset.steps.slice() : []);
    resetNodes(this.cluster.crushmap.buckets);
    while (rendersteps.length > 0) {
      prevStepCount = rendersteps.length;
      renderNodes(rendersteps, this.cluster.crushmap.buckets, false);
      if (rendersteps.length >= prevStepCount) {
        // Safety measure: renderNodes should consume a coupl'a steps. If it
        // didn't, something seems to be wrong.
        throw "The CRUSH map renderer seems unable to render this CRUSH map ruleset.";
      }
    }
  }

  getRealNum (step) {
    if (!step) {
      return;
    }
    if (step.num <= 0) {
      return {
        min: this.activeRuleset.min_size + step.num,
        max: this.activeRuleset.max_size + step.num
      };
    }
    return {
      min: step.num
    };
  }

  _changeRepSize (repsize) {
    this.repsize = repsize;

    if (this.activeRuleset) {
      if (repsize < this.activeRuleset.min_size) {
        this.repsize = this.activeRuleset.min_size;
      }
      if (repsize > this.activeRuleset.max_size) {
        this.repsize = this.activeRuleset.max_size;
      }
    }
  }
}

export default{
  controller: CephCrushmapComponent,
  template: require("./ceph-crushmap.component.html")
};
