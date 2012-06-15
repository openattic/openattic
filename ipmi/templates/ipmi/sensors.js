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

Ext.oa.Ipmi__Sensors_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    "use strict";
    var fields = ['sensor', 'value', 'status'];
    var sensorGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "ipmi__sensors_panel_inst",
      title: gettext('Sensors'),
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          sensorGrid.store.reload();
        }
      } ],
      store: {
        xtype: "directstore",
        fields: fields,
        directFn: ipmi__Sensor.get_most_sensors,
        reader: new Ext.data.ArrayReader({
          fields: fields
        })
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: gettext('Sensor'),
          width: 300,
          dataIndex: "sensor"
        }, {
          header: gettext('Current value'),
          width: 300,
          dataIndex: "value"
        }, {
          header: gettext('Status'),
          width: 100,
          dataIndex: "status"
        } ]
      })
    }));
    Ext.oa.Ipmi__Sensors_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.Ipmi__Sensors_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("ipmi__sensors_panel", Ext.oa.Ipmi__Sensors_Panel);

Ext.oa.Lvm__Mounts_Module = Ext.extend(Object, {
  panel: "ipmi__sensors_panel",

  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Sensors'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/gnome-monitor.png',
      panel: "ipmi__sensors_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__Mounts_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
