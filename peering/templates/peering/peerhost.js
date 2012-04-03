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

Ext.oa.Peering__Peerhost_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    "use strict";
    var peerhostGrid = this;
    var addwin = new Ext.Window(Ext.apply(config, {
      layout: "fit",
      height: 140,
      width: 500,
      items: [{
        xtype: "form",
        autoScroll: true,
        bodyStyle: 'padding:5px 5px;',
        api: {
          load:   peering__PeerHost.get_ext,
          submit: peering__PeerHost.set_ext
        },
        defaults: {
          xtype: "textfield",
          anchor: '-20px'
        },
        paramOrder: ["id"],
        baseParams: {
          id: (record ? record.id : -1)
        },
        listeners: {
          afterrender: function(self){
            self.getForm().load();
          }
        },
        items: [ {
          xtype: 'textfield',
          fieldLabel: gettext('Name'),
          name: "name"
        }, {
          xtype: 'textfield',
          fieldLabel: gettext('Base URL'),
          name: "base_url",
          value: "http://__:<<APIKEY>>@<<HOST>>:31234/"
        } ],
        buttons: [{
          text: config.submitButtonText,
          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
          handler: function(self){
            self.ownerCt.ownerCt.getForm().submit({
              success: function(provider, response){
                if( response.result ){
                  peerhostGrid.store.reload();
                  addwin.hide();
                }
              }
            });
          }
        }, {
          text: gettext('Cancel'),
          icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
          handler: function(self){
            addwin.hide();
          }
        }]
      }]
    }));
    addwin.show();
  },

  initComponent: function(){
    "use strict";
    var peerhostGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'peering__peerhost_panel_inst',
      title: gettext('openATTIC Peers'),
      buttons: [ {
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          peerhostGrid.store.reload();
        }
      }, {
        text: gettext('Add Peer'),
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          peerhostGrid.showEditWindow({
            title: gettext('Add Peer'),
            submitButtonText: gettext('Create Peer')
          });
        }
      }, {
        text: gettext('Edit Peer'),
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = peerhostGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            peerhostGrid.showEditWindow({
              title: gettext('Edit Peer'),
              submitButtonText: gettext('Edit Peer')
            }, sel.data);
          }
        }
      }, {
        text: gettext('Delete Peer'),
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: peerhostGrid
        }],
        keys: [{scope: peerhostGrid, key:[Ext.EventObject.DELETE], handler: this.deleteFunction}],
      store: new Ext.data.DirectStore({
        autoScroll: true,
        fields: ['id', 'base_url', 'name', 'hostname'],
        directFn: peering__PeerHost.all
      }),
      viewConfig: {
        forceFit: true
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: gettext('Name'),
          width: 100,
          dataIndex: "name"
        }, {
          header: gettext('Hostname'),
          width: 200,
          dataIndex: "hostname"
        }]
      })
    }));
    Ext.oa.Peering__Peerhost_Panel.superclass.initComponent.apply(this, arguments);
  },
  deleteFunction: function(self){
    "use strict";
    var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      Ext.Msg.confirm(
        gettext('Delete Peer'),
        interpolate(
          gettext('Do you really want to delete %s?'),[sel.data.name]),
        function(btn){
          if(btn === 'yes'){
            peering__PeerHost.remove( sel.data.id, function(provider, response){
              sel.store.reload();
            });
          }
        }
      );
    }
  },
  onRender: function(){
    "use strict";
    Ext.oa.Peering__Peerhost_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
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

Ext.reg("peering__peerhost_panel", Ext.oa.Peering__Peerhost_Panel);

Ext.oa.Peering__Peerhost_Module = Ext.extend(Object, {
  panel: "peering__peerhost_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_services", {
      text: gettext('openATTIC Peers'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'peering__peerhost_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Peering__Peerhost_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
