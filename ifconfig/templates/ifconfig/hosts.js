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

Ext.define('Ext.oa.Ifconfig__Host_Panel', {
  extend: 'Ext.oa.ShareGridPanel',
  alias: "widget.ifconfig__host_panel",
  api: ifconfig__Host,
  texts: {
    add:     gettext("Add Host"),
    edit:    gettext("Edit Host"),
    remove:  gettext("Delete Host"),
    confirm: gettext('Do you really want to delete host %s?')
  },
  columns: [{
    header: gettext('Name'),
    width: 200,
    dataIndex: "name"
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'Host',
      layout: 'form',
      items: [{
        xtype: 'textfield',
        fieldLabel: gettext('Name'),
        allowBlank: false,
        name: "name"
      }]
    }]
  }
});


Ext.define('Ext.oa.Ifconfig__Host_Attributes_TreePanel', {
  extend: 'Ext.tree.TreePanel',
  alias: "widget.ifconfig__host_attributes_panel",
  registerObjType: function(objtype){
    this.objtypes[ objtype.objtype ] = objtype;
  },
  initComponent: function(){
    this.objtypes = {};
    this.pluginroots = [];

    var treestore = Ext.create("Ext.data.TreeStore", {
      fields: ['text'],
      proxy: { type: "memory" },
      root: {
        text:     'root',
        expanded: true,
        id: "host_attr_root_node"
      }
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      useArrows       : true,
      autoScroll      : true,
      animate         : true,
      containerScroll : true,
      rootVisible     : false,
      frame           : true,
      store           : treestore,
      buttons         : [{
        text: "Add",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        scope: this,
        handler: function(){
          
        }
      }, {
        text: self.texts.remove,
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(){
          
        },
        scope: self
      }]
    }));

    this.callParent(arguments);

    var childstore;
    for( var i = 0; i < window.HostAttrPlugins.length; i++ ){
      childstore = window.HostAttrPlugins[i].getStore(this);
      childstore.load();
      treestore.getRootNode().appendChild(childstore.getRootNode());
    }
  },
  clear: function(){
    while(this.root.childNodes.length){
      this.root.childNodes[0].remove(true);
    }
  },
  setHost: function(host){
    this.clear();
    this.host = host;
    for( var i = 0; i < this.pluginroots.length; i++ ){
      var node = this.pluginroots[i].createTreeNode(this, host);
      this.root.appendChild( node );
      node.expand();
    }
  },
  refresh: function(){
    this.clear();
    this.setHost(this.host);
  }
});


Ext.define('Ext.oa.Ifconfig__Host_Groups_Panel', {
  extend: 'Ext.Panel',
  alias: "widget.ifconfig__host_group_panel",
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "ifconfig__host_group_panel_inst",
      title: gettext('Hosts and Groups'),
      layout: 'border',
      items: [{
        xtype: "ifconfig__host_panel",
        id:    "ifconfig__host_panel_inst",
        region: "center",
        listeners: {
          cellclick: function( self, rowIndex, colIndex, evt ){
            var record = self.getStore().getAt(rowIndex);
            Ext.getCmp("ifconfig__host_attributes_panel_inst").setHost(record.data);
          }
        },
      }, {
        region: "east",
        width: (Ext.core.Element.getViewWidth() - 200) / 2,
        split: true,
        title: gettext("Host Attributes"),
        id:    "ifconfig__host_attributes_panel_inst",
        xtype: 'ifconfig__host_attributes_panel'
      }]
    }));
    this.callParent(arguments);
  },
  refresh: function(){
    Ext.getCmp("ifconfig__host_panel_inst").refresh();
    Ext.getCmp("ifconfig__host_attributes_panel_inst").clear();
    Ext.StoreMgr.get("hostgroupstore").removeAll();
  }
});


Ext.oa.Ifconfig__Host_Module =  {
  panel: "ifconfig__host_group_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Hosts'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'ifconfig__host_group_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Ifconfig__Host_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
