{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Tftp__Instance_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var tftpGrid = this;
    var deleteFunction = function(self){
    var sm = tftpGrid.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      Ext.Msg.confirm(
        "{% trans 'Delete Instance' %}",
        interpolate(
          "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
          function(btn){
            if(btn == 'yes'){
              tftp__Instance.remove( sel.data.id, function(provider, response){
              tftpGrid.store.reload();
            } );
          }
        });
      }
    };   
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'tftp__instance_panel_inst',
      title: "{% trans 'TFTP' %}",
      viewConfig: { forceFit: true },
      buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            tftpGrid.store.reload();
          }
        }, {
        text: "{% trans 'Add Instance' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add Instance' %}",
            layout: "fit",
            height: 200,
            width: 500,
            items: [{
              xtype: "form",
              bodyStyle: 'padding:5px 5px;',
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [
                tipify({
                  xtype: 'volumefield',
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
                  fieldLabel: "{% trans 'Directory' %}",
                  name: "path",
                  disabled: true,
                  ref: 'dirfield'
                }, "{% trans 'If you wish to share only a subpath of the volume, enter the path here.' %}" ),
              {
                fieldLabel: "{% trans 'Address' %}",
                name:       "address",
                ref:        'addrfield',
                xtype:      'combo',
                allowBlank: false,
                hiddenName: 'address_id',
                store: {
                  xtype: "directstore",
                  fields: ["app", "obj", "id", "address"],
                  directFn: ifconfig__IPAddress.ids
                },
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     "{% trans 'Select...' %}",
                selectOnFocus: true,
                displayField:  'address',
                valueField:    'id'
              }],
              buttons: [{
                text: "{% trans 'Create Instance' %}",
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  tftp__Instance.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':    self.ownerCt.ownerCt.dirfield.getValue(),
                    'address': {
                      'app': 'ifconfig',
                      'obj': 'IPAddress',
                      'id':  self.ownerCt.ownerCt.addrfield.getValue()
                    }
                  }, function(provider, response){
                    if( response.result ){
                      tftpGrid.store.reload();
                      addwin.hide();
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
          });
          addwin.show();
        }
      },{
        text: "{% trans 'Delete Instance' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: deleteFunction
        }
      ],
      keys: [{ key: [Ext.EventObject.DELETE], handler: deleteFunction}],
      store: {
        xtype: 'directstore',
        fields: ['id', 'address', 'path', {
          name: "address_ip", mapping: "address", convert:  function( val, row ){ return val.address; }
        }],
        directFn: tftp__Instance.all
      },
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
  onRender: function(){
    Ext.oa.Tftp__Instance_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
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
