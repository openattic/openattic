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

Ext.oa.Peering__HostAttrRootType = {
  objtype: "peering_root",
  requestTreeData: function(tree, treeloader, node, callback, scope){
    if( node.attributes.host !== null ){
      peering__PeerHost.ids_filter({"host__id": node.attributes.host.id},
        treeloader.processDirectResponse.createDelegate(treeloader, [{callback: callback, node: node, scope: scope}], true)
      );
    }
  },
  createTreeNode: function(tree, data){
    return new Ext.tree.AsyncTreeNode({
      objtype: 'peering_root',
      nodeType: 'async',
      id: 'peering_root',
      text: gettext("Peers"),
      host: data,
      leaf: false,
      actions: [{
        name: "add",
        icon: "add",
        handler: function(self){
          var addwin = Ext.oa.getShareEditWindow({
            title: gettext("Add Peer Host"),
            api: peering__PeerHost,
            form: {
              items: [{
                xtype: "hidden",
                name:  "host",
                value: self.attributes.host.id
              }, {
                xtype: 'textfield',
                fieldLabel: gettext('Base URL'),
                name: "base_url",
                value: Ext.String.format("http://__:<<APIKEY>>@{0}:31234/", self.attributes.host.name)
              }]
            },
            success: function(){
              Ext.getCmp("ifconfig__host_attributes_panel_inst").refresh();
            }
          });
          addwin.show();
        }
      }]
    });
  }
};

Ext.oa.Peering__PeerHostType = {
  objtype: "peering__PeerHost",
  requestTreeData: null,
  createTreeNode: function(tree, data){
    return new Ext.tree.TreeNode({
      objtype: "peering__PeerHost",
      objid: data.id,
      text: data.__unicode__,
      leaf: true,
      actions: [{
        name: "remove",
        icon: "remove",
        handler: function(self){
          Ext.Msg.confirm(
            gettext('Confirm delete'),
            interpolate(gettext('Really delete Peer %s?'), [self.attributes.text]),
            function(btn, text){
              if( btn === 'yes' ){
                peering__PeerHost.remove(self.attributes.objid, function(provider, response){
                  if( response.type !== 'exception' ){
                    self.remove(true);
                  }
                });
              }
            }
          );
        }
      }]
    });
  },
};

Ext.oa.Peering__HostAttrPlugin = {
  plugin_name: 'peering',
  objtypes: [
    Ext.oa.Peering__HostAttrRootType,
    Ext.oa.Peering__PeerHostType
  ],
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
        id: "peers_root",
        leaf: false,
        expanded: false,
      },
      proxy: {
        type:       'direct',
        directFn:   peering__PeerHost.all,
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
  }
};

window.HostAttrPlugins.push( Ext.oa.Peering__HostAttrPlugin );



// kate: space-indent on; indent-width 2; replace-tabs on;
