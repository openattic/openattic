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

Ext.oa.Peering__Peerhost_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: peering__PeerHost,
  id: "peering__peerhost_panel_inst",
  title: gettext("openATTIC Peers"),
  window: {
    height: 200
  },
  texts: {
    add:  gettext("Add Peer"),
    edit: gettext("Edit Peer"),
    remove: gettext("Delete Peer")
  },
  store: {
    fields: [{
      name: 'hostname',
      mapping: 'host',
      convert: toUnicode
    }]
  },
  columns: [{
    header: gettext('Hostname'),
    width: 200,
    dataIndex: "hostname"
  }],
  form: {
    items: [{
      xtype:      'combo',
      fieldLabel: gettext('Host'),
      allowBlank: true,
      anchor:     '-20px',
      hiddenName: 'host',
      store: {
        xtype: "directstore",
        fields: ["id", "name"],
        directFn: ifconfig__Host.all
      },
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     gettext('Select...'),
      selectOnFocus: true,
      displayField:  'name',
      valueField:    'id',
      ref:           'hostfield',
      listeners: {
        afterrender: function(self){
          self.store.load();
        },
        select: function(self, record, index){
          "use strict";
          if( self.ownerCt.urlfield.getValue() === self.ownerCt.urlfield.last_auto ){
            self.ownerCt.urlfield.last_auto = String.format("http://__:<<APIKEY>>@{0}:31234/", record.data.name);
            self.ownerCt.urlfield.setValue(self.ownerCt.urlfield.last_auto);
          }
        }
      }
    }, {
      xtype: 'textfield',
      fieldLabel: gettext('Base URL'),
      name: "base_url",
      ref:  "urlfield",
      value: "http://__:<<APIKEY>>@<<HOST>>:31234/",
      listeners: {
        afterrender: function(self){
          self.last_auto = "http://__:<<APIKEY>>@<<HOST>>:31234/";
        },
      }
    } ]
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



Ext.oa.Peering__HostAttrRootType = {
  objtype: "peering_root",
  requestTreeData: function(tree, treeloader, node, callback, scope){
    peering__PeerHost.ids(
      treeloader.processDirectResponse.createDelegate(treeloader, [{callback: callback, node: node, scope: scope}], true)
    );
  },
  createTreeNode: function(tree, data){
    return new Ext.tree.AsyncTreeNode({
      objtype: 'peering_root',
      nodeType: 'async',
      id: 'peering_root',
      text: gettext("Peers"),
      leaf: false
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
    });
  },
};

Ext.oa.Peering__HostAttrPlugin = Ext.extend(Ext.util.Observable, {
  plugin_name: 'peering',
  objtypes: [
    Ext.oa.Peering__HostAttrRootType,
    Ext.oa.Peering__PeerHostType
  ],
  initTree: function(tree){
    for( var i = 0; i < this.objtypes.length; i++ ){
      tree.registerObjType(this.objtypes[i]);
    }

    return Ext.oa.Peering__HostAttrRootType;
  },
});

window.HostAttrPlugins.push( new Ext.oa.Peering__HostAttrPlugin() );



// kate: space-indent on; indent-width 2; replace-tabs on;
