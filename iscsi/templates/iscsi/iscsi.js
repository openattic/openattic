{% load i18n %}

Ext.namespace("Ext.oa");

var targetStore = new Ext.data.DirectStore({
         fields: ["iscsiname", "name", "id"],
         directFn: iscsi__Target.filter
       });
var lunStore = new Ext.data.DirectStore({
         fields: ["ltype", "alias", "number", "id",
         {
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
         fields: ["id","name","address"],
         directFn: iscsi__Initiator.all
       });
var init_allow = new Ext.data.DirectStore({
         fields: ["app","obj","id","name", "id"],
         directFn: iscsi__Target.filter
       });
var init_deny = new Ext.data.DirectStore({
         fields: ["app","obj","id","name", "id"],
         directFn: iscsi__Target.filter
       });
var tgt_allow = new Ext.data.DirectStore({
         fields: ["app","obj","id","name", "id"],
         directFn: iscsi__Target.filter
       });


Ext.oa.Iscsi__Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var iscsiPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'iscsi__initiator_panel_inst',
      title: "{% trans 'Iscsi' %}",
      layout: 'table',
      layoutConfig:{columns: 3},
      defaults:{
        border: false,
        height: 300,
        width: 600
      },
      buttons: [{
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}"
        },{
          text: "{% trans 'Create Target'%}",
          icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
          handler: function(){
            var addwin = new Ext.Window({
              title: "{% trans 'Add Target' %}",
              layout: "fit",
              height: 300,
              width: 500,
              items: [{
                xtype: "form",
                defaults: {
                  xtype: "textfield",
                  anchor: "-20px"
                },
                items: [{
                  fieldLabel: "{% trans 'Name' %}",
                  ref: "namefield"
                },{
                  fieldLabel: "{% trans 'IP/IQN' %}",
                  ref: "iqn_ip_field"
                }
              ],
              buttons: [{
                text: "{% trans 'Create' %}",
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  iscsi__Target.create({
                    'name': self.ownerCt.ownerCt.namefield.getValue(),
                    'iscsiname': self.ownerCt.ownerCt.iqn_ip_field.getValue(),
                    'allowall': false
                }, function(provider, response){
                  if( response.result ) {
                    targetStore.reload();
                    addwin.hide();
                  }
                })
               } 
              }]
              }]
              });
            addwin.show();
        }
        },{
        text: "{% trans 'Add Lun' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add Lun' %}",
            layout: "fit",
            height: 300,
            width: 500,
            items: [{
              xtype: "form",
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [{
                xtype:      'volumefield',
                filesystem__isnull: true
              }, {
                fieldLabel: "{% trans 'Number' %}",
                name: "number",
                xtype: 'numberfield',
                value: -1,
                ref: 'numberfield'
              }, {
                xtype:      'combo',
                fieldLabel: "{% trans 'Target' %}",
                name:       'target',
                hiddenName: 'target_id',
                store: new Ext.data.DirectStore({
                  fields: ["id", "name"],
                  baseParams: { fields: ["id", "name"] },
                  directFn: iscsi__Target.all_values
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     "{% trans 'Select...' %}",
                selectOnFocus: true,
                displayField:  'name',
                valueField:    'id',
                ref: 'targetfield'
              }, {
                fieldLabel: "{% trans 'Type' %}",
                name: "ltype",
                ref: 'typefield',
                hiddenName: 'l_type',
                xtype:      'combo',
                store: [ [ 'fileio',  'File IO'  ], [ 'blockio', 'Block IO' ] ],
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
                  iscsi__Lun.create({
                    'ltype':     self.ownerCt.ownerCt.typefield.getValue(),
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
                      'id': self.ownerCt.ownerCt.targetfield.getValue()
                    }
                  }, function(provider, response){
                    if( response.result ){
                      lunStore.reload();
                      addwin.hide();
                    }
                  });
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
        text: "{% trans 'Manage Initiator' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
        handler: function(){
          var addwin = new Ext.Window({
            height: 500,
            width: 750,
            frame: true,
            title: 'Overview',
            layout: 'column',
            bodyStyle:'padding:5px',
            items: [{
              columnWidth: 0.55,
              xtype: 'grid',
              ref: 'initiator_all',
              title: 'Initiator',
              height: 400,
              viewConfig: { forceFit: true },
              store: init_all,
              colModel: new Ext.grid.ColumnModel({
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
              }),
              listeners: {
                cellclick: function (self, rowIndex, colIndex, evt ){
                var record = self.getStore().getAt(rowIndex);
                  self.ownerCt.items.items[1].getForm().loadRecord(record);
                }
              }
            },{
                columnWidth: 0.45,
                xtype: 'form',
                defaultType: 'textfield',
                bodyStyle: 'padding:5px 5px;',
                style: {
                  "margin-left": "5px", 
                  "margin-right": "0"  
                },
                title:'Details',
                autoScroll: true,
                autoHeight: true,
                border: true,
                items: [{
                  fieldLabel: 'Name',
                  anchor: '100%',
                  ref: 'namefield',
                  name: 'name'
                },{
                  fieldLabel: 'IQN/IP',
                  anchor: '100%',
                  ref: 'addressfield',
                  name: 'address'
                }],
                buttons: [{
                text: "{% trans 'Save Edit' %}",
                icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
                handler: function(self){
                  var sm = addwin.initiator_all.getSelectionModel();
                  var sel = sm.selections.items[0];
                      iscsi__Initiator.set(sel.data.id,{
                        'name':    self.ownerCt.ownerCt.namefield.getValue(),
                        'address': self.ownerCt.ownerCt.addressfield.getValue()
                      }, function(provider, response){
                        if( response.result ){
                          init_all.reload();
                        }
                      });
                    }
                }]
            }],
                buttons: [{
                  text: "{% trans 'Add' %}",
                  icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
                  handler: function(){
                    var addwin = new Ext.Window({
                      title: "{% trans 'Add Initiator' %}",
                      layout: "fit",
                      height: 150,
                      width: 350,
                      items: [{
                        xtype: "form",
                        defaults: {
                          xtype: "textfield",
                          anchor: '-20px'
                        },
                        items: [{
                          style: {
                            "margin-top": "2px"  
                          },
                          fieldLabel: "{% trans 'Name' %}",
                          name: "name",
                          ref: 'namefield'
                        }, {
                          style: {
                            "margin-top": "2px"  
                          },
                          fieldLabel: "{% trans 'Address (IQN/IP)' %}",                   
                          name: "address",
                          ref: 'addrfield'
                        }],
                        buttons: [{
                          text: "{% trans 'Create Initiator' %}",
                          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                          handler: function(self){
                            iscsi__Initiator.create({
                              'name':    self.ownerCt.ownerCt.namefield.getValue(),
                              'address': self.ownerCt.ownerCt.addrfield.getValue()
                            }, function(provider, response){
                              if( response.result ){
                                init_all.reload();
                                addwin.hide();
                              }
                            });
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
                text: "{% trans 'Delete' %}",
                icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
                handler: function(self){
                  var sm = addwin.initiator_all.getSelectionModel();
                  if( sm.hasSelection() ){
                    var sel = sm.selections.items[0];
                    iscsi__Initiator.remove( sel.data.id, function(provider, response){
                      init_all.reload();
                    } );
                  }
                }
              }           
              ]
          });
          addwin.show();
        }
      },{
          text: "{% trans 'Delete Initiator'%}",
          icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
          handler: function(self){
           var deny = iscsiPanel.initiator.init_panel.deny_grid.getSelectionModel();
           var allow = iscsiPanel.initiator.init_panel.allow_grid.getSelectionModel();
           var parent = iscsiPanel.targets.getSelectionModel();
           var parentid = parent.selections.items[0];
           if( allow.hasSelection() ){
             var selectedItem = allow.getSelected();
             init_allow.remove(selectedItem);
             var data = [];
             for (var i = 0; i < init_allow.data.items.length; i++){
               data.push(
                 init_allow.data.items[i].data
               );
             }
             iscsi__Target.set( parentid.data.id,{
               "init_allow":data
            },function(provider, response){
              if( response.typ === 'exception' ){
               alert('Error', 'Initiator delete has failed');
              }
             });
           }
           if( deny.hasSelection() ){
             var selectedItem = deny.getSelected();
             init_deny.remove(selectedItem);
             var data = [];
             for (var i = 0; i < init_deny.data.items.length; i++){
               data.push(
                 init_deny.data.items[i].data
               );
             }
             iscsi__Target.set( parentid.data.id,{
               "init_deny":data
             },function(provider, response){
               if( response.typ === 'exception' ){
                alert('Error', 'Initiator delete has failed');
                }
             });
           }
          }
      },{
        text: "{% trans 'Delete Lun' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = iscsiPanel.lun.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            iscsi__Lun.remove( sel.data.id, function(provider, response){
              lunStore.reload();
            } );
          }
        }
      },{
          text: "{% trans 'Delete Target'%}",
          icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
          handler: function(self){
           var sm = iscsiPanel.targets.getSelectionModel();
           if( sm.hasSelection() ){
             var sel = sm.selections.items[0];
             iscsi__Target.remove( sel.data.id, function(provider, response){
               targetStore.reload();
             });
           }
          }
        }
      ],
      items: [{
       ref: 'targets',
       colspan: 2,
       border: true,
       xtype: 'grid',
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
           header: "Iscsi Name",
           dataIndex: "iscsiname"
        }]
       }),
       listeners: {
        cellclick: function (self, rowIndex, colIndex, evt ){
          var record = self.getStore().getAt(rowIndex);
          lunStore.load({params: {"target__name":record.data.name}});
          init_allow.loadData(record.json.init_allow),
          init_deny.loadData(record.json.init_deny)
          tgt_allow.loadData(record.json.tgt_allow)
        }
       }
      },{
        ref: 'lun',
        border: true,
        xtype: 'grid',
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
          }
            
          ]
        })
      },{
        ref: 'initiator',
        border: true,
        colspan: 2,
        items: [{
          layout: 'column',
          xtype: 'panel',
          ref: 'init_panel',
          title: 'Initiator',
          defaults:{border: false},
          items: [{
            xtype: 'grid',
            ref: 'allow_grid',
            listeners: {
            cellclick: function (self, rowIndex, colIndex, evt ){
              iscsiPanel.initiator.init_panel.deny_grid.getSelectionModel().clearSelections();
              }
            }, 
            viewConfig: { forceFit: true },
            width: 240,
            height: 290,
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
          store: init_deny,
          listeners: {
          cellclick: function (self, rowIndex, colIndex, evt ){
              iscsiPanel.initiator.init_panel.allow_grid.getSelectionModel().clearSelections();
              }
           }, 
          viewConfig: { forceFit: true },
          width: 240,
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
      }]  
     }]
      },{
        id: 'west',
        border: true,
        xtype: 'grid',
        viewConfig: { forceFit: true },
        title: 'Targets Allow',
        store: tgt_allow,
        colModel: new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: "Allow",
            dataIndex: "name"
          }]
        })
      }]
    }));
    Ext.oa.Iscsi__Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Iscsi__Panel.superclass.onRender.apply(this, arguments);
    targetStore.reload();
    init_all.load();
  }
});

Ext.reg("iscsi__panel", Ext.oa.Iscsi__Panel);

Ext.oa.Iscsi__Module = Ext.extend(Object, {
  panel: "iscsi__panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_luns", {
      text: "{% trans 'Iscsi' %}",
      leaf: true,
      panel: 'iscsi__initiator_panel_inst',
      icon: MEDIA_URL + "/oxygen/22x22/places/repository.png",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
