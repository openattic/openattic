Ext.namespace("Ext.oa");

Ext.oa.Lvm__Snapshot_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var lvmSnapPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Volume Snapshots",
      buttons: [{
        text: "",
        icon: "/filer/static/icons2/16x16/actions/reload.png",
        tooltip: 'Reload',
        handler: function(self){
          lvmSnapPanel.store.reload();
        }
      }, {
        text: "Add Snapshot",
        icon: "/filer/static/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "Add Snapshot",
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
                  allowBlank: false,
                  ref: 'namefield'
                }, {
                  xtype:      'combo',
                  allowBlank: false,
                  fieldLabel: 'Original Volume',
                  name:       'volume',
                  hiddenName: 'volume_id',
                  store: new Ext.data.DirectStore({
                    fields: ["id", "name", "megs", "vg"],
                    baseParams: { kwds: { "snapshot__isnull": true }, fields: ["name", "megs", "vg"] },
                    paramOrder: ["kwds", "fields"],
                    directFn: lvm__LogicalVolume.filter_values
                  }),
                  typeAhead:     true,
                  triggerAction: 'all',
                  emptyText:     'Select...',
                  selectOnFocus: true,
                  displayField:  'name',
                  valueField:    'id',
                  ref:      'volfield',
                  listeners: {
                    select: function(self, record, index){
                      if( self.ownerCt.volume_id === null || typeof self.ownerCt.volume_id == "undefined" ||
                        self.ownerCt.volume_id != record.data.vg
                       ){
                        self.ownerCt.volume_free_megs = null;
                        self.ownerCt.volume_id = null;
                        self.ownerCt.sizelabel.setText( "Querying data..." );
                        self.ownerCt.sizefield.disable();
                        lvm__VolumeGroup.get_free_megs( record.data.vg, function( provider, response ){
                        self.ownerCt.volume_id = record.data.vg;
                          self.ownerCt.volume_free_megs = response.result;
                          self.ownerCt.sizelabel.setText( String.format( "Max. {0} MB", response.result ) );
                          if( record.data.megs <= self.ownerCt.volume_free_megs ){
                            self.ownerCt.sizefield.setValue( record.data.megs );
                            self.ownerCt.sizefield.enable();
                          }
                        } );
                      }
                      else{
                        if( record.data.megs <= self.ownerCt.volume_free_megs ){
                          self.ownerCt.sizefield.setValue( record.data.megs );
                          self.ownerCt.sizefield.enable();
                        }
                      }
                    }
                  }
                }, {
                  fieldLabel: "Size in MB",
                  allowBlank: false,
                  name: "megs",
                  ref: 'sizefield'
                }, {
                  xtype: "label",
                  ref:   "sizelabel",
                  text:  "Waiting for volume selection...",
                  cls:   "form_hint_label"
              }],
              buttons: [{
                text: 'Create Snapshot',
                icon: "/filer/static/icons/accept.png",
                handler: function(self){
                  if( !self.ownerCt.ownerCt.getForm().isValid() ){
                    return;
                  }
                  var free = self.ownerCt.ownerCt.volume_free_megs;
                  if( free === null || typeof free == "undefined" ){
                    Ext.Msg.alert("Error", "Please wait for the query for available space to complete.");
                    return;
                  }
                  if( free < self.ownerCt.ownerCt.sizefield.getValue() ){
                    Ext.Msg.alert("Error", "Your volume exceeds the available capacity of "+free+" MB.");
                    return;
                  }
                  lvm__LogicalVolume.create({
                    'snapshot': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'name':       self.ownerCt.ownerCt.namefield.getValue(),
                    'megs':       self.ownerCt.ownerCt.sizefield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      lvmSnapPanel.store.reload();
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
        text: "Delete Snapshot",
        icon: "/filer/static/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = lvmSnapPanel.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              'Confirm delete',
              String.format( 'Really delete snapshot {0} and all its shares?<br />'+
                '<b>There is no undo and you will lose all data.</b>', sel.data.name ),
              function(btn, text){
                if( btn == 'yes' ){
                  lvm__LogicalVolume.remove( sel.data.id, function(provider, response){
                    lvmSnapPanel.store.reload();
                  } );
                }
                else
                  alert("Aborted.");
              }
            );
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


window.MainViewModules.push( new Ext.oa.Lvm__Snapshot_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
