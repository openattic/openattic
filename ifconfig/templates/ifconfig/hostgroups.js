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

Ext.define('Ext.oa.Ifconfig__HostGroup_Panel', {
  extend: 'Ext.Panel',
  alias: 'widget.ifconfig__hostgroup_panel',
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id:'ifconfig__hostgroup_panel_inst',
      layout: 'border',
      items: [{
        xtype :'ifconfig__hostgroup_hostgroup_treepanel',
        id    : 'ifconfig__hostgroup_hostgroup_treepanel_inst',
        region: 'center'
      },{
        xtype : 'ifconfig__hostgroup_host_treepanel',
        id    : 'ifconfig__hostgroup_host_treepanel_inst',
        region: 'east',
        width : (Ext.core.Element.getViewWidth() - 200) / 2
      }]
    }));
    this.callParent(arguments);
  }
});

Ext.define('Ext.oa.Ifconfig__HostGroup_HostGroup_TreePanel', {
  extend: 'Ext.tree.Panel',
  alias : 'widget.ifconfig__hostgroup_hostgroup_treepanel',
  title : gettext('Host Groups'),
  initComponent: function(){
    var store = Ext.create('Ext.oa.SwitchingTreeStore', {
      model: 'ifconfig__hostgroup_hostgroup_model',
      proxy: {
        type    : 'direct',
        directFn: ifconfig__HostGroup.all,
        pageParam:  undefined,
        startParam: undefined,
        limitParam: undefined
      },
      root: {
        text    : 'root',
        expanded: true,
        id      : 'ifconfig__hostgroup_hostgoup_rootnode'
      }
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      useArrows       : true,
      autoScroll      : true,
      animate         : true,
      containerScroll : true,
      rootVisible     : false,
      frame           : true,
      store           : store,
      viewConfig      : {
        plugins: {
          ptype           : 'treeviewdragdrop',
          containerScroll : true,
          appendOnly      : true,
          ddGroup         : 'hostgroup',
          dropGroup       : 'host'
        },
        copy: true,
      }
    }));

    this.callParent(arguments);
  }
});

Ext.define('Ext.oa.Ifconfig__HostGroup_Host_TreePanel', {
  extend     : 'Ext.tree.TreePanel',
  alias      : 'widget.ifconfig__hostgroup_host_treepanel',
  title      : gettext('Hosts'),
  initComponent: function(){
    var store = Ext.create('Ext.oa.SwitchingTreeStore', {
      model: 'ifconfig__hostgroup_host_model',
      proxy: {
        type    : 'direct',
        directFn: ifconfig__Host.all,
        pageParam:  undefined,
        startParam: undefined,
        limitParam: undefined
      },
      root: {
        text    : 'root',
        expanded: true,
        id      : 'ifconfig__hostgroup_host_rootnode'
      }
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      useArrows       : true,
      autoScroll      : true,
      animate         : true,
      containerScroll : true,
      rootVisible     : false,
      frame           : true,
      store           : store,
      viewConfig      : {
        plugins: {
          ptype           : 'treeviewdragdrop',
          containerScroll : true,
          appendOnly      : true,
          ddGroup         : 'host',
          dropGroup       : 'hostgroup'
        },
        copy: true
      }
    }));
    this.callParent(arguments)
  }
});

Ext.define('ifconfig__hostgroup_hostgroup_model',{
  extend    : 'Ext.data.TreeModel',
  requires  : ["Ext.data.NodeInterface"],
  fields    : ['id', 'name'],
  createNode: function(record){
    var store = Ext.create('Ext.oa.SwitchingTreeStore', {
      model: 'ifconfig__hostgroup_subitem_model',
      root : record.data,
      proxy: {
        type: 'direct',
        directFn: ifconfig__Host.filter,
        extraParams: {
          kwds: {
            'hostgroup__id': record.raw.id
          }
        },
        paramOrder: ['kwds'],
        pageParam:  undefined,
        startParam: undefined,
        limitParam: undefined
      }
    });

    var rootNode = store.getRootNode();
    rootNode.set('text', record.raw.name);
    rootNode.set('id', ['ifconfig__hostgroup_hostgroup', record.raw.id, Ext.id()].join('.'));
    return rootNode;
  }
});

Ext.define('ifconfig__hostgroup_host_model', {
  extend  : 'Ext.data.TreeModel',
  requires: ['Ext.data.NodeInterface'],
  fields: ['id', 'name'],
  createNode: function(record){
    var store = Ext.create('Ext.oa.SwitchingTreeStore', {
      model: 'ifconfig__hostgroup_subitem_model',
      root : record.data,
      proxy: {
        type: 'direct',
        directFn: ifconfig__HostGroup.filter,
        extraParams: {
          kwds: {
            'hosts': record.raw.id
          }
        },
        paramOrder: ['kwds'],
        pageParam:  undefined,
        startParam: undefined,
        limitParam: undefined
      }
    });

    var rootNode = store.getRootNode();
    rootNode.set('text', record.raw.name);
    rootNode.set('id', ['ifconfig__hostgroup_host', record.raw.id, Ext.id()].join('.'));
    return rootNode;
  }
});

Ext.define('ifconfig__hostgroup_subitem_model', {
  extend  : 'Ext.data.TreeModel',
  requires: ['Ext.data.NodeInterface'],
  fields: ['id', '__unicode__'],
  createNode: function(record){
    var rootNode = this.callParent(arguments);
    rootNode.set('leaf', true);
    rootNode.set('text', record.raw.name);
    rootNode.set('id', ['ifconfig__hostgroup_subitem', record.raw.id, Ext.id()].join('.'));
    rootNode.set('allowDrag', false);
    return rootNode;
  }
});

Ext.oa.Ifconfig__HostGroup_Module = {
  panel: "ifconfig__hostgroup_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Host Groups'),
      leaf: true,
      panel: "ifconfig__hostgroup_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png'
    });
  }
};

window.MainViewModules.push( Ext.oa.Ifconfig__HostGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
