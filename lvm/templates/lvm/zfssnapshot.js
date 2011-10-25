{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Zfs__Snapshot_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var zfsSnapPanel = this;
    var snapshotid = null;
      
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans "Zfs Snapshots" %}",
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
                       zfsSnapPanel.store.reload();
                       })
                    }
                  }  
                )
              }
            }
        }
      ],
      items: [{
        xtype: "grid",
        region: "center",
        autoScroll: true,
        viewConfig: { forceFit: true },
        store: new Ext.data.DirectStore({
          autoLoad: true,
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
            zfsSnapPanel.snapGrid.store.load({ params: {"volume__name":record.data.name}});
          }
        },
      },{
        xtype: "grid",
        region: "south",
        autoScroll: true,
        height: 300,
        viewConfig: { forceFit: true },
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

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: "{% trans 'Zfs Snapshots' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/snapshot.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Zfs__Snapshot_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
