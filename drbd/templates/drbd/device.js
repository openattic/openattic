{% load i18n %}
Ext.namespace("Ext.oa");

Ext.oa.Drbd__Device_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var drbdDevGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "drbd__device_panel_inst",
      title: "{% trans 'DRBD' %}",
      viewConfig:{ forceFit: true },
      buttons: [
       {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
          drbdDevGrid.store.reload();
        }
      }, {
        text: "{% trans 'Add DRBD Device' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add DRBD Device' %}",
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
                fieldLabel: "{% trans 'Protocol' %}",
                name: "protocol",
                ref: 'protofield'
              }],
              buttons: [{
                text: 'Create DRBD Device',
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  drbd__DrbdDevice.create({
                    'protocol': self.ownerCt.ownerCt.protofield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      drbdDevGrid.store.reload();
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
        text: "{% trans 'Delete DRBD Device' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = drbdDevGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            drbd__DrbdDevice.remove( sel.data.id, function(provider, response){
              drbdDevGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        fields: ['id', 'protocol', 'peeraddress', 'volume', 'cstate', 'role',{
          name: 'volumename', mapping: 'volume', convert: function(val, row){ return val.name }
        }, {
          name: 'dstate_self', mapping: 'dstate', convert: function(val, row){ return val.self }
        }, {
          name: 'role_self', mapping: 'role', convert: function (val, row) { return val.self }
        }],
        directFn: drbd__DrbdDevice.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Volume' %}",
          width: 200,
          dataIndex: "volumename"
        }, {
          header: "{% trans 'Protocol' %}",
          width:     80,
          dataIndex: "protocol"
        }, {
          header: "{% trans 'Peer Address' %}",
          width: 200,
          dataIndex: "peeraddress"
        }, {
          header: "{% trans 'Disk state (here)' %}",
          width: 200,
          dataIndex: "dstate_self"
        }, {
          header: "{% trans 'Connections state' %}",
          width: 200,
          dataIndex: "cstate"
        }, {
          header: "{% trans 'Role' %}",
          width: 200,
          dataIndex: "role_self"
        }]
      })
    }));
    Ext.oa.Drbd__Device_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Drbd__Device_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("drbd__device_panel", Ext.oa.Drbd__Device_Panel);

Ext.oa.Drbd__Device_Module = Ext.extend(Object, {
  panel: "drbd__device_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_services", {
      text: "{% trans 'DRBD' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: "drbd__device_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Drbd__Device_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
