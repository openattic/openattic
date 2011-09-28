Ext.namespace("Ext.oa");

Ext.oa.Iscsi__Target_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var iscsiTrgGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "iSCSI Targets",
      buttons: [{
        text: "Add Target",
        icon: "/filer/static/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "Add Target",
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
                fieldLabel: "IQN",
                name: "iscsiname",
                ref: 'addrfield'
              }, {
                fieldLabel: "Allow All",
                xtype: 'checkbox',
                name: "allowall",
                ref: 'allowfield'
              }],
              buttons: [{
                text: 'Create Target',
                icon: "/filer/static/icons/accept.png",
                handler: function(self){
                  iscsi__Target.create({
                    'name':      self.ownerCt.ownerCt.namefield.getValue(),
                    'iscsiname': self.ownerCt.ownerCt.addrfield.getValue(),
                    'allowall':  self.ownerCt.ownerCt.allowfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      iscsiTrgGrid.store.reload();
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
        text: "Delete Target",
        icon: "/filer/static/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = iscsiTrgGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            iscsi__Target.remove( sel.data.id, function(provider, response){
              iscsiTrgGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'iscsiname', 'name'],
        directFn: iscsi__Target.all
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
          header: "IQN",
          width: 400,
          dataIndex: "iscsiname"
        }]
      })
    }));
    Ext.oa.Iscsi__Target_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children[iscsiTreeIndex].children.push({
      text: 'Targets',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/nfs.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Target_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
