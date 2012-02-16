{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Tftp__Instance_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    var tftpGrid = this;
    var addwin = new Ext.Window(Ext.apply(config,{
      layout: "fit",
      defaults: {autoScroll: true},
        height: 205,
        width: 500,
          items:[{
          xtype: "form",
          bodyStyle: 'padding: 5px 5px;',
          api: {
            load: tftp__Instance.get_ext,
            submit: tftp__Instance.set_ext
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
            defaults: {
              anchor: "0px"
            }
          },
          items: [{
            xtype: 'fieldset',
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
                  xtype:      'combo',
                  fieldLabel: "{% trans 'Address' %}",
                  name:       "address",
                  ref:        'addrfield',
                  allowBlank: false,
                  hiddenName: 'address',
                  store: new Ext.data.DirectStore({
                    fields: ["app", "obj", "id", "address"],
                    baseParams: {fields: ["app", "obj", "id", "address"] },
                    directFn: ifconfig__IPAddress.ids
                  }),
                  typeAhead:     true,
                  triggerAction: 'all',
                  emptyText:     "{% trans 'Select...' %}",
                  selectOnFocus: true,
                  displayField:  'address',
                  valueField:    'id'
                }]
            }],
            buttons: [{
            text: config.submitButtonText,
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            handler: function(self){
              self.ownerCt.ownerCt.getForm().submit({
                params: {id: -1, init_master: true, ordering: 0},
                success: function(provider, response){
                  if(response.result){
                    tftpGrid.store.reload();
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
   var tftpGrid = this;
   Ext.apply(this, Ext.apply(this.initialConfig, {
   id: "tftp__instance_panel_inst",
   title: "tftp",
   viewConfig: {forceFit: true},
    buttons: [{
    text: "",
    icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
    tooltip: "{% trans 'Reload' %}",
      handler: function(self){
        tftpGrid.store.reload();
      }
     },{
      text: "{% trans 'Add Instance' %}",
      icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          tftpGrid.showEditWindow({
            title: "{% trans 'Add Instance' %}",
            submitButtonText: "{% trans 'Add Instance' %}" 
          });
          }
     },{
        text: "{% trans 'Delete Instance' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: tftpGrid
        }
      ],
      keys: [{scope: tftpGrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],
      store: new Ext.data.DirectStore({
        //xtype: 'directstore',
        fields: ['id', 'address', 'path', {
          name: "address_ip", mapping: "address", convert:  function( val, row ){ return val.address; }
        }],
        directFn: tftp__Instance.all
      }),
      viewConfig: { forceFit: true },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
        }, {
          header: "{% trans 'Address' %}",
          width: 100,
          dataIndex: "address_ip"
        }]
      })
    }));
    Ext.oa.Tftp__Instance_Panel.superclass.initComponent.apply(this, arguments);
  },
    deleteFunction: function(self){
    var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      Ext.Msg.confirm(
        "{% trans 'Delete Instance' %}",
        interpolate(
          "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
          function(btn){
            if(btn == 'yes'){
              tftp__Instance.remove( sel.data.id, function(provider, response){
              sel.store.reload();
            } );
          }
        });
      }
    },
  onRender: function(){
    Ext.oa.Tftp__Instance_Panel.superclass.onRender.apply(this, arguments);
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

Ext.reg("tftp__instance_panel", Ext.oa.Tftp__Instance_Panel);

Ext.oa.Tftp__Instance_Module = Ext.extend(Object, {
  panel: "tftp__instance_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Embedded (TFTP)' %}",
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/categories/preferences-other.png',
      panel: 'tftp__instance_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Tftp__Instance_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
