{% load i18n %}

Ext.namespace("Ext.oa");

var storeUpdate = function(store, parent_id, field){
  var data = [];
  for (var i = 0; i < store.data.items.length; i++){
    data.push(store.data.items[i].data);
  }
  var args = {};
  args[field] = data;
  iscsi__Target.set( parent_id, args, function(provider, response){
    if( response.typ === 'exception' ){
      alert('Error', 'Initiator delete has failed');
    }
  });
}

var targetStore = new Ext.data.DirectStore({
  fields: ["iscsiname", "name", "id"],
  directFn: iscsi__Target.filter
});

var lunStore = new Ext.data.DirectStore({
  fields: ["ltype", "alias", "number", "id", {
    name: 'origvolid',
    mapping: 'volume',
    convert: function(val, row) {
      if( val === null )
        return null;
      return val.name;
    }
  }],
  directFn: iscsi__Lun.filter
});
var init_all = new Ext.data.DirectStore({
  id: "init_all",
  fields: ["id","name","address"],
  directFn: iscsi__Initiator.all
});
var tgt_all = new Ext.data.DirectStore({
  id: "tgt_all",
  fields: ["app","obj","id","address"],
  directFn: ifconfig__IPAddress.ids
});

Ext.oa.Iscsi__Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var iscsiPanel = this;
    var deleteBindIPs = function(self){
    var bindIP = iscsiPanel.target_grid.getSelectionModel();
    var parent = iscsiPanel.targets.getSelectionModel();
    var parentid = parent.selections.items[0];
      if( bindIP.hasSelection() ){
        var sel = bindIP.getSelected();
        Ext.Msg.confirm(
        "{% trans 'Confirm delete' %}",
        interpolate(
          "{% trans 'Really delete IP %s?' %}",
          [sel.data.address] ),
        function(btn, text){
          if( btn == 'yes' ){
            tgt_allow.remove(sel);
            storeUpdate(tgt_allow, parentid.data.id, "tgt_allow");
            };
        });
      }
    };
    var deleteLun = function(self){
    var sm = iscsiPanel.lun.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        Ext.Msg.confirm(
          "{% trans 'Confirm delete' %}",
          interpolate(
            "{% trans 'Really delete Lun %s?' %}",
            [sel.data.alias] ),
          function(btn, text){
            if( btn == 'yes' ){
              iscsi__Lun.remove( sel.data.id, function(provider, response){
              lunStore.reload();
              } );
            }
          }
        );
      }
    };
    var deleteInitiator = function(self){
    var deny = iscsiPanel.initiator.deny_grid.getSelectionModel();
    var allow = iscsiPanel.initiator.allow_grid.getSelectionModel();
    var parent = iscsiPanel.targets.getSelectionModel();
    var parentid = parent.selections.items[0];
      if( allow.hasSelection() ){
        var selectedItem = allow.getSelected();
        init_allow.remove(selectedItem);
        storeUpdate(init_allow, parentid.data.id, "init_allow");
      }
      if( deny.hasSelection() ){
        var selectedItem = deny.getSelected();
        init_deny.remove(selectedItem);
        storeUpdate(init_deny, parentid.data.id, "init_deny");
      }
    };
    var deleteTarget = function(self){
    var sm = iscsiPanel.targets.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        Ext.Msg.confirm(
          "{% trans 'Confirm delete' %}",
          interpolate(
            "{% trans 'Really delete Target %s?' %}",
            [sel.data.name] ),
          function(btn, text){
            if( btn == 'yes' ){
              iscsi__Target.remove( sel.data.id, function(provider, response){
                targetStore.reload();
                lunStore.removeAll();
                init_allow.removeAll();
                init_deny.removeAll();
                tgt_allow.removeAll();
                }
              );
            }
          }
        );
      }
    };       
    var init_allow = new Ext.data.DirectStore({
      id: "init_allow",
      fields: ["app","obj","id","name", "id"],
      directFn: iscsi__Target.filter,
      listeners: {
        add: function(store){
          var parent = iscsiPanel.targets.getSelectionModel();
          var parentid = parent.selections.items[0];
          storeUpdate(init_allow, parentid.data.id, "init_allow");
        },
        remove: function(store){
          var parent = iscsiPanel.targets.getSelectionModel();
          var parentid = parent.selections.items[0];
          storeUpdate(init_allow, parentid.data.id, "init_allow");
        }
      }
    });
    var init_deny = new Ext.data.DirectStore({
      id: "init_deny",
      fields: ["app","obj","id","name", "id"],
      directFn: iscsi__Target.filter,
      listeners: {
        add: function(store){
          var parent = iscsiPanel.targets.getSelectionModel();
          var parentid = parent.selections.items[0];
          storeUpdate(init_deny, parentid.data.id, "init_deny");
        },
        remove: function(store){
          var parent = iscsiPanel.targets.getSelectionModel();
          var parentid = parent.selections.items[0];
          storeUpdate(init_deny, parentid.data.id, "init_deny");
        }
      }
    });
    var tgt_allow = new Ext.data.JsonStore({
      id: "tgt_allow",
      fields: ["app","obj","id","address"],
      listeners: {
        add: function(store){
          var parent = iscsiPanel.targets.getSelectionModel();
          var parentid = parent.selections.items[0];
          storeUpdate(tgt_allow, parentid.data.id, "tgt_allow");
        },
        remove: function(store){
          var parent = iscsiPanel.targets.getSelectionModel();
          var parentid = parent.selections.items[0];
          storeUpdate(tgt_allow, parentid.data.id, "tgt_allow");
        }
      }
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'iscsi__initiator_panel_inst',
      title: "{% trans 'iSCSI' %}",
      layout: 'hbox',
      layoutConfig: {
        align: "stretch"
      },
      defaults: {
        flex: 1
      },
      border: false,
      autoScroll: true,
      items: [{
        //BEGIN le left column
        border: false,
        layout: "vbox",
        layoutConfig: {
          align: "stretch"
        },
        defaults: {
          flex: 1
        },
        items: [{
          //BEGIN le target
          ref: '../targets',
          border: true,
          xtype: 'grid',
          autoScroll: true,
          title: 'Targets',
          viewConfig: { forceFit: true },
          store: targetStore,
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: "Name",
              dataIndex: "name"
            },{
              header: "iSCSI Name",
              dataIndex: "iscsiname"
            }]
          }),
          listeners: {
            cellclick: function (self, rowIndex, colIndex, evt ){
              var record = self.getStore().getAt(rowIndex);
              lunStore.load({params: {"target__name":record.data.name}});
              init_allow.loadData(record.json.init_allow);
              init_deny.loadData(record.json.init_deny);
              tgt_allow.loadData(record.json.tgt_allow);
            }
          },
          buttons:[{  
            text: "",
            icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
            tooltip: "{% trans 'Reload' %}",
            handler: function(self){
              targetStore.reload();
            }
          },{
            text: "{% trans 'Create Target'%}",
            icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
            handler: function(){
              var fqdn = "";
              __main__.fqdn(function(provider, response){
                fqdn = response.result.split(".").join(".");
              });
              var addwin = new Ext.Window({
                title: "{% trans 'Add Target' %}",
                layout: "fit",
                height: 140,
                width: 500,
                items: [{
                  xtype: "form",
                  autoScroll: true,
                  defaults: {
                    xtype: "textfield",
                    allowBlank: false,
                    anchor: "-20px"
                  },
                  bodyStyle: 'padding:5px 5px;',
                  items: [{
                    fieldLabel: "{% trans 'Name' %}",
                    ref: "namefield",
                    listeners: {
                      change: function( self, newValue, oldValue ){
                        var d = new Date();
                        var m = d.getMonth() + 1;
                        self.ownerCt.iqn_ip_field.setValue(
                          String.format("iqn.{0}-{1}.{2}:{3}",
                            d.getFullYear(), (m < 10 ? "0" + m : m),
                            fqdn, self.getValue()
                          )
                        );
                      }
                    }
                  },{
                    fieldLabel: "{% trans 'IP/IQN' %}",
                    ref: "iqn_ip_field"
                  }],
                  buttons: [{
                    text: "{% trans 'Create' %}",
                    icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                    handler: function(self){
                       if( !self.ownerCt.ownerCt.getForm().isValid() ){
                          return;
                       }
                        iscsi__Target.create({
                          'name': self.ownerCt.ownerCt.namefield.getValue(),
                          'iscsiname': self.ownerCt.ownerCt.iqn_ip_field.getValue()
                        }, function(provider, response){
                          if( response.result ) {
                            targetStore.reload();
                            addwin.hide();
                          }
                        })
                    }
                  }, {
                     text: "{% trans 'Cancel' %}",
                     icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                     handler: function(self){
                       addwin.hide();
                     }
                     }]
                }]
              });
              addwin.show();
            }
          },{
            text: "{% trans 'Delete Target'%}",
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: deleteTarget
          }],
          keys: [{ key: [Ext.EventObject.DELETE], handler: deleteTarget}],
          //END le target
        },{
          //BEGIN le initiator
          ref: '../initiator',
          border: true,
          title: "Initiator",
          defaults:{
            flex: 1,
            border: false
          },
          layout: "hbox",
          layoutConfig: {
            align: "stretch"
          },
          items: [{
            xtype: 'grid',
            autoScroll: true,
            ref: 'allow_grid',
            enableDragDrop: true,
            ddGroup: 'initiator',
            listeners: {
              cellclick: function (self, rowIndex, colIndex, evt ){
                iscsiPanel.initiator.deny_grid.getSelectionModel().clearSelections();
              },
              afterrender: function (self){
                var firstGridDropTargetEl =  self.getView().scroller.dom;
                var firstGridDropTarget = new Ext.dd.DropTarget(firstGridDropTargetEl, {
                  ddGroup    : 'initiator',
                  notifyDrop : function(ddSource, e, data){
                    var records =  ddSource.dragData.selections;
                    if( self.store.findExact("id",records[0].data.id) === -1 )
                    {
                      if( ddSource.grid.store.storeId === init_deny.storeId )
                        Ext.each(records, ddSource.grid.store.remove, ddSource.grid.store);
                      for( var i = 0; i < records.length; i++ ){
                        Ext.applyIf( records[i].data, {
                          app: "iscsi",
                          obj: "Initiator"
                        });
                      }
                      self.store.add(records);
                      return true
                    }
                  }
                });
              }
            },
            viewConfig: { forceFit: true },
            store: init_allow,
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [{
                header: "Allow",
                dataIndex: "name"
              }]
            })
          },{
            xtype: 'grid',
            ref: 'deny_grid',
            enableDragDrop: true,
            ddGroup: 'initiator',
            store: init_deny,
            listeners: {
              cellclick: function (self, rowIndex, colIndex, evt ){
                iscsiPanel.initiator.allow_grid.getSelectionModel().clearSelections();
              },
              afterrender: function (self){
                var firstGridDropTargetEl =  self.getView().scroller.dom;
                var firstGridDropTarget = new Ext.dd.DropTarget(firstGridDropTargetEl, {
                  ddGroup    : 'initiator',
                  notifyDrop : function(ddSource, e, data){
                    var records =  ddSource.dragData.selections;
                    if( self.store.findExact("id",records[0].data.id) === -1 ){
                      if( ddSource.grid.store.storeId === init_allow.storeId )
                        Ext.each(records, ddSource.grid.store.remove, ddSource.grid.store);
                      for( var i = 0; i < records.length; i++ ){
                        Ext.applyIf( records[i].data, {
                          app: "iscsi",
                          obj: "Initiator"
                        });
                      }
                      self.store.add(records);
                      return true
                    }
                  }
                });
              }
            },
            viewConfig: { forceFit: true },
            width: 298,
            height: 290,
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [{
                header: "Deny",
                dataIndex: "name"
              }]
            })
          }],
          buttons:[{
            text: "{% trans 'Manage Initiators' %}",
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
            handler: function(){
              var addwin = new Ext.Window({
                height: 350,
                width: 600,
                frame: true,
                title: 'Overview',
                layout: 'border',
                items: [{
                  region: "center",
                  xtype: 'grid',
                  autoScroll: true,
                  ref: 'initiator_all',
                  ddGroup: "initiator",
                  enableDrag: true,
                  title: 'Initiator',
                  viewConfig: { forceFit: true },
                  store: init_all,
                  colModel: (function(){
                    var cm = new Ext.grid.ColumnModel({
                      defaults: {
                        sortable: true
                      },
                      columns: [{
                        header: "Name",
                        dataIndex: "name"
                      },{
                        header: "IQN",
                        dataIndex: "address"
                      }]
                    });
                    return cm;
                  }()),
                  listeners: {
                    cellclick: function (self, rowIndex, colIndex, evt ){
                    var record = self.getStore().getAt(rowIndex);
                      self.ownerCt.items.items[1].getForm().loadRecord(record);
                    }
                  }
                },{
                  region: "east",
                  width: 250,
                  xtype: 'form',
                  defaultType: 'textfield',
                  bodyStyle: 'padding:5px 5px;',
                  style: {
                    "margin-left": "5px",
                    "margin-right": "0"
                  },
                  title:'Details',
                  autoHeight: true,
                  autoScroll: true,
                  border: true,
                  items: [{
                    fieldLabel: 'Name',
                    anchor: '-20px',
                    ref: 'namefield',
                    allowBlank: false,
                    name: 'name'
                  },{
                    fieldLabel: 'IQN/IP',
                    autoScroll: true,
                    anchor: '-20px',
                    ref: 'addressfield',
                    allowBlank: false,
                    name: 'address'
                  }]
                }],
                buttons: [{
                  text: "{% trans 'Add' %}",
                  icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
                  handler: function(self){
                      if( !self.ownerCt.ownerCt.items.items[1].getForm().isValid() ){
                        return;
                      }
                      iscsi__Initiator.create({
                        'name':    self.ownerCt.ownerCt.items.items[1].namefield.getValue(),
                        'address': self.ownerCt.ownerCt.items.items[1].addressfield.getValue()
                      }, function(provider, response){
                        if( response.result ){
                          init_all.reload();
                        }
                      });
                  }
                },{
                  text: "{% trans 'Save' %}",
                  icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
                  handler: function(self){
                    var sm = addwin.initiator_all.getSelectionModel();
                    if (sm.selections.items.length === 0){
                      Ext.Msg.alert ("Warning","Please select an Initiator you want to edit");
                      return;
                    }
                    if( !self.ownerCt.ownerCt.items.items[1].getForm().isValid() ){
                      return;
                    }
                      var sel = sm.selections.items[0];
                      iscsi__Initiator.set(sel.data.id, {
                        'name':    self.ownerCt.ownerCt.items.items[1].namefield.getValue(),
                        'address': self.ownerCt.ownerCt.items.items[1].addressfield.getValue()
                      }, function(provider, response){
                        if( response.result ){
                          init_all.reload();
                        }
                      });
                  }
                },{
                  text: "{% trans 'Delete' %}",
                  icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
                  handler: function(self){
                    var sm = addwin.initiator_all.getSelectionModel();
                    if( sm.hasSelection() ){
                      var sel = sm.selections.items[0];
                      Ext.Msg.confirm(
                        "{% trans 'Confirm delete' %}",
                        interpolate(
                          "{% trans 'Really delete Initiator %s?' %}",
                          [sel.data.name] ),
                        function(btn, text){
                          if( btn == 'yes' ){
                            iscsi__Initiator.remove( sel.data.id, function(provider, response){
                              init_all.reload();
                              } );
                          }
                        }
                      );
                    }
                  }
                }, {
                   text: "{% trans 'Cancel' %}",
                   icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                   handler: function(self){
                     addwin.hide();
                   }
                }]
              });
              addwin.show();
            }
        },{
            text: "{% trans 'Delete Initiator'%}",
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: deleteInitiator
        }],
        keys: [{ key: [Ext.EventObject.DELETE], handler: deleteInitiator}],
          //END le initiator
        }]
        //END le left column
      }, {
        //BEGIN le right column
        border: false,
        defaults: {
          flex: 1,
          border: true
        },
        layout: "vbox",
        layoutConfig: {
          align: "stretch"
        },
        items: [{
          //BEGIN le lun
          ref: '../lun',
          xtype: 'grid',
          autoScroll: true,
          viewConfig: { forceFit: true },
          title: 'LUNs',
          store: lunStore,
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: "ID",
              dataIndex: "number"
            },{
              header: "Alias",
              dataIndex: "alias"
            },{
              header: "LType",
              dataIndex: "ltype"
            },{
              header: "Volume",
              dataIndex: "origvolid"
            }]
          }),
          buttons:[{
            text: "{% trans 'Add Lun' %}",
            icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
            handler: function(){
              var sel = iscsiPanel.targets.getSelectionModel();
              if (sel.selections.items.length === 0){
                Ext.Msg.alert("Warning","Please select a Target first");
                return;
              }
              var addwin = new Ext.Window({
                title: "{% trans 'Add Lun' %}",
                layout: "fit",
                height: 200,
                width: 500,
                items: [{
                  xtype: "form",
                  autoScroll: true,
                  defaults: {
                    xtype: "textfield",
                    anchor: '-20px'
                  },
                  bodyStyle: 'padding:5px 5px;',
                  items: [{
                    xtype:      'volumefield',
                    allowBlank: false,
                    filesystem__isnull: true,
                    listeners: {
                      select: function(self, record){
                          self.ownerCt.aliasfield.setValue( record.data.name );
                          self.ownerCt.aliasfield.enable();
                      }
                     }
                  }, {
                    fieldLabel: "{% trans 'Number' %}",
                    name: "number",
                    xtype: 'numberfield',
                    allowBlank: false,
                    decimalPrecision : 0,
                    value: -1,
                    ref: 'numberfield'
                  },{
                    fieldLabel: "{% trans 'Type' %}",
                    name: "ltype",
                    ref: 'typefield',
                    hiddenName: 'l_type',
                    xtype:      'combo',
                    store: [ [ 'fileio',  "{% trans 'Buffered (File IO)' %}"  ], [ 'blockio', "{% trans 'Unbuffered (Block IO)' %}" ] ],
                    typeAhead:     true,
                    triggerAction: 'all',
                    emptyText:     'Select...',
                    selectOnFocus: true,
                    value: "fileio"
                  }, {
                    fieldLabel: "{% trans 'Alias' %}",
                    name: "alias",
                    ref: 'aliasfield'
                  } ],
                  buttons: [{
                    text: "{% trans 'Create Lun' %}",
                    icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                    handler: function(self){
                      if( !self.ownerCt.ownerCt.getForm().isValid() ){
                        return;
                      }
                      var sel = iscsiPanel.targets.getSelectionModel();
                      var number = lunStore.find("number",self.ownerCt.ownerCt.numberfield.getValue());
                      if(number != -1 || (self.ownerCt.ownerCt.numberfield.getValue() < 0 && self.ownerCt.ownerCt.numberfield.getValue() != -1)){
                        Ext.Msg.alert("Warning","This LUN Number allready exists or is invalid. Please choose an other one");
                        return;
                      }
                        iscsi__Lun.create({
                          'ltype':     self.ownerCt.ownerCt.typefield.getValue() ,
                          'number':    self.ownerCt.ownerCt.numberfield.getValue(),
                          'alias':     self.ownerCt.ownerCt.aliasfield.getValue(),
                          'volume':    {
                            'app': 'lvm',
                            'obj': 'LogicalVolume',
                            'id': self.ownerCt.ownerCt.volfield.getValue()
                          },
                          'target':    {
                            'app': 'iscsi',
                            'obj': 'Target',
                            'id': sel.selections.items[0].data.id
                          }
                        }, function(provider, response){
                          if( response.result ){
                            lunStore.reload();
                            addwin.hide();
                          }
                        })
                      }
                    }, {
                    text: "{% trans 'Cancel' %}",
                    icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                    handler: function(self){
                      addwin.hide();
                    }
                  }]
                }]
              });
              addwin.show();
            }
          },{
            text: "{% trans 'Delete Lun' %}",
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: deleteLun
          }],
          keys: [{ key: [Ext.EventObject.DELETE], handler: deleteLun}],
          //END le lun
        },{
          //BEGIN le bind IPs
          id: 'west',
          ddGroup: 'target',
          ref: '../target_grid',
          enableDragDrop: true,
          xtype: 'grid',
          viewConfig: { forceFit: true },
          title: 'Bind IPs',
          store: tgt_allow,
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: "Allow",
              dataIndex: "address"
            }]
          }),
          buttons:[{
              text: "{% trans 'Bind IPs' %}",
              icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
              layout: 'aboslute',
              handler: function(){
                var iscsiSize = iscsiPanel.getSize();
                var addwin = new Ext.Window({
                  x: iscsiSize.width / 4 * 3,
                  y: iscsiSize.height / 5 * 3,
                  height: 300,
                  width: 200,
                  frame: true,
                  layout: 'fit',
                  title: 'IPs',
                  items: {
                    xtype: 'grid',
                    ref: 'targets_all',
                    ddGroup: "target",
                    enableDrag: true,
                    height: 400,
                    viewConfig: { forceFit: true },
                    store: tgt_all,
                    colModel: new Ext.grid.ColumnModel({
                      defaults: {
                        sortable: true
                      },
                      columns: [{
                        header: "Address",
                        dataIndex: "address"
                      }]
                    })
                  }
                });
                addwin.show();
              }
            },{
              text: "{% trans 'Delete Bind IPs'%}",
              icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
              handler: deleteBindIPs
            }],
          keys: [{ key: [Ext.EventObject.DELETE], handler: deleteBindIPs}],
          listeners: {
            afterrender: function (self){
              var firstGridDropTargetEl =  self.getView().scroller.dom;
              var firstGridDropTarget = new Ext.dd.DropTarget(firstGridDropTargetEl, {
                ddGroup    : 'target',
                notifyDrop : function(ddSource, e, data){
                  var records =  ddSource.dragData.selections;
                  if( self.store.findExact("id",records[0].data.id) === -1 ){
                    self.store.add(records);
                    return true
                  }
                }
              });
            }
          }
          //END le bind IPs
        }]
        //END le right column
      }]
    }));
    Ext.oa.Iscsi__Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Iscsi__Panel.superclass.onRender.apply(this, arguments);
    targetStore.reload();
    init_all.load();
    tgt_all.load();
  }
});

Ext.reg("iscsi__panel", Ext.oa.Iscsi__Panel);

Ext.oa.Iscsi__Module = Ext.extend(Object, {
  panel: "iscsi__panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_luns", {
      text: "{% trans 'iSCSI' %}",
      leaf: true,
      panel: 'iscsi__initiator_panel_inst',
      icon: MEDIA_URL + "/oxygen/22x22/places/repository.png",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
