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

Ext.oa.Lio__HostAttrRootType = {
  objtype: "lio_root",
  requestTreeData: function(tree, treeloader, node, callback, scope){
    if( node.attributes.host !== null ){
      lio__Initiator.ids_filter({"host__id": node.attributes.host.id},
        treeloader.processDirectResponse.createDelegate(treeloader, [{callback: callback, node: node, scope: scope}], true)
      );
    }
  },
  createTreeNode: function(tree, data){
    return new Ext.tree.AsyncTreeNode({
      objtype: 'lio_root',
      nodeType: 'async',
      uiProvider: Ext.oa.HostAttrTreeNodeUI,
      id: 'lio_root',
      text: gettext("Initiators"),
      host: data,
      leaf: false,
      actions: [{
        name: "add",
        icon: "add",
        handler: function(self){
          var addwin = Ext.oa.getShareEditWindow({
            title: gettext("Add Initiator"),
            api: lio__Initiator,
            form: {
              items: [{
                xtype: "hidden",
                name:  "host",
                value: self.attributes.host.id
              }, {
                fieldLabel: gettext('Type'),
                hiddenName: 'type',
                xtype:      'combo',
                store: [ [ 'iscsi',  gettext('iSCSI')  ], [ 'qla2xxx', gettext('Fibre Channel') ] ],
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                value: "iscsi"
              }, {
                xtype: 'textfield',
                fieldLabel: gettext('WWN/IQN'),
                name: "wwn"
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

Ext.oa.Lio__InitiatorType = {
  objtype: "lio__Initiator",
  requestTreeData: null,
  createTreeNode: function(tree, data){
    return new Ext.tree.TreeNode({
      objtype: "lio__Initiator",
      objid: data.id,
      uiProvider: Ext.oa.HostAttrTreeNodeUI,
      text: data.__unicode__,
      leaf: true,
      actions: [{
        name: "remove",
        icon: "remove",
        handler: function(self){
          Ext.Msg.confirm(
            gettext('Confirm delete'),
            interpolate(gettext('Really delete Initiator %s?'), [self.attributes.text]),
            function(btn, text){
              if( btn === 'yes' ){
                lio__Initiator.remove(self.attributes.objid, function(provider, response){
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

Ext.oa.Lio__HostAttrPlugin = Ext.extend(Ext.util.Observable, {
  plugin_name: 'lio',
  objtypes: [
    Ext.oa.Lio__HostAttrRootType,
    Ext.oa.Lio__InitiatorType
  ],
  initTree: function(tree){
    for( var i = 0; i < this.objtypes.length; i++ ){
      tree.registerObjType(this.objtypes[i]);
    }

    return Ext.oa.Lio__HostAttrRootType;
  }
});

window.HostAttrPlugins.push( new Ext.oa.Lio__HostAttrPlugin() );

// kate: space-indent on; indent-width 2; replace-tabs on;
