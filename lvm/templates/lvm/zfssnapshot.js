{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Zfs__Snapshot_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var zfsSnapPanel = this;
      
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans "Zfs Snapshots" %}",
      id: "zfs__snapshot_panel_inst",
      layout: "border",
       buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
          zfsSnapPanel.snapGrid.store.reload();
          }
        },{
          text: "{% trans "Create Snapshot" %}",
          icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
          handler: function(){
            var addwin = new Ext.Window({
             title: "Add Snapshot",
             layout: "fit",
             height: 100,
             width: 450,
             frame: true,
             items: [{
               xtype: "form",
               defaults: {
                 xtype: "textfield",
                 anchor: '-20px'
               },
               items: [{
                 fieldLabel: "Snapshotname",
                 width: 300,
                 ref: 'snapshotnamefield'
               }],
               buttons: [{
                 text: "Create Snapshot",
                 icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                 handler: function(self){
                  var sm = zfsSnapPanel.tabpanel.getActiveTab().getSelectionModel();
                  if( sm.hasSelection() ){
                    var sel = sm.selections.items[0];
                    var tab = zfsSnapPanel.tabpanel.getActiveTab();
                    if (tab.id === "volumepanel"){
                      lvm__ZfsSnapshot.create({
                          "volume": {
                            "app": "lvm",
                            "obj": "LogicalVolume",
                            "id": sel.id},
                          "snapname":  self.ownerCt.ownerCt.snapshotnamefield.getValue(),
                        }, function (provider, response){
                          addwin.hide();
                          zfsSnapPanel.snapGrid.store.reload();
                        })
                    }
                    else {
                      lvm__ZfsSnapshot.create({
                          "snapname": self.ownerCt.ownerCt.snapshotnamefield.getValue(),
                          "subvolume": {
                            "app": "lvm",
                            "obj": "ZfsSubvolume",
                            "id": sel.id
                          }
                        }, function (provider, response){
                          addwin.hide();
                          zfsSnapPanel.snapGrid.store.reload();
                        })
                    }
                      }
                   else {
                     addwin.hide();
                     Ext.Msg.alert("Missing Volume","Please select a volume first");
                   }
                }
               }]
             }]
            });
            sysutils__System.get_time(function(provider, response){
              addwin.items.items[0].snapshotnamefield.setValue(new Date(response.result * 1000).format("d-m-Y_H:i:s"));
            });
            addwin.show();
          }    
        },{
            text: "{% trans "Delete Snapshot" %}",
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: function(self){
              var sm = zfsSnapPanel.snapGrid.getSelectionModel();
              if( sm.hasSelection() ){
                var sel = sm.selections.items[0];
                Ext.Msg.confirm(
                  "{% trans 'Confirm delete' %}",
                   interpolate(
                     "{% trans 'Really delete snapshot %s ?<br /><b>There is no undo.</b>' %}",
                     [sel.data.snapname] ),
                  function(btn, text){
                    if( btn == 'yes' ) {
                       lvm__ZfsSnapshot.remove( sel.data.id, function (provider, response){
                       zfsSnapPanel.snapGrid.store.reload();
                       })
                    }
                  }  
                )
              }
            }
        }
      ],
      items: [{
          xtype: "tabpanel",
          region: "center",
          ref: "tabpanel",
          activeTab: 0,
          border: false,
        items: [{
            xtype: "grid",
            title: "Volumes",
            id: "volumepanel",
            autoScroll: true,
            viewConfig: { forceFit: true },
            store: new Ext.data.DirectStore({
              fields: ['name'],
              baseParams: { "filesystem":"zfs" },
              directFn: lvm__LogicalVolume.filter
            }),
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [{
                header: "{% trans 'Volume' %}",
                dataIndex: "name"
              }]
            }),
            listeners: {
                cellclick: function( self, rowIndex, colIndex, evt ){
                var record = self.getStore().getAt(rowIndex);
                zfsSnapPanel.snapGrid.store.load({ params: {"volume__name":record.data.name, "subvolume__isnull": true}});
              }
            },
        },{
          xtype: "grid",
          title: "Subvolume",
          id: "subvolumepanel",
          autoScroll: true,
          viewConfig: { forceFit: true },
            store: new Ext.data.DirectStore({
              fields: ['volname'],
              directFn: lvm__ZfsSubvolume.all
            }),
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [{
                header: "{% trans 'Subvolume' %}",
                dataIndex: "volname"
              }]
            }),
             listeners: {
                activate: function(self) {
                  zfsSnapPanel.snapGrid.store.removeAll();
                },
                deactivate : function(self) {
                  zfsSnapPanel.snapGrid.store.removeAll();
                },
                cellclick: function( self, rowIndex, colIndex, evt ){
                var record = self.getStore().getAt(rowIndex);
                zfsSnapPanel.snapGrid.store.load({ params: {"subvolume__id": record.id}});
              }
            }
        }
        ]
      },{
        xtype: "grid",
        region: "south",
        autoScroll: true,
        height: 300,
        viewConfig: { forceFit: true },
        id: "snapgrid",
        ref: "snapGrid",
        store: new Ext.data.DirectStore({
          fields: ['snapname', 'id'],
          directFn: lvm__ZfsSnapshot.filter
        }),
        colModel: new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: "{% trans 'Snapshots' %}",
            dataIndex: "snapname"
          }]
        }),      
      }
      ]
    }));
    Ext.oa.Zfs__Snapshot_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Zfs__Snapshot_Panel.superclass.onRender.apply(this, arguments);
    this.items.items[0].items.items[0].store.reload();
    this.items.items[0].items.items[1].store.reload();
  }
});

Ext.reg("zfs__snapshot_panel", Ext.oa.Zfs__Snapshot_Panel);

Ext.oa.Zfs__Snapshot_Module = Ext.extend(Object, {
  panel: "zfs__snapshot_panel",
  
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: "{% trans 'Zfs Snapshots' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/snapshot.png',
      panel: "zfs__snapshot_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Zfs__Snapshot_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
