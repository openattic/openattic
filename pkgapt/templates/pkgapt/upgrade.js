/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.define('Ext.oa.Pkgapt__Upgrade_Panel', {
  alias: 'widget.pkgapt__upgrade_panel',
  extend: 'Ext.grid.GridPanel',
  initComponent: function(){
    var aptGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'pkgapt__upgrade_panel_inst',
      title: gettext('APT'),
      forceFit: true,
      buttons: [ {
        text: gettext('Reload Changes list'),
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        handler: function(self, state){
          aptGrid.load(Ext.state.Manager.get("pkgapt_distupgrade", true));
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
      } ],
      store: (function(){
        Ext.define('pkgapt_model', {
          extend: 'Ext.data.Model',
          fields: ['name', 'candidate_version', 'installed_version',
            'marked_delete', 'marked_downgrade', 'marked_install', 'marked_upgrade']
        });
        return Ext.create('Ext.data.ArrayStore', {
          model: "pkgapt_model"
        });
      }()),
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
      }],
      refresh: function(){
        pkgapt__Apt.get_upgrade_changes(Ext.state.Manager.get("pkgapt_distupgrade", true), function(provider, response){
          aptGrid.setTitle(Ext.String.format(
            "APT: Upgrading {0}, newly installing {1}, deleting {2}, keeping {3} packages, downloading {4} MiB. ",
            response.result[0].upgrade_count, response.result[0].new_install_count,
            response.result[0].delete_count,  response.result[0].keep_count,
            (response.result[0].req_download / 1024.0 / 1024.0).toFixed(2)
          ) + Ext.String.format(
            (response.result[0].req_space < 0 ? "{0} MiB will be freed." : "{0} MiB of additional disk space will be used."),
            Math.abs(response.result[0].req_space / 1024.0 / 1024.0).toFixed(2)
          ));
          aptGrid.store.loadData(response.result[1]);
        });
      }
    }));
    this.callParent(arguments);
  },
  onRender: function(){
    this.callParent(arguments);
    this.refresh();
  }
});


Ext.oa.Pkgapt__Upgrade_Module = {
  panel: "pkgapt__upgrade_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Online Update'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/update.png',
      panel: 'pkgapt__upgrade_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Pkgapt__Upgrade_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
