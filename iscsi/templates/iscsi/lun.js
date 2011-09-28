Ext.namespace("Ext.oa");

Ext.oa.Iscsi__Lun_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var iscsiLunGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "iSCSI Luns",
      buttons: [{
        text: "Add Lun",
        icon: "/filer/static/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "Add Lun",
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
                xtype:      'combo',
                fieldLabel: 'Volume',
                name:       'volume',
                hiddenName: 'volume_id',
                store: new Ext.data.DirectStore({
                  fields: ["app", "obj", "id", "name"],
                  directFn: lvm__LogicalVolume.ids
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                displayField:  'name',
                valueField:    'id',
                ref: 'volfield'
              }, {
                fieldLabel: "Number",
                name: "number",
                xtype: 'numberfield',
                value: -1,
                ref: 'numberfield'
              }, {
                xtype:      'combo',
                fieldLabel: 'Target',
                name:       'target',
                hiddenName: 'target_id',
                store: new Ext.data.DirectStore({
                  fields: ["id", "name"],
                  baseParams: { fields: ["id", "name"] },
                  directFn: iscsi__Target.all_values
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                displayField:  'name',
                valueField:    'id',
                ref: 'targetfield'
              }, {
                fieldLabel: "Type",
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
                fieldLabel: "Alias",
                name: "alias",
                ref: 'aliasfield'
              } ],
              buttons: [{
                text: 'Create Lun',
                icon: "/filer/static/icons/accept.png",
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
                text: 'Cancel',
                icon: "/filer/static/icons2/16x16/actions/gtk-cancel.png",
                handler: function(self){
                  addwin.hide();
                }
              }]
            }]
          });
          addwin.show();
        }
      }, {
        text: "Delete Lun",
        icon: "/filer/static/icons2/16x16/actions/remove.png",
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
        autoLoad: true,
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
          header: "Target",
          width: 200,
          dataIndex: "targetname"
        }, {
          header: "LUN",
          width: 50,
          dataIndex: "number"
        }, {
          header: "Alias",
          width: 100,
          dataIndex: "alias"
        }, {
          header: "Type",
          width: 50,
          dataIndex: "ltype"
        }, {
          header: "Volume",
          width: 150,
          dataIndex: "volumename"
        }]
      })
    }));
    Ext.oa.Iscsi__Lun_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children[iscsiTreeIndex].children.push({
      text: 'Luns',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/nfs.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Lun_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
