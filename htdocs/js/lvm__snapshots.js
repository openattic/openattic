Ext.namespace("Ext.oa");

Ext.oa.Lvm__Snapshot_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var httpGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Volume Snapshots",
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
                          alert( "This volume does not have a file system, so it cannot be used for HTTP." );
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
              }],
              buttons: [{
                text: 'Create Export',
                icon: "/filer/static/icons/accept.png",
                handler: function(self){
                  http__Export.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':  self.ownerCt.ownerCt.dirfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      httpGrid.store.reload();
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
          var sm = httpGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            http__Export.remove( sel.data.id, function(provider, response){
              httpGrid.store.reload();
            } );
          }
        }
      }],
      store: (function(){
        // Anon function that is called immediately to set up the store's DefaultSort
        var store = new Ext.data.DirectStore({
          autoLoad: true,
          fields: ['name', 'megs', 'filesystem',  'snapshot', 'formatted', 'id', 'state', 'fs',
            {
              name: 'origvolid',
              mapping: 'snapshot',
              convert: function( val, row ){
                if( val === null )
                  return null;
                return val.id;
              }
            }, {
              name: 'origvolname',
              mapping: 'snapshot',
              convert: function( val, row ){
                if( val === null )
                  return null;
                return val.name;
              }
            }],
          baseParams: { 'snapshot__isnull': false },
          directFn: lvm__LogicalVolume.filter
        });
        store.setDefaultSort("name");
        return store;
      }()),
      colModel:  new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "LV",
          width: 200,
          dataIndex: "name"
        }, {
          header: "Size",
          width: 150,
          dataIndex: "megs",
          align: 'right',
          renderer: function( val, x, store ){
            if( val >= 1000 )
              return String.format("{0} GB", (val / 1000).toFixed(2));
            return String.format("{0} MB", val);
          }
        }, {
          header: "Original Volume",
          width: 200,
          dataIndex: "origvolname"
        }]
      })
    }));
    Ext.oa.Lvm__Snapshot_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[1].children.push({
      text: 'Snapshots',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/snapshot.png',
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
