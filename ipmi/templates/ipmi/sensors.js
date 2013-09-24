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

 Ext.define('Ext.oa.Ipmi__Sensors_Panel', {

  alias: 'widget.ipmi__sensors_panel',
  extend: 'Ext.grid.GridPanel',
  initComponent: function(){
    var fields = ['sensor', 'value', 'status'];
    var sensorGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "ipmi__sensors_panel_inst",
      title: gettext('Sensoren'),
      forceFit: true,
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/load.png",
        tooltip: gettext('load'),
        handler: function(self){
          sensorGrid.store.load();
        }
      }],
      store: (function(){
        Ext.define('ipmi_model', {
          extend: 'Ext.data.Model',
          fields: fields
        });
        return Ext.create('Ext.data.Store', {
          model: "ipmi_model",
          proxy: {
            type: 'direct',
            directFn: ipmi__Sensor.get_most_sensors,
            reader: new Ext.data.ArrayReader({
              fields: fields
            })
          },
          autoLoad: true
        });
      }()),
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
      }]
    }));
    this.callParent(arguments);
  },
  reload: function(){
    this.store.load();
  },
  onRender: function(){
    this.callParent(arguments);
    this.store.load();
  }
});


Ext.oa.Lvm__Mounts_Module = {
  panel: "ipmi__sensors_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Sensoren'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/gnome-monitor.png',
      panel: "ipmi__sensors_panel_inst",
      href: '#'
    });
  }
};


window.MainViewModules.push( Ext.oa.Lvm__Mounts_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
