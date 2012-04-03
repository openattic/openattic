/*
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.oa.Pkgapt__Upgrade_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    "use strict";
    var aptGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'pkgapt__upgrade_panel_inst',
      title: gettext('APT'),
      viewConfig: { forceFit: true },
      buttons: [ {
        text: gettext('Reload Changes list'),
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        handler: function(self, state){
          aptGrid.reload(Ext.state.Manager.get("pkgapt_distupgrade", true));
        }
      }, {
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        text: gettext('Update Package lists'),
        handler: function(self){
          aptGrid.getEl().mask("Updating package lists...");
          pkgapt__Apt.update(function(provider, response){
            aptGrid.getEl().unmask();
            aptGrid.reload();
          });
        }
      }, {
        text: gettext('Allow installation/deletion'),
        enableToggle: true,
        icon: MEDIA_URL + '/icons2/16x16/mimetypes/package.png',
        pressed: Ext.state.Manager.get("pkgapt_distupgrade", true),
        handler: function(self, state){
          Ext.state.Manager.set("pkgapt_distupgrade", self.pressed);
          aptGrid.reload(self.pressed);
        }
      }, {
        text: gettext('Do Upgrade'),
        icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
        handler: function(self){
          aptGrid.getEl().mask("Upgrade is running...");
          pkgapt__Apt.do_upgrade(Ext.state.Manager.get("pkgapt_distupgrade", true), function(provider, response){
            aptGrid.getEl().unmask();
            aptGrid.reload();
          });
        }
      } ],
      store: {
        xtype: 'jsonstore',
        fields: ['name', 'candidate_version', 'installed_version',
          'marked_delete', 'marked_downgrade', 'marked_install', 'marked_upgrade']
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: gettext('Name'),
          width: 200,
          dataIndex: "name"
        }, {
          header: gettext('Installed Version'),
          width: 200,
          dataIndex: "installed_version"
        }, {
          header: gettext('Candidate Version'),
          width: 200,
          dataIndex: "candidate_version"
        }, {
          header: gettext('Action'),
          width: 200,
          dataIndex: "name",
          renderer: function( val, x, store ){
            if( store.data.marked_delete ){    return "Delete";    }
            if( store.data.marked_downgrade ){ return "Downgrade"; }
            if( store.data.marked_install ){   return "Install";   }
            if( store.data.marked_upgrade ){   return "Upgrade";   }
          }
        }]
      }),
      reload: function( dist_upgrade ){
        pkgapt__Apt.get_upgrade_changes(dist_upgrade, function(provider, response){
          aptGrid.setTitle(String.format(
            "APT: Upgrading {0}, newly installing {1}, deleting {2}, keeping {3} packages, downloading {4} MiB. ",
            response.result[0].upgrade_count, response.result[0].new_install_count,
            response.result[0].delete_count,  response.result[0].keep_count,
            (response.result[0].req_download / 1024.0 / 1024.0).toFixed(2)
          ) + String.format(
            (response.result[0].req_space < 0 ? "{0} MiB will be freed." : "{0} MiB of additional disk space will be used."),
            Math.abs(response.result[0].req_space / 1024.0 / 1024.0).toFixed(2)
          ));
          aptGrid.store.loadData(response.result[1]);
        });
      }
    }));
    Ext.oa.Pkgapt__Upgrade_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.Pkgapt__Upgrade_Panel.superclass.onRender.apply(this, arguments);
    this.reload(Ext.state.Manager.get("pkgapt_distupgrade", true));
  }
});

Ext.reg("pkgapt__upgrade_panel", Ext.oa.Pkgapt__Upgrade_Panel);

Ext.oa.Pkgapt__Upgrade_Module = Ext.extend(Object, {
  panel: "pkgapt__upgrade_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Online Update'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/update.png',
      panel: 'pkgapt__upgrade_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Pkgapt__Upgrade_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
