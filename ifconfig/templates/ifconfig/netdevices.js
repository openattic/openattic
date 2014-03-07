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

Ext.define('Ext.oa.Ifconfig__NetDevice_TreePanel', {
  alias: 'widget.ifconfig__netdevice_treepanel',
  extend: 'Ext.tree.Panel',
  initComponent: function(){
    var store = Ext.create('Ext.data.TreeStore', {
      model: Ext.define('ifconfig__netdevice_treemodel', {
        extend  : 'Ext.data.TreeModel',
        requires: ['Ext.data.NodeInterface'],
        fields  : ['id', 'devname'],
        createNode: function(record){
          var rootNode = this.callParent(arguments);
          rootNode.set('text', record.raw.devname);
          rootNode.set('id', ['ifconfig__hostgroup_subitem', record.raw.id, Ext.id()].join('.'));
          return rootNode;
        }
      }),
      proxy: {
        type: 'direct',
        directFn: ifconfig__NetDevice.get_root_devices
      },
      root: {
        text: 'root',
        id  : 'ifconfig__netdevice_treepanel_rootnode' 
      }
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      rootVisible     : false,
      store           : store,
      useArrows       : true,
      autoScroll      : true,
      animate         : true,
      containerScroll : true,
      frame           : true,
      viewConfig      : {
        plugins: {
          ptype: 'treeviewdragdrop'
        }
      }
    }));
    this.callParent(arguments);
  }
});

Ext.define('Ext.oa.Ifconfig__NetDevice_Panel', {
  extend: 'Ext.Panel',
  alias: "widget.ifconfig__netdevice_panel",
  initComponent: function(){
    var netDevPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'ifconfig__netdevice_panel_inst',
      title: gettext('Network interfaces'),
      layout: "border",
      items: [{
        xtype: 'ifconfig__netdevice_treepanel',
        id   : 'ifconfig__netdevice_treepanel_inst'
      }]
    }));
    this.callParent(arguments);
  }
});

Ext.oa.Ifconfig__NetDevice_Module = {
  panel: "ifconfig__netdevice_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Network'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/network.png',
      panel: 'ifconfig__netdevice_panel_inst'
    });
  }
};


// window.MainViewModules.push( Ext.oa.Ifconfig__NetDevice_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
