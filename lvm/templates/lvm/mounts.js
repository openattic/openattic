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

Ext.define('Ext.oa.MountModel', {
    extend: 'Ext.data.Model',
    fields: ['dev', 'mountpoint', 'fstype', 'options', 'dump', 'pass']
});

Ext.define('Ext.oa.Lvm__Mounts_Panel', {

  extend: 'Ext.grid.GridPanel',
  alias: 'widget.lvm__mounts_panel',
  initComponent: function(){
    var mountGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "lvm__mounts_panel_inst",
      title: gettext('Mount Points'),
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          mountGrid.store.load();
        }
      } ],
      store: {
        model: "Ext.oa.MountModel",
        proxy: {
          type: "direct",
          directFn: lvm__BlockDevices.get_mounts,
          reader: {
            type:  "array",
          }
        },
      },
      defaults: {
        sortable: true
      },
      columns: [{
        header: gettext('Device'),
        width: 300,
        dataIndex: "dev"
      }, {
        header: gettext('Mount Point'),
        width: 300,
        dataIndex: "mountpoint"
      }, {
        header: gettext('FS Type'),
        width: 100,
        dataIndex: "fstype"
      }, {
        header: gettext('Options'),
        width: 300,
        dataIndex: "options"
      } ]
    }));
    this.callParent(arguments);
  },
  onRender: function(){
    Ext.oa.Lvm__Mounts_Panel.superclass.onRender.apply(this, arguments);
    this.store.load();
  }
});


Ext.oa.Lvm__Mounts_Module =  {
  panel: "lvm__mounts_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Mount Points'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/devices/hdd_unmount.png',
      panel: "lvm__mounts_panel_inst",
      href: '#'
    });
  }
};


window.MainViewModules.push( Ext.oa.Lvm__Mounts_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
