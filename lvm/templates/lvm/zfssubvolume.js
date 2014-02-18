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

Ext.define('Ext.oa.Zfs__Subvolume__Panel', {
  alias: 'widget.zfs__subvolume__panel',
  extend: 'Ext.grid.GridPanel',
  showEditWindow: function(config, record){
    var subvolumegrid = this;
    var addwin = Ext.oa.getShareEditWindow(Ext.apply(config, {
      api: lvm__ZfsSubvolume,
      success: function(){ subvolumegrid.store.load(); },
      form: {
        items: [{
          xtype: 'fieldset',
          layout: 'form',
          items: [{
            fieldLabel: gettext("Name"),
            name: "volname",
            xtype: 'textfield',
            allowBlank: false,
            ref: "namefield"
          },{
            xtype: 'combo',
            name: "volume_",
            name: 'volume',
            allowBlank: false,
            fieldLabel: gettext('Volume'),
            store: (function(){
              Ext.define('zfssubvolume_volumes_filter_store', {
                extend: 'Ext.data.Model',
                fields: [
                  {name: 'name'},
                  {name: 'id'}
                ]
              });
              return Ext.create('Ext.data.Store', {
                model: "zfssubvolume_volumes_filter_store",
                proxy: {
                  type: 'direct',
                  directFn: lvm__LogicalVolume.filter_combo,
                  paramOrder: ["field", "query", "kwds"],
                  extraParams: { "field": "name", kwds: {"filesystem":"zfs" }}
                }
              });
            }()),
            deferEmptyText: false,
            emptyText: "Select...",
            triggerAction: "all",
            selectOnFocus: true,
            displayField: "name",
            valueField: "id",
            ref: "volfield"
          }]
        }]
      }
    }));
    addwin.show();
  },
  initComponent: function(){
    var subvolumegrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "zfs__subvolume_panel_inst",
      title: "zfs",
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          subvolumegrid.store.load();
        }
      },{
        text: gettext('Create Subvolume'),
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function() {
          subvolumegrid.showEditWindow({
            title: gettext('Add Subvolume'),
            texts: {
              submit: gettext('Create Subvolume')
            }
          });
        }
      },{
        text: gettext('Delete Subvolume'),
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: subvolumegrid
      }],
      keys: [{ scope: subvolumegrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],

      store: (function(){
        Ext.define('zfssubvolume_volumes_store', {
          extend: 'Ext.data.Model',
          fields: [
            {name: 'id'},
            {name: 'volname'},
            {name: 'orivolume',mapping: 'volume',convert: function(val, row) {
              if( val === null ){
                return null;
              }
              return val.name;
            }}
          ]
        });
        return Ext.create('Ext.data.Store', {
          model: "zfssubvolume_volumes_store",
          proxy: {
            type: 'direct',
            directFn: lvm__ZfsSubvolume.all
          }
        });
      }()),
      forceFit: true,
      defaults: {
        sortable: true
      },
      columns: [{
        header: gettext('Subvolume'),
        dataIndex: "volname"
      },{
        header: gettext('Volume'),
        dataIndex: "orivolume"
      }]
    }));
    this.callParent(arguments);
  },
  deleteFunction: function(self){
    var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selected.items[0];
      Ext.Msg.confirm(
        gettext('Confirm delete'),
        interpolate(
          gettext('Really delete subvolume %s ?<br /><b>There is no undo.</b>'), [sel.data.name]),
        function(btn){
          if(btn === 'yes'){
            lvm__ZfsSubvolume.remove( sel.data.id, function(provider, response){
            sel.store.load();
            });
          }
        }
      );
    }
  },
  onRender: function(){
    this.callParent(arguments);
    this.store.load();
    var self = this;
    var menu = new Ext.menu.Menu({
      items: [{
        text: 'delete',
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png"
      }],
      listeners: {
        itemclick: function(item) {
          self.deleteFunction();
        }
      }
    });
    this.on({
      'contextmenu': function(event) {
        if( this.getSelectionModel().hasSelection() ){
          event.stopEvent();
          menu.showAt(event.xy);
        }
      }
    });
  }
});



// kate: space-indent on; indent-width 2; replace-tabs on;
