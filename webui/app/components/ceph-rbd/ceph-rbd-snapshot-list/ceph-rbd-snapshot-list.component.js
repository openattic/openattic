/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2018 SUSE LLC
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

class CephRbdSnapshotList {
  constructor ($uibModal, cephRbdSnapshotService, taskQueueSubscriber, $state, cephRbdSnapshotValidationErrors) {
    this.$uibModal = $uibModal;
    this.cephRbdSnapshotService = cephRbdSnapshotService;
    this.taskQueueSubscriber = taskQueueSubscriber;
    this.$state = $state;
    this.cephRbdSnapshotValidationErrors = cephRbdSnapshotValidationErrors;

    this.snapSelection = {};

    this.filterConfig = {
      page: 0,
      entries: 10,
      search: "",
      sortfield: null,
      sortorder: null
    };
  }

  $onChanges () {
    this.onFilterConfigChange();
  }

  createAction () {
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRbdSnapshotCreateModal",
      resolve: {
        fsid: () => {
          return this.fsid;
        },
        poolName:  () => {
          return this.poolName;
        },
        imageName:  () => {
          return this.imageName;
        }
      }
    });

    modalInstance.result.then(() => {
      this.onFilterConfigChange();
    });
  }

  renameAction () {
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRbdSnapshotCreateModal",
      resolve: {
        fsid: () => {
          return this.fsid;
        },
        poolName:  () => {
          return this.poolName;
        },
        imageName:  () => {
          return this.imageName;
        },
        snapName:  () => {
          return this.snapSelection.item.name;
        },
        isProtected:  () => {
          return this.snapSelection.item.is_protected;
        }
      }
    });

    modalInstance.result.then(() => {
      this.onFilterConfigChange();
    });

  }

  protectUnprotectAction () {
    if (this.imageFeatures.indexOf("layering") === -1) {
      this.showValidationError(this.cephRbdSnapshotValidationErrors.unprotectWithoutLayering);
      return;
    }
    if (this.snapSelection.item.children.length > 0) {
      this.showValidationError(this.cephRbdSnapshotValidationErrors.protectWithChilden);
      return;
    }
    const request = {
      fsid: this.fsid,
      pool: this.poolName,
      imagename: this.imageName,
      snap: this.snapSelection.item.name,
      image: `${this.poolName}/${this.imageName}`,
      name: this.snapSelection.item.name,
      is_protected: !this.snapSelection.item.is_protected
    };
    this.cephRbdSnapshotService.update(request)
      .$promise
      .then(() => {
        this.filterConfig.refresh = new Date();
      });
  }

  cloneAction () {
    if (!this.snapSelection.item.is_protected) {
      this.showValidationError(this.cephRbdSnapshotValidationErrors.cloneUnprotected);
      return;
    }
    this.$state.go("cephRbds-clone", {
      fsid: this.fsid,
      pool: this.poolName,
      name: this.imageName,
      snap: this.snapSelection.item.name
    });
  }

  deleteAction () {
    const existsProtected = this.snapSelection.items.some(item => {
      return item.is_protected;
    });
    if (existsProtected) {
      this.showValidationError(this.cephRbdSnapshotValidationErrors.deleteProtected);
      return;
    }
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRbdSnapshotDeleteModal",
      resolve: {
        fsid: () => {
          return this.fsid;
        },
        poolName: () => {
          return this.poolName;
        },
        imageName: () => {
          return this.imageName;
        },
        snapSelection:  () => {
          return this.snapSelection.items;
        }
      }
    });

    modalInstance.result.then(() => {
      this.onFilterConfigChange();
    });
  }

  showValidationError (validationError) {
    this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRbdSnapshotErrorModal",
      resolve: {
        validationError: () => {
          return validationError;
        }
      }
    });
  }

  _updateState (snapshots, pendingTasks) {
    let notStartedTasks = pendingTasks[0].results || [];
    let runningTasks = pendingTasks[1].results || [];
    let results = notStartedTasks.concat(runningTasks);
    let taskIds = [];
    results.forEach((task) => {
      if (task.description.startsWith("Rollback RBD ") && taskIds.indexOf(task.id) === -1) {
        taskIds.push(task.id);
        snapshots.results.forEach((snapshot) => {
          if (snapshot.name === task.snap &&
              this.imageName === task.image &&
              this.poolName === task.pool &&
              this.fsid === task.fsid) {
            snapshot.executing = "ROLLING_BACK";
          }
        });
      }
    });
    let finishedTasksCounter = 0;
    taskIds.forEach((taskId) => {
      this.taskQueueSubscriber.subscribe(taskId, () => {
        finishedTasksCounter++;
        if (taskIds.length === finishedTasksCounter) {
          snapshots.results.forEach((snapshot) => {
            delete snapshot.executing;
          });
        }
      });
    });
  }

  rollbackAction () {
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRbdSnapshotRollbackModal",
      resolve: {
        fsid: () => {
          return this.fsid;
        },
        poolName: () => {
          return this.poolName;
        },
        imageName: () => {
          return this.imageName;
        },
        snapName:  () => {
          return this.snapSelection.item.name;
        }
      }
    });

    modalInstance.result.then(() => {
      this.taskQueueSubscriber.pendingTasksPromise()
        .then((tasks) => {
          this._updateState(this.snapshots, tasks);
        });
    });
  }

  onSelectionChange (selection) {
    this.snapSelection = selection;
    let items = selection.items;

    this.multiSelection = items && items.length > 1;
    this.hasSelection = items && items.length === 1;
  }

  onFilterConfigChange () {
    this.snapshots = {};
    this.error = false;
    if (this.fsid && this.poolName && this.imageName) {
      this.taskQueueSubscriber.pendingTasksPromise()
        .then((tasks) => {
          this.cephRbdSnapshotService
            .list({
              fsid: this.fsid,
              page: this.filterConfig.page + 1,
              pageSize: this.filterConfig.entries,
              search: this.filterConfig.search,
              ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") + this.filterConfig.sortfield,

              pool: this.poolName,
              imagename: this.imageName
            })
            .$promise
            .then((res) => {
              this._updateState(res, tasks);
              this.snapshots = res;
            })
            .catch((error) => {
              this.error = error;
            });
        })
        .catch((error) => {
          this.error = error;
        });
    }
  }
}

export default {
  template: require("./ceph-rbd-snapshot-list.component.html"),
  bindings: {
    imageFeatures: "<",
    imageName: "<",
    poolName: "<",
    fsid: "<"
  },
  controller: CephRbdSnapshotList
};
