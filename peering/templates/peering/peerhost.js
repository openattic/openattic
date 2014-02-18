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

Ext.oa.Peering__HostAttrPlugin = {
  getStore: function(tree){
    Ext.define('peering_peers_model', {
      extend: 'Ext.data.Model',
      fields: [
        'id', '__unicode__', 'text',
        {name: "hostname", mapping: "host", convert: toUnicode}
      ]
    });
    var store = Ext.create('Ext.data.TreeStore', {
      model: "peering_peers_model",
      root: {
        text: gettext("Peers"),
        id: "peering_root",
        leaf: false,
        expanded: false
      },
      proxy: {
        type:       'direct',
        directFn:   peering__PeerHost.filter,
        paramOrder: ["hostkwds"],
        pageParam:  undefined,
        startParam: undefined,
        limitParam: undefined
      },
      listeners: {
        load: function(self, node, records, success, ovOpts){
          for( var i = 0; i < records.length; i++ ){
            records[i].set("id",   "peering__PeerHost." + records[i].get("id"));
            records[i].set("leaf", true);
            records[i].set("text", records[i].get("__unicode__"));
            records[i].commit();
          }
        }
      }
    });
    return store;
  },
  addClicked: function(tree, selectedRecord, currentHost){
    if( selectedRecord.data.id !== "peering_root" && selectedRecord.data.parentId !== "peering_root" )
      return;
    var addwin = Ext.oa.getShareEditWindow({
      title: gettext("Add Peer Host"),
      api: peering__PeerHost,
      form: {
        items: [{
          xtype: "hidden",
          name:  "host",
          value: currentHost.id
        }, {
          xtype: 'textfield',
          fieldLabel: gettext('Base URL'),
          name: "base_url",
          value: Ext.String.format("http://__:<<APIKEY>>@{0}:31234/", currentHost.name)
        }]
      },
      success: function(){
        Ext.getCmp("ifconfig__host_attributes_panel_inst").refresh();
      }
    });
    addwin.show();
  },
  removeClicked: function(tree, selectedRecord){
    if( selectedRecord.data.parentId !== "peering_root" )
      return;
    var recid = parseInt(selectedRecord.data.id.split(".")[1]);
    Ext.Msg.confirm(
      gettext('Confirm delete'),
      interpolate(gettext('Really delete Peer %s?'), [selectedRecord.data.text]),
      function(btn, text){
        if( btn === 'yes' ){
          peering__PeerHost.remove(recid, function(provider, response){
            if( response.type !== 'exception' ){
              Ext.getCmp("ifconfig__host_attributes_panel_inst").refresh();
            }
          });
        }
      }
    );
  }
};

window.HostAttrPlugins.push( Ext.oa.Peering__HostAttrPlugin );



// kate: space-indent on; indent-width 2; replace-tabs on;
