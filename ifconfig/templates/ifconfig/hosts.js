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

Ext.oa.Ifconfig__Host_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: ifconfig__Host,
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
      }]
    }]
  }
});


Ext.reg("ifconfig__host_panel", Ext.oa.Ifconfig__Host_Panel);


Ext.oa.Ifconfig__Host_Attributes_TreeLoader = Ext.extend(Ext.tree.TreeLoader, {
  directFn: lvm__LogicalVolume.all,
  requestData: function(node, callback, scope){
    this.tree.objtypes[ node.attributes.objtype ].requestTreeData(this.tree, this, node, callback, scope);
  },
  createNode: function(data){
    return this.tree.objtypes[ data.app + '__' + data.obj ].createTreeNode(this.tree, data);
  }
});

Ext.oa.Ifconfig__Host_Attributes_TreePanel = Ext.extend(Ext.tree.TreePanel, {
  registerObjType: function(objtype){
    this.objtypes[ objtype.objtype ] = objtype;
  },
  initComponent: function(){
    "use strict";

    this.objtypes = {};

    var rootnode = new Ext.tree.TreeNode({
      nodeType  : 'async',
      objtype   : "root",
      text      : 'root',
      leaf      : false,
      expanded  : true,
      expandable: true,
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      useArrows       : true,
      autoScroll      : true,
      animate         : true,
      containerScroll : true,
      rootVisible     : false,
      frame           : true,
      loader: new Ext.oa.Ifconfig__Host_Attributes_TreeLoader({
        clearOnLoad   : true,
        tree          : this
      }),
      root: rootnode,
    }));

    Ext.oa.LVM__Snapcore_TreePanel.superclass.initComponent.apply(this, arguments);

    for( var i = 0; i < window.HostAttrPlugins.length; i++ ){
      var pluginroot = window.HostAttrPlugins[i].initTree(this);
      rootnode.appendChild( pluginroot.createTreeNode(this, {}) );
    }
  },
});

Ext.reg("ifconfig__host_attributes_panel", Ext.oa.Ifconfig__Host_Attributes_TreePanel);


Ext.oa.Ifconfig__Host_Groups_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";

    var hostgroupstore = new Ext.data.JsonStore({
      id: "hostgroupstore",
      fields: ["app", "obj", "id", "__unicode__"]
    });

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
            hostgroupstore.host_id = record.data.id;
            hostgroupstore.loadData(record.json.hostgroup_set);
          }
        },
      }, {
        layout: "border",
        region: "south",
        id:    "ifconfig__host_south_panel_inst",
        split: true,
        items: [{
          region: "center",
          title: "Host Attributes",
          id:    "ifconfig__host_attributes_panel_inst",
          xtype: 'ifconfig__host_attributes_panel'
        }, {
          region: "east",
          title: "Host Groups",
          id:    "ifconfig__host_hostgroups_panel_inst",
          xtype: 'grid',
          split: true,
          viewConfig: { forceFit: true },
          store: hostgroupstore,
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: "Host Group",
              dataIndex: "__unicode__"
            }]
          }),
          enableDragDrop: true,
          ddGroup: "ifconfig__host_hostgroup",
          buttons: [{
            text: gettext('Host Groups'),
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
            handler: function(){
              var addwin = new Ext.Window({
                x: Ext.lib.Dom.getViewWidth() - 550,
                y: Ext.lib.Dom.getViewHeight() - 350,
                height: 300,
                width: 500,
                frame: true,
                layout: 'fit',
                title: 'Host Groups',
                items: {
                  xtype: 'sharegridpanel',
                  api: ifconfig__HostGroup,
                  ddGroup: "ifconfig__host_hostgroup",
                  enableDrag: true,
                  viewConfig: { forceFit: true },
                  columns: [{
                    header: "Name",
                    dataIndex: "__unicode__"
                  }],
                  texts: {
                    add:    gettext("Add Host Group"),
                    edit:   gettext("Edit Host Group"),
                    remove: gettext("Delete Host Group")
                  },
                  form: {
                    items: [{
                      xtype: 'fieldset',
                      title: 'Host Group',
                      layout: 'form',
                      items: [{
                        xtype: 'textfield',
                        fieldLabel: gettext('Name'),
                        allowBlank: false,
                        name: "name"
                      }]
                    }]
                  }
                }
              });
              addwin.show();
            }
          }, {
            text: gettext("Remove Host group"),
            handler: function(){
              Ext.getCmp("ifconfig__host_hostgroups_panel_inst").removeSelected();
            }
          }],
          keys: [{
            key: [Ext.EventObject.DELETE],
            handler: function(self){
              Ext.getCmp("ifconfig__host_hostgroups_panel_inst").removeSelected();
            }
          }],
          removeSelected: function(){
            var self = this;
            var sm = self.getSelectionModel();
            var sel;
            if( sm.hasSelection() ){
              sel = sm.getSelected();
              ifconfig__Host.set(self.store.host_id, {"hostgroup_set__remove": [sel.data]}, function(provider, response){
                self.store.remove(sel);
              });
            }
          },
          listeners: {
            afterrender: function(self){
              var droptarget_el =  self.getView().scroller.dom;
              var droptarget = new Ext.dd.DropTarget(droptarget_el, {
                ddGroup    : 'ifconfig__host_hostgroup',
                notifyDrop : function(ddSource, e, data){
                  var records =  ddSource.dragData.selections;
                  var addrecords = [];
                  for( var i = 0; i < records.length; i++ ){
                    if( self.store.findExact("id", records[i].data.id) === -1 ){
                      addrecords.push({
                        'app': 'ifconfig',
                        'obj': 'HostGroup',
                        'id':  records[i].data.id,
                        '__unicode__': records[i].data.__unicode__
                      });
                    }
                  }
                  if(addrecords.length > 0){
                    ifconfig__Host.set(self.store.host_id, {"hostgroup_set__add": addrecords}, function(provider, response){
                      for( var i = 0; i < addrecords.length; i++ ){
                        self.store.add([new Ext.data.Record(addrecords[i])]);
                      }
                    });
                  }
                  return true;
                }
              });
            }
          }
        }]
      }]
    }));
    Ext.oa.Ifconfig__Host_Groups_Panel.superclass.initComponent.apply(this, arguments);
  },
  refresh: function(){
    Ext.getCmp("ifconfig__host_panel_inst").refresh();
    Ext.StoreMgr.get("hostgroupstore").removeAll();
  }
});

Ext.reg("ifconfig__host_group_panel", Ext.oa.Ifconfig__Host_Groups_Panel);


Ext.oa.Ifconfig__Host_Module = Ext.extend(Object, {
  panel: "ifconfig__host_group_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Hosts and Groups'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'ifconfig__host_group_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Ifconfig__Host_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
