{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Zfs__Subvolume__Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var zfsSubvolumePanel = this;
      
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans "Zfs Subvolume" %}",
      id: "zfs__subvolume_panel_inst",
      xtype: "grid",
      ref: "subvolumegrid",
      autoScroll: true,
      viewConfig: { forceFit: true },
        store: new Ext.data.DirectStore({
          autoLoad: true,
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
       buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
          zfsSubvolumePanel.store.reload();;
          }
        },{
           text: "{% trans 'Create Subvolume' %}",
           icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
           handler: function() {
             var addwin = new Ext.Window({
               title: "{% trans "Add Subvolume" %}",
               layout: "fit",
               height: 150,
               width: 500,
               items: [{
                 xtype: "form",
                 border: false,
                 defaults: {
                   xtype: "textfield",
                   anchor: "-20px"
                 },
                 items: [{
                   fieldLabel: "Name",
                   allowBlank: false,
                   ref: "namefield"
                 },{
                   xtype: "combo",
                   allowBlank: false,
                   fieldLabel: "{% trans 'Volume' %}",
                   store: {
                     xtype: "directstore",
                     fields: ['name', 'id'],
                     baseParams: { "field": "name", kwds: {"filesystem":"zfs" }},
                     paramOrder: ["field", "query", "kwds"],
                     directFn: lvm__LogicalVolume.filter_combo
                   },
                   emptyText: "Select...",
                   triggerAction: "all",
                   selectOnFocus: true,
                   displayField: "name",
                   valueField: "id",
                   ref: "volfield"
                 }
                 ],
                 buttons: [{
                   text: "{% trans 'Create' %}",
                   icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                   handler: function(self){
                        lvm__ZfsSubvolume.create({
                            "volume": {
                              "app": "lvm",
                              "obj": "LogicalVolume",
                              "id": self.ownerCt.ownerCt.volfield.getValue()},
                            "volname":  self.ownerCt.ownerCt.namefield.getValue()
                          }, function (provider, response){
                            addwin.hide();
                            zfsSubvolumePanel.store.reload();
                          })
                      }
                 }]
               }]
             })
             addwin.show();
           }
        },{
            text: "{% trans "Delete Subvolume" %}",
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: function(self){
              var sm = zfsSubvolumePanel.getSelectionModel();
              if( sm.hasSelection() ){
                var sel = sm.selections.items[0];
                Ext.Msg.confirm(
                  "{% trans 'Confirm delete' %}",
                   interpolate(
                     "{% trans 'Really delete subvolume %s ?<br /><b>There is no undo.</b>' %}",
                     [sel.data.volname] ),
                  function(btn, text){
                    if( btn == 'yes' ) {
                       lvm__ZfsSubvolume.remove( sel.id, function (provider, response){
                       zfsSubvolumePanel.store.reload();;
                       })
                    }
                  }  
                )
              }
            }
        }
      ]
    }));
    Ext.oa.Zfs__Subvolume__Panel.superclass.initComponent.apply(this, arguments);
  },
    onRender: function(){
        Ext.oa.Zfs__Subvolume__Panel.superclass.onRender.apply(this, arguments);
        this.store.reload();
    }
});

Ext.reg("zfs__subvolume_panel", Ext.oa.Zfs__Subvolume__Panel);

Ext.oa.Zfs__Subvolume_Module = Ext.extend(Object, {
  panel: "zfs__subvolume_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: "{% trans 'Zfs Subvolume' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/snapshot.png',
      panel: "zfs__subvolume_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Zfs__Subvolume_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
