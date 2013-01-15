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

Ext.oa.Lvm__Mounts_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    "use strict";
    var fields = ['dev', 'mountpoint', 'fstype', 'options', 'dump', 'pass'];
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
          mountGrid.store.reload();
        }
      } ],
      store: {
        xtype: "directstore",
        fields: fields,
        directFn: lvm__BlockDevices.get_mounts,
        reader: new Ext.data.ArrayReader({
          fields: fields
        })
      },
      colModel: new Ext.grid.ColumnModel({
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
      })
    }));
    Ext.oa.Lvm__Mounts_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.Lvm__Mounts_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("lvm__mounts_panel", Ext.oa.Lvm__Mounts_Panel);

Ext.oa.Lvm__Mounts_Module = Ext.extend(Object, {
  panel: "lvm__mounts_panel",

  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Mount Points'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/devices/hdd_unmount.png',
      panel: "lvm__mounts_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__Mounts_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
