{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Iscsi__Lun_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var iscsiLunGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "iscsi__lun_panel_inst",
      title: "{% trans 'iSCSI Luns' %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          iscsiLunGrid.store.reload();
        }
      }, {
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
                xtype:      'volumefield'
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
                      iscsiLunGrid.store.reload();
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
      }, {
        text: "{% trans 'Delete Lun' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = iscsiLunGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            iscsi__Lun.remove( sel.data.id, function(provider, response){
              iscsiLunGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        fields: ['id', 'volume', 'target', 'number', 'alias', 'ltype', {
          name: 'volumename', mapping: 'volume', convert: function(val, row){ return val.name }
        }, {
          name: 'targetname', mapping: 'target', convert: function(val, row){ return val.name }
        }],
        directFn: iscsi__Lun.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Target' %}",
          width: 200,
          dataIndex: "targetname"
        }, {
          header: "{% trans 'LUN' %}",
          width: 50,
          dataIndex: "number"
        }, {
          header: "{% trans 'Alias' %}",
          width: 100,
          dataIndex: "alias"
        }, {
          header: "{% trans 'Type' %}",
          width: 50,
          dataIndex: "ltype"
        }, {
          header: "{% trans 'Volume' %}",
          width: 150,
          dataIndex: "volumename"
        }]
      })
    }));
    Ext.oa.Iscsi__Lun_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Iscsi__Lun_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("iscsi__lun_panel", Ext.oa.Iscsi__Lun_Panel);

Ext.oa.Iscsi__Lun_Module = Ext.extend(Object, {
  panel: "iscsi__lun_panel",
  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children[iscsiTreeIndex].children.push({
      text: "{% trans 'Luns' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: "iscsi__lun_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Lun_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
