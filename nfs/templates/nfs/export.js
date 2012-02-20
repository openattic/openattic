{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Nfs__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    var nfsGrid = this;
    var addwin = new Ext.Window(Ext.apply(config, {
      layout: "fit",
      defaults: {autoScroll: true},
        height: 240,
        width: 500,
      items:[{
        xtype: "form",
        bodyStyle: 'padding: 5px 5px;',
        api: {
          load: nfs__Export.get_ext,
          submit: nfs__Export.set_ext
        },
        baseParams: {
          id: (record ? record.id: -1)
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
          defaults : {
            anchor: "0px"
          }
        },
        items: [{
          xtype: 'fieldset',
          title: 'NFS Export',
          layout: 'form',
          items: [
                tipify({
                  xtype: 'volumefield',
                  name: "volume_",
                  hiddenName: "volume",
                  listeners: {
                    select: function(self, record, index){
                      lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                        self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                        self.ownerCt.dirfield.enable();
                      } );
                    }
                  }
                }, "{% trans 'Please select the volume to share.' %}"),
              tipify({
                  xtype: 'textfield',
                  fieldLabel: "{% trans 'Directory' %}",
                  name: "path",
                  disabled: true,
                  ref: 'dirfield'
                }, "{% trans 'If you wish to share only a subpath of the volume, enter the path here.' %}" ),
              {
                xtype: 'textfield',
                fieldLabel: "{% trans 'Address' %}",
                allowBlank: false,
                name: "address",
                ref: 'addrfield'
              }, tipify({
                xtype: 'textfield',
                fieldLabel: "{% trans 'Options' %}",
                name: "options",
                ref: 'optfield',
                value: "rw,no_subtree_check,no_root_squash"
              },"{% trans 'this is default. rw: read/write rights are given,<br> no_subtree_check means that every file request is going to be checked to make sure that this file is in an exported subdirectory,<br> no_root_squash means share the folder (public), every IP-Adress has access, root can connect as root' %}")]
        }],
              buttons: [{
                text: config.submitButtonText,
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  self.ownerCt.ownerCt.getForm().submit({
                    success: function(provider, response){
                      if(response.result){
                        nfsGrid.store.reload();
                        addwin.hide();
                      }
                    }
                  });
                }
              },{
                text: "{% trans 'Cancel' %}",
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
        var nfsGrid = this;
        Ext.apply(this, Ext.apply(this.initialConfig,{
          id: "nfs__export_panel_inst",
          title: "nfs",
          viewConfig: {forceFit: true},
          buttons: [{
            text: "",
            icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
            tooltip: "{% trans 'Reload' %}",
            handler: function(self){
              nfsGrid.store.reload();
            }
        },{
        text: "{% trans 'Add Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          nfsGrid.showEditWindow({
            title: "{% trans 'Add Export' %}",
            submitButtonText: "{% trans 'Create Export' %}"
          });
        }
       },{
        text:  "{% trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = nfsGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            nfsGrid.showEditWindow({
              title: "{% trans 'Edit' %}",
              submitButtonText: "{% trans 'Edit' %}"
            }, sel.data);
          }
        }
       },{
        text: "{% trans 'Delete Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: nfsGrid
        }],
       keys: [{ scope: nfsGrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],
       store: new Ext.data.DirectStore({
        fields: ['id', 'address', 'path', 'options'],
        directFn: nfs__Export.all
      }),
      viewConfig: {forceFit: true},
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Address' %}",
          width: 100,
          dataIndex: "address"
        }, {
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
        }, {
          header: "{% trans 'Options' %}",
          width: 200,
          dataIndex: "options"
        }]
      })
    }));
    Ext.oa.Nfs__Export_Panel.superclass.initComponent.apply(this, arguments);
  },
    deleteFunction: function(self){
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        Ext.Msg.confirm(
          "{% trans 'Delete Export' %}",
          interpolate(
            "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
          function(btn){
            if(btn == 'yes'){
              nfs__Export.remove( sel.data.id, function(provider, response){
                sel.store.reload();
              } );
            }
          });
      }
    },

  onRender: function(){
    Ext.oa.Nfs__Export_Panel.superclass.onRender.apply(this, arguments);
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

Ext.reg("nfs__export_panel", Ext.oa.Nfs__Export_Panel);

Ext.oa.Nfs__Export_Module = Ext.extend(Object, {
  panel: "nfs__export_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Linux (NFS)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'nfs__export_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Nfs__Export_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
