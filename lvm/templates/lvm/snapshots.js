{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Lvm__Snapshot_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var lvmSnapPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "lvm__snapshot_panel_inst",
      title: "{% trans "Volume Snapshots" %}",
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans "Reload" %}",
        handler: function(self){
          lvmSnapPanel.store.reload();
        }
      }, {
        text: "{% trans "Add Snapshot" %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans "Add Snapshot" %}",
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
                  fieldLabel: "{% trans "Name" %}",
                  name: "name",
                  allowBlank: false,
                  ref: 'namefield'
                }, {
                  xtype:      'combo',
                  allowBlank: false,
                  fieldLabel: "{% trans 'Original Volume' %}",
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
                  emptyText:     "{% trans 'Select...' %}",
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
                        self.ownerCt.sizelabel.setText( "{% trans "Querying data..." %}" );
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
                }, tipify({
                  fieldLabel: "{% trans 'Size in MB' %}",
                  allowBlank: false,
                  name: "megs",
                  ref: 'sizefield'
                },"{%trans 'Please consider, that the size of your snapshot depends on the kind and frequency of change.' %}"), {
                  xtype: "label",
                  ref:   "sizelabel",
                  text:  "{% trans "Waiting for volume selection..." %}",
                  cls:   "form_hint_label"
              }],
              buttons: [{
                text: "{% trans 'Create Snapshot' %}",
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  if( !self.ownerCt.ownerCt.getForm().isValid() ){
                    return;
                  }
                  var free = self.ownerCt.ownerCt.volume_free_megs;
                  if( free === null || typeof free == "undefined" ){
                    Ext.Msg.alert("{% trans "Error" %}",
                      "{% trans "Please wait for the query for available space to complete." %}");
                    return;
                  }
                  if( free < self.ownerCt.ownerCt.sizefield.getValue() ){
                    Ext.Msg.alert("{% trans 'Error' %}",
                      interpolate("{% trans 'Your volume exceeds the available capacity of %s MB.' %}", [free]));
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
        text: "{% trans 'Delete Snapshot' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = lvmSnapPanel.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              "{% trans 'Confirm delete' %}",
              interpolate(
                "{% trans 'Really delete snapshot %s and all its shares?<br /><b>There is no undo and you will lose all data.</b>' %}",
                [sel.data.name] ),
              function(btn, text){
                if( btn == 'yes' ){
                  lvm__LogicalVolume.remove( sel.data.id, function(provider, response){
                    lvmSnapPanel.store.reload();
                  } );
                }
                else
                  alert("{% trans "Aborted." %}");
              }
            );
          }
        }
      }],
      store: (function(){
        // Anon function that is called immediately to set up the store's DefaultSort
        var store = new Ext.data.DirectStore({
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
          header: "{% trans 'LV' %}",
          width: 200,
          dataIndex: "name"
        }, {
          header: "{% trans 'Size' %}",
          width: 150,
          dataIndex: "megs",
          align: 'right',
          renderer: function( val, x, store ){
            if( val >= 1000 )
              return String.format("{0} GB", (val / 1000).toFixed(2));
            return String.format("{0} MB", val);
          }
        }, {
          header: "{% trans 'Original Volume' %}",
          width: 200,
          dataIndex: "origvolname"
        }]
      })
    }));
    Ext.oa.Lvm__Snapshot_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Lvm__Snapshot_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("lvm__snapshot_panel", Ext.oa.Lvm__Snapshot_Panel);

Ext.oa.Lvm__Snapshot_Module = Ext.extend(Object, {
  panel: "lvm__snapshot_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: "{% trans 'Volume Snapshots' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/snapshot.png',
      panel: "lvm__snapshot_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__Snapshot_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
