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

export default class CephIscsiStateService {

  constructor (taskQueueSubscriber, taskQueueService, Notification, cephIscsiService) {
    this.taskQueueSubscriber = taskQueueSubscriber;
    this.taskQueueService = taskQueueService;
    this.Notification = Notification;
    this.cephIscsiService = cephIscsiService;

    this.stopTaskDescr = "iSCSI stop exports";
    this.deployTaskDescr = "iSCSI deploy exports";
  }

  _getHostnameWithoutFqdn (hostname) {
    return hostname.indexOf(".") !== -1 ? hostname.substring(0, hostname.indexOf(".")) : hostname;
  }

  containsHost (hosts, hostname) {
    if (!_.isArrayLike(hosts) || hosts.length === 0) {
      return false;
    }
    if (hosts.indexOf(hostname) !== -1) {
      return true;
    }
    let hostsWithoutFqdn = hosts.map((h) => {
      return h.indexOf(".") !== -1 ? h.substring(0, h.indexOf(".")) : h;
    });
    let hostWithoutFqdn = this._getHostnameWithoutFqdn(hostname);
    return hostsWithoutFqdn.indexOf(hostWithoutFqdn) !== -1;
  }

  _getHostState (hosts, hostname) {
    if (!_.isUndefined(hosts[hostname])) {
      return hosts[hostname];
    }
    let hostsWithoutFqdn = {};
    _.forEach(hosts, (currHost, currHostname) => {
      let currentHostnameWithoutFqdn = this._getHostnameWithoutFqdn(currHostname);
      hostsWithoutFqdn[currentHostnameWithoutFqdn] = currHost;
    });
    let hostWithoutFqdn = this._getHostnameWithoutFqdn(hostname);
    return hostsWithoutFqdn[hostWithoutFqdn];
  }

  _getStatesByHosts (rows, hosts, state) {
    let states = {};
    rows.forEach((row) => {
      row.portals.forEach((portal) => {
        if (this.containsHost(hosts, portal.hostname)) {
          if (_.isUndefined(states[row.targetId])) {
            states[row.targetId] = {
              hostsStarting: [],
              hostsStopping: [],
              hostsEnabled: [],
              hostsDisabled: []
            };
          }
          if (state === "STARTING") {
            states[row.targetId].hostsStarting.push(portal.hostname);

          } else if (state === "STOPPING") {
            states[row.targetId].hostsStopping.push(portal.hostname);
          }
        }
      });
    });
    return states;
  }

  _updateStates (fsid, rows, updateHosts) {
    let taskIds = [];
    this.taskQueueService
      .get({
        status: "Not Started"
      })
      .$promise
      .then((notStartedTasksResult) => {
        notStartedTasksResult.results.forEach((notStartedTask) => {
          if (notStartedTask.description === this.stopTaskDescr ||
              notStartedTask.description === this.deployTaskDescr) {
            taskIds.push(notStartedTask.id);
            const state = notStartedTask.description === this.stopTaskDescr ? "STOPPING" : "STARTING";
            const statesTargets = this._getStatesByHosts(rows, notStartedTask.hosts, state);
            let statesHosts = {};
            notStartedTask.hosts.forEach((hostname) => {
              statesHosts[hostname] = {
                state: state
              };
            });
            updateHosts(state, {targets: statesTargets, hosts: statesHosts});
          }
        });

        this.taskQueueService
          .get({
            status: "Running"
          })
          .$promise
          .then((runningTasksResult) => {
            runningTasksResult.results.forEach((runningTask) => {
              if (runningTask.description === this.stopTaskDescr || runningTask.description === this.deployTaskDescr) {
                if (taskIds.indexOf(runningTask.id) === -1) {
                  taskIds.push(runningTask.id);
                  const state = runningTask.description === this.stopTaskDescr ? "STOPPING" : "STARTING";
                  const statesTargets = this._getStatesByHosts(rows, runningTask.hosts, state);
                  let statesHosts = {};
                  runningTask.hosts.forEach((hostname) => {
                    statesHosts[hostname] = {
                      state: state
                    };
                  });
                  updateHosts(state, {targets: statesTargets, hosts: statesHosts});
                }
              }
            });
            taskIds.forEach((taskId) => {
              this.taskQueueSubscriber.subscribe(taskId, () => {
                this._updateStates(fsid, rows, updateHosts);
              });
            });

            if (taskIds.length === 0) {
              this.cephIscsiService
                .iscsistatus({
                  fsid: fsid
                })
                .$promise
                .then((res) => {
                  let states = {};
                  rows.forEach((row) => {
                    row.portals.forEach((portal) => {
                      if (_.isUndefined(states[row.targetId])) {
                        states[row.targetId] = {
                          hostsStarting: [],
                          hostsStopping: [],
                          hostsEnabled: [],
                          hostsDisabled: []
                        };
                      }
                      let hostState = this._getHostState(res, portal.hostname);
                      if (_.isObjectLike(hostState) &&
                          _.isObjectLike(hostState.targets) &&
                          _.isObjectLike(hostState.targets[row.targetId])) {
                        if (hostState.targets[row.targetId].enabled) {
                          states[row.targetId].hostsEnabled.push(portal.hostname);
                        } else {
                          states[row.targetId].hostsDisabled.push(portal.hostname);
                        }
                      } else {
                        states[row.targetId].hostsDisabled.push(portal.hostname);
                      }
                    });
                  });
                  _.forEach(res, (hostState) => {
                    if (!_.isUndefined(hostState.active)) {
                      hostState.state = hostState.active ? "RUNNING" : "STOPPED";
                    }
                  });
                  updateHosts(res.status ? "RUNNING" : "STOPPED", {targets: states, hosts: res}, true);
                })
                .catch(() => {
                  updateHosts();
                });
            }
          })
          .catch(() => {
            updateHosts();
          });
      })
      .catch(() => {
        updateHosts();
      });
  }

  updateHosts (fsid, hosts) {
    _.forEach(hosts, (host, hostname) => {
      if (!_.isUndefined(host.active)) {
        hosts[hostname] = {
          state: "LOADING"
        };
      }
    });

    this._updateStates(fsid, [], (stateByHost, states, updateAll) => {
      if (!_.isUndefined(states) && !_.isUndefined(states.hosts)) {
        _.forEach(hosts, (host, hostname) => {
          let stateHost = states.hosts[hostname];
          if (!_.isUndefined(stateHost)) {
            if (!_.isUndefined(stateHost.state)) {
              host.state = stateHost.state;
            }
          }
        });
      }
      if (updateAll) {
        _.forEach(hosts, (host) => {
          if (["LOADING", "STARTING", "STOPPING"].indexOf(host.state) !== -1) {
            host.state = "UNKNOWN";
          }
        });
      }
    });
  }

  update (fsid, results) {
    results.forEach((row) => {
      row.state = "LOADING";
      delete row.hostsEnabled;
      delete row.hostsDisabled;
    });
    this._updateStates(fsid, results, (stateByHost, states, updateAll) => {
      if (!_.isUndefined(states) && !_.isUndefined(states.targets)) {
        results.forEach((row) => {
          let targetState = states.targets[row.targetId];
          if (!_.isUndefined(targetState)) {
            if (targetState.hostsStarting.length > 0) {
              row.state = "STARTING";
            } else if (targetState.hostsStopping.length > 0) {
              row.state = "STOPPING";
            } else if (targetState.hostsEnabled.length > 0) {
              if (targetState.hostsDisabled.length > 0) {
                row.state = "RUNNING_WARN";
                row.hostsEnabled = targetState.hostsEnabled;
                row.hostsDisabled = targetState.hostsDisabled;
              } else {
                row.state = "RUNNING";
              }
            } else {
              row.state = "STOPPED";
            }
          }
        });
      }
      if (updateAll) {
        results.forEach((row) => {
          if (["LOADING", "STARTING", "STOPPING"].indexOf(row.state) !== -1) {
            row.state = "UNKNOWN";
          }
        });
      }
    });
  }

  start (host, hostname, fsid) {
    host.active = undefined;
    host.state = "STARTING";
    this.cephIscsiService
      .iscsideploy({
        fsid: fsid,
        minions: [hostname]
      })
      .$promise
      .then((res) => {
        this.taskQueueSubscriber.subscribe(res.taskqueue_id, () => {
          this._updateStates(fsid, [], (state, states, updateAll) => {
            if (!_.isUndefined(states) && !_.isUndefined(states.hosts) && !_.isUndefined(states.hosts[hostname])) {
              host.state = states.hosts[hostname].state;
              if (host.state === "RUNNING") {
                this.Notification.success({
                  title: hostname + " started successfully"
                });
              } else if (host.state === "STOPPED") {
                this.Notification.error({
                  title: "Error starting " + hostname
                });
              }
            }
            if (updateAll) {
              if (["LOADING", "STARTING", "STOPPING"].indexOf(host.state) !== -1) {
                host.state = "UNKNOWN";
              }
            }
          });
        });
      })
      .catch(() => {
        host.active = undefined;
        host.state = undefined;
      });
  }

  stop (host, hostname, fsid) {
    host.active = undefined;
    host.state = "STOPPING";
    this.cephIscsiService
      .iscsiundeploy({
        fsid: fsid,
        minions: [hostname]
      })
      .$promise
      .then((res) => {
        this.taskQueueSubscriber.subscribe(res.taskqueue_id, () => {
          this._updateStates(fsid, [], (state, states, updateAll) => {
            if (!_.isUndefined(states) && !_.isUndefined(states.hosts) && !_.isUndefined(states.hosts[hostname])) {
              host.state = states.hosts[hostname].state;
              if (host.state === "STOPPED") {
                this.Notification.success({
                  title: hostname + " stopped successfully"
                });
              } else if (host.state === "RUNNING") {
                this.Notification.error({
                  title: "Error stopping " + hostname
                });
              }
            }
            if (updateAll) {
              if (["LOADING", "STARTING", "STOPPING"].indexOf(host.state) !== -1) {
                host.state = "UNKNOWN";
              }
            }
          });
        });
      })
      .catch(() => {
        host.active = undefined;
        host.state = undefined;
      });
  }

}
