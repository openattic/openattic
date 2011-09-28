Ext.namespace("Ext.oa");

Ext.oa.Iscsi__Initiator_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var iscsiInitGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "iSCSI Initiators",
      buttons: [{
        text: "Add Initiator",
        icon: "/filer/static/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "Add Initiator",
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
                fieldLabel: "Name",
                name: "name",
                ref: 'namefield'
              }, {
                fieldLabel: "Address (IQN/IP)",
                name: "address",
                ref: 'addrfield'
              }],
              buttons: [{
                text: 'Create Initiator',
                icon: "/filer/static/icons/accept.png",
                handler: function(self){
                  iscsi__Initiator.create({
                    'name':    self.ownerCt.ownerCt.namefield.getValue(),
                    'address': self.ownerCt.ownerCt.addrfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      iscsiInitGrid.store.reload();
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
        text: "Delete Initiator",
        icon: "/filer/static/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = iscsiInitGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            iscsi__Initiator.remove( sel.data.id, function(provider, response){
              iscsiInitGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'address', 'name'],
        directFn: iscsi__Initiator.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "Name",
          width: 200,
          dataIndex: "name"
        }, {
          header: "Address",
          width: 100,
          dataIndex: "address"
        }]
      })
    }));
    Ext.oa.Iscsi__Initiator_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    iscsiTreeIndex = tree.root.attributes.children[2].children.length;
    tree.root.attributes.children[2].children.push({
      text: 'LAN (iSCSI)',
      panel: this,
      href: '#',
      children: [{
        text: 'Initiators',
        leaf: true,
        icon: '/filer/static/icons2/22x22/apps/nfs.png',
        panel: this,
        href: '#'
      }]
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Initiator_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
