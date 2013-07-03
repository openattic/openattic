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

Ext.oa.Lio__LogicalLun_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: lio__LogicalLUN,
  texts: {
    add:     gettext('Add LUN'),
    remove:  gettext('Delete LUN'),
    confirm: gettext('Do you really want to delete LUN %s?')
  },
  allowEdit: false,
  store: {
    fields: [{
      name: "volumename",
      mapping:  "volume",
      convert: toUnicode
    }]
  },
  columns: [{
    header: gettext('Volume'),
    width: 200,
    dataIndex: "volumename"
  }, {
    header: gettext('LUN ID'),
    width:  50,
    dataIndex: "lun_id"
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'LUN',
      layout: 'form',
      items: [{
        xtype: 'volumefield',
        fieldLabel: gettext('Volume'),
        allowBlank: false,
        filesystem__isnull: true
      }, {
        xtype: 'numberfield',
        fieldLabel: gettext('LUN ID'),
        allowBlank: false,
        name: "lun_id",
      }]
    }]
  }
});


Ext.reg("lio__logicallun_panel", Ext.oa.Lio__LogicalLun_Panel);


Ext.oa.Lio__Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";

    var targetstore = new Ext.data.JsonStore({
      id: "targetstore",
      fields: ["app", "obj", "id", "__unicode__"]
    });

    var hostgroupstore = new Ext.data.JsonStore({
      id: "hostgroupstore",
      fields: ["app", "obj", "id", "__unicode__"]
    });

    var hoststore = new Ext.data.JsonStore({
      id: "hoststore",
      fields: ["app", "obj", "id", "__unicode__"]
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "lio__panel_inst",
      title: gettext('LUNs'),
      layout: 'border',
      items: [{
        xtype: "lio__logicallun_panel",
        id:    "lio__logicallun_panel_inst",
        region: "center",
        listeners: {
          cellclick: function (self, rowIndex, colIndex, evt ){
            var record = self.getStore().getAt(rowIndex);
            targetstore.llun_id = record.data.id;
            targetstore.loadData(record.json.targets);
            hostgroupstore.llun_id = record.data.id;
            hostgroupstore.loadData(record.json.hostgroups);
            hoststore.llun_id = record.data.id;
            hoststore.loadData(record.json.hosts);
          }
        },
      }, {
        layout: "border",
        region: "south",
        height: (Ext.lib.Dom.getViewHeight() - 100) / 2,
        id:    "lio__logicallun_south_panel_inst",
        split: true,
        items: [{
          region: "west",
          width: 200,
          title: "Targets",
          id:    "lio__logicallun_targets_panel_inst",
          split: true,
          xtype: 'grid',
          viewConfig: { forceFit: true },
          store: targetstore,
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: "Target",
              dataIndex: "__unicode__"
            }]
          }),
          enableDragDrop: true,
          ddGroup: "llun_target",
          buttons: [{
            text: gettext('Targets'),
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
            handler: function(){
              var addwin = new Ext.Window({
                x: Ext.lib.Dom.getViewWidth() - 650,
                y: Ext.lib.Dom.getViewHeight() - 350,
                height: 300,
                width: 600,
                frame: true,
                layout: 'fit',
                title: 'Targets',
                items: {
                  xtype: 'sharegridpanel',
                  api: lio__Target,
                  ddGroup: "llun_target",
                  enableDrag: true,
                  allowEdit: false,
                  store: {
                    fields: ["name", {
                      name: "hostname",
                      mapping: "host",
                      convert: toUnicode
                    }, "wwn", "__unicode__", "id"]
                  },
                  texts: {
                    add:     gettext('Add Target'),
                    edit:    gettext('Edit Target'),
                    remove:  gettext('Delete Target'),
                    confirm: gettext('Do you really want to delete Target %s?')
                  },
                  columns: [{
                    header: "Name",
                    dataIndex: "name"
                  }, {
                    header: "Host",
                    dataIndex: "hostname"
                  }, {
                    header: "WWN",
                    dataIndex: "wwn"
                  }],
                  form: {
                    items: [{
                      xtype: 'fieldset',
                      title: 'Target',
                      layout: 'form',
                      items: [{
                        xtype: 'textfield',
                        fieldLabel: gettext('Name'),
                        allowBlank: false,
                        name: "name"
                      }, {
                        xtype:      'combo',
                        fieldLabel: gettext('Host'),
                        allowBlank: true,
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
                          }
                        }
                      }, {
                        fieldLabel: gettext('Type'),
                        hiddenName: 'type',
                        xtype:      'combo',
                        store: [ [ 'iscsi',  gettext('iSCSI')  ], [ 'qla2xxx', gettext('FC') ] ],
                        typeAhead:     true,
                        triggerAction: 'all',
                        emptyText:     'Select...',
                        selectOnFocus: true,
                        value: "iscsi"
                      }, {
                        xtype: 'textfield',
                        fieldLabel: gettext('WWN or IQN'),
                        allowBlank: false,
                        name: "wwn"
                      }]
                    }]
                  }
                }
              });
              addwin.show();
            }
          }, {
            text: gettext("Remove Target"),
            handler: function(){
              Ext.getCmp("lio__logicallun_targets_panel_inst").removeSelected();
            }
          }],
          keys: [{
            key: [Ext.EventObject.DELETE],
            handler: function(self){
              Ext.getCmp("lio__logicallun_targets_panel_inst").removeSelected();
            }
          }],
          removeSelected: function(){
            var self = this;
            var sm = self.getSelectionModel();
            var sel;
            if( sm.hasSelection() ){
              sel = sm.getSelected();
              lio__LogicalLUN.set(self.store.llun_id, {"targets__remove": [sel.data]}, function(provider, response){
                self.store.remove(sel);
              });
            }
          },
          listeners: {
            afterrender: function(self){
              var droptarget_el =  self.getView().scroller.dom;
              var droptarget = new Ext.dd.DropTarget(droptarget_el, {
                ddGroup    : 'llun_target',
                notifyDrop : function(ddSource, e, data){
                  var records =  ddSource.dragData.selections;
                  var i;
                  var addrecords = [];
                  for( i = 0; i < records.length; i++ ){
                    if( self.store.findExact("id", records[i].data.id) === -1 ){
                      addrecords.push({
                        'app': 'lio',
                        'obj': 'Target',
                        'id':  records[i].data.id,
                        '__unicode__': records[i].data.__unicode__
                      });
                    }
                  }
                  if(addrecords.length > 0){
                    lio__LogicalLUN.set(self.store.llun_id, {"targets__add": addrecords}, function(provider, response){
                      for( i = 0; i < addrecords.length; i++ ){
                        self.store.add([new Ext.data.Record(addrecords[i])]);
                      }
                    });
                  }
                  return true;
                }
              });
            }
          }
        }, {
          region: "center",
          title: "Host Groups",
          id:    "lio__logicallun_hostgroups_panel_inst",
          xtype: 'grid',
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
          ddGroup: "llun_hostgroup",
          buttons: [{
            text: gettext('Host Groups'),
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
            handler: function(){
              var addwin = new Ext.Window({
                x: Ext.lib.Dom.getViewWidth() - 350,
                y: Ext.lib.Dom.getViewHeight() - 350,
                height: 300,
                width: 300,
                frame: true,
                layout: 'fit',
                title: 'Host Groups',
                items: {
                  xtype: 'grid',
                  ddGroup: "llun_hostgroup",
                  enableDrag: true,
                  viewConfig: { forceFit: true },
                  store: new Ext.data.DirectStore({
                    fields: ["id", "__unicode__"],
                    directFn: ifconfig__HostGroup.ids,
                    autoLoad: true
                  }),
                  colModel: new Ext.grid.ColumnModel({
                    defaults: {
                      sortable: true
                    },
                    columns: [{
                      header: "Name",
                      dataIndex: "__unicode__"
                    }]
                  })
                }
              });
              addwin.show();
            }
          }, {
            text: gettext("Remove Host group"),
            handler: function(){
              Ext.getCmp("lio__logicallun_hostgroups_panel_inst").removeSelected();
            }
          }],
          keys: [{
            key: [Ext.EventObject.DELETE],
            handler: function(self){
              Ext.getCmp("lio__logicallun_hostgroups_panel_inst").removeSelected();
            }
          }],
          removeSelected: function(){
            var self = this;
            var sm = self.getSelectionModel();
            var sel;
            if( sm.hasSelection() ){
              sel = sm.getSelected();
              lio__LogicalLUN.set(self.store.llun_id, {"hostgroups__remove": [sel.data]}, function(provider, response){
                self.store.remove(sel);
              });
            }
          },
          listeners: {
            afterrender: function(self){
              var droptarget_el =  self.getView().scroller.dom;
              var droptarget = new Ext.dd.DropTarget(droptarget_el, {
                ddGroup    : 'llun_hostgroup',
                notifyDrop : function(ddSource, e, data){
                  var records =  ddSource.dragData.selections;
                  var i;
                  var addrecords = [];
                  for( i = 0; i < records.length; i++ ){
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
                    lio__LogicalLUN.set(self.store.llun_id, {"hostgroups__add": addrecords}, function(provider, response){
                      for( i = 0; i < addrecords.length; i++ ){
                        self.store.add([new Ext.data.Record(addrecords[i])]);
                      }
                    });
                  }
                  return true;
                }
              });
            }
          }
        }, {
          region: "east",
          title: "Hosts",
          id:    "lio__logicallun_hosts_panel_inst",
          width: 200,
          split: true,
          xtype: 'grid',
          viewConfig: { forceFit: true },
          store: hoststore,
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: "Host",
              dataIndex: "__unicode__"
            }]
          }),
          enableDragDrop: true,
          ddGroup: "llun_host",
          buttons: [{
            text: gettext('Hosts'),
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
            handler: function(){
              var addwin = new Ext.Window({
                x: Ext.lib.Dom.getViewWidth() - 650,
                y: Ext.lib.Dom.getViewHeight() - 350,
                height: 300,
                width: 300,
                frame: true,
                layout: 'fit',
                title: 'Hosts',
                items: {
                  xtype: 'grid',
                  ddGroup: "llun_host",
                  enableDrag: true,
                  viewConfig: { forceFit: true },
                  store: new Ext.data.DirectStore({
                    fields: ["id", "__unicode__"],
                    directFn: ifconfig__Host.ids,
                    autoLoad: true
                  }),
                  colModel: new Ext.grid.ColumnModel({
                    defaults: {
                      sortable: true
                    },
                    columns: [{
                      header: "Name",
                      dataIndex: "__unicode__"
                    }]
                  })
                }
              });
              addwin.show();
            }
          }, {
            text: gettext("Remove Host"),
            handler: function(){
              Ext.getCmp("lio__logicallun_hosts_panel_inst").removeSelected();
            }
          }],
          keys: [{
            key: [Ext.EventObject.DELETE],
            handler: function(self){
              Ext.getCmp("lio__logicallun_hosts_panel_inst").removeSelected();
            }
          }],
          removeSelected: function(){
            var self = this;
            var sm = self.getSelectionModel();
            var sel;
            if( sm.hasSelection() ){
              sel = sm.getSelected();
              lio__LogicalLUN.set(self.store.llun_id, {"hosts__remove": [sel.data]}, function(provider, response){
                self.store.remove(sel);
              });
            }
          },
          listeners: {
            afterrender: function(self){
              var droptarget_el =  self.getView().scroller.dom;
              var droptarget = new Ext.dd.DropTarget(droptarget_el, {
                ddGroup    : 'llun_host',
                notifyDrop : function(ddSource, e, data){
                  var records =  ddSource.dragData.selections;
                  var i;
                  var addrecords = [];
                  for( i = 0; i < records.length; i++ ){
                    if( self.store.findExact("id", records[i].data.id) === -1 ){
                      addrecords.push({
                        'app': 'ifconfig',
                        'obj': 'Host',
                        'id':  records[i].data.id,
                        '__unicode__': records[i].data.__unicode__
                      });
                    }
                  }
                  if(addrecords.length > 0){
                    lio__LogicalLUN.set(self.store.llun_id, {"hosts__add": addrecords}, function(provider, response){
                      for( i = 0; i < addrecords.length; i++ ){
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
    Ext.oa.Lio__Panel.superclass.initComponent.apply(this, arguments);
  },
  refresh: function(){
    Ext.getCmp("lio__logicallun_panel_inst").refresh();
    Ext.StoreMgr.get("targetstore").removeAll();
    Ext.StoreMgr.get("hostgroupstore").removeAll();
    Ext.StoreMgr.get("hoststore").removeAll();
  }
});

Ext.reg("lio__panel", Ext.oa.Lio__Panel);


Ext.oa.Lio__LogicalLun_Module = Ext.extend(Object, {
  panel: "lio__panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_luns", {
      text: gettext('LUNs'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'lio__panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lio__LogicalLun_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
