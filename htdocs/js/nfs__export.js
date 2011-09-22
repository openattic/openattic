Ext.namespace("Ext.oa");

Ext.oa.Nfs__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var currentChartId = null;
    var nfsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "NFS",
      buttons: [{
        text: "Add Export",
        icon: "/filer/static/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "Add Export",
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
                  ref: 'volfield',
                  listeners: {
                    select: function(self, record, index){
                      lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                        if( !response.result.filesystem ){
                          alert( "This volume does not have a file system, so it cannot be used for NFS." );
                          self.ownerCt.dirfield.setValue("");
                          self.ownerCt.dirfield.disable();
                          self.expand();
                        }
                        else{
                          self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                          self.ownerCt.dirfield.enable();
                        }
                      } );
                    }
                  }
                }, {
                  fieldLabel: "Directory",
                  name: "path",
                  disabled: true,
                  ref: 'dirfield'
                }, {
                  fieldLabel: "Address",
                  name: "address",
                  ref: 'addrfield'
                }, {
                  fieldLabel: "Options",
                  name: "options",
                  ref: 'optfield'
              }],
              buttons: [{
                text: 'Create Export',
                icon: "/filer/static/icons/accept.png",
                handler: function(self){
                  nfs__Export.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':    self.ownerCt.ownerCt.dirfield.getValue(),
                    'options': self.ownerCt.ownerCt.optfield.getValue(),
                    'address': self.ownerCt.ownerCt.addrfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      nfsGrid.store.reload();
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
        text: "Delete Export",
        icon: "/filer/static/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = nfsGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            nfs__Export.remove( sel.data.id, function(provider, response){
              nfsGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'address', 'path', 'options', 'state'],
        directFn: nfs__Export.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "address",
          width: 100,
          dataIndex: "address"
        }, {
          header: "path",
          width: 200,
          dataIndex: "path"
        }, {
          header: "options",
          width: 200,
          dataIndex: "options"
        }, {
          header: "state",
          width: 50,
          dataIndex: "state"
        }]
      })
    }));
    Ext.oa.Nfs__Export_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: 'Linux (NFS)',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/nfs.png',
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
