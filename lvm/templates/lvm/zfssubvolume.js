{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Zfs__Subvolume__Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    var subvolumegrid = this;
    
    var addwin = new Ext.Window(Ext.apply(config, {
      layout: "fit",
      defaults: {autoScroll: true},
      height: 200,
      width: 500,
      items: [{
        xtype: "form",
        bodyStyle: 'padding: 5px 5px;',
        api: {
          load: lvm__ZfsSubvolume.get_ext,
          submit: lvm__ZfsSubvolume.set_ext
        },
        baseParams: {
          id: (record ? record.id : -1)
        },
        paramOrder: ["id"],
        listeners: {
          afterrender: function(self){
            self.getForm().load();
          }
        },
         defaults: {
          xtype: "textfield",
          anchor: '-20px',
          defaults: {
            anchor: "0px"
          }
        },
        items: [{
          xtype: 'fieldset',
          layout: 'form',
          items: [{ fieldLabel: "Name",
                    name: "volname",
                    xtype: 'textfield',
                   allowBlank: false,
                   ref: "namefield"
                 },{
                   xtype: 'combo',
                   name: "volume_",
                   hiddenName: 'volume',
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
                 }]
        }],
        buttons: [{
         text: config.submitButtonText,
                   icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                   handler: function(self){
                     self.ownerCt.ownerCt.getForm().submit({
                       success: function(provider,response){
                        if(response.result){
                          subvolumegrid.store.reload();
                          addwin.hide();
                        }
                        }
                       });
                    }
        },{
          text:"{% trans 'Cancel' %}",
          icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
          handler: function(self){
            addwin.hide();
        }
        }]
    }]
  }));
    addwin.show();
},
                       
 
        initComponent: function(){
          var subvolumegrid = this;
          Ext.apply(this, Ext.apply(this.initialConfig, {
            id: "zfs__subvolume_panel_inst",
            title: "zfs",
            viewConfig: {forceFit: true},
            buttons: [{
              text: "",
              icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
              tooltip: "{% trans 'Reload' %}",
              handler: function(self){
              zfsSubvolumePanel.store.reload();
              }
            },{
           text: "{% trans 'Create Subvolume' %}",
           icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
           handler: function() {
             subvolumegrid.showEditWindow({
               title: "{% trans 'Add Subvolume' %}",
               submitButtonText:"{% trans 'Create Subvolume' %}"
             });
            }
          },{
            text: "{% trans 'Delete Subvolume' %}",
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: this.deleteFunction,
            scope: subvolumegrid
        }],
           
    keys: [{ scope: subvolumegrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],
        store: new Ext.data.DirectStore({
          //autoLoad: true,
          fields: ['id','volname',{
            name: 'orivolume',mapping: 'volume',convert: function(val, row) {
            if( val === null )
              return null;
            return val.name;
            }
          }],
            directFn: lvm__ZfsSubvolume.all
          }),
          viewConfig: { forceFit: true },
        colModel: new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: "{% trans 'Subvolume' %}",
            dataIndex: "volname"
          },{
            header: "{% trans 'Volume' %}",
            dataIndex: "orivolume"
          }]
        })
      }));
    Ext.oa.Zfs__Subvolume__Panel.superclass.initComponent.apply(this, arguments);
  },
     deleteFunction: function(self){
  var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
        Ext.Msg.confirm(
          "{% trans 'Confirm delete' %}",
          interpolate(
            "{% trans 'Really delete subvolume %s ?<br /><b>There is no undo.</b>' %}", [sel.data.name]),
            function(btn){
              if(btn == 'yes'){
                lvm__ZfsSubvolume.remove( sel.data.id, function(provider, response){
                sel.store.reload();
                });
              } 
           });
    }
 },
    onRender: function(){
        Ext.oa.Zfs__Subvolume__Panel.superclass.onRender.apply(this, arguments);
        this.store.reload();
        var self = this;
        var menu = new Ext.menu.Menu({
    items: [{
            id: 'delete',
            text: 'delete',
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png"
        }],
        listeners: {
          itemclick: function(item) {
                    self.deleteFunction()
          }
        }
    
});
         this.on({
      'contextmenu': function(event) {
        if( this.getSelectionModel().hasSelection() ){
          event.stopEvent();
          this.getSelectionModel
          menu.showAt(event.xy);
        }
      }
    });
  }
});

Ext.reg("zfs__subvolume_panel", Ext.oa.Zfs__Subvolume__Panel);


// kate: space-indent on; indent-width 2; replace-tabs on;
