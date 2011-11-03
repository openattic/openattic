{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Peering__Peerhost_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    var peerhostGrid = this;
    var addwin = new Ext.Window(Ext.applyIf(config, {
      layout: "fit",
      height: 300,
      width: 500,
      items: [{
        xtype: "form",
        api: {
          load:   peering__PeerHost.get_ext,
          submit: peering__PeerHost.set_ext
        },
        defaults: {
          xtype: "textfield",
          anchor: '-20px'
        },
        paramOrder: ["id"],
        baseParams: {
          id: (record ? record.id : -1)
        },
        listeners: {
          afterrender: function(self){
            self.getForm().load();
          }
        },
        items: [ {
          fieldLabel: "{% trans 'Name' %}",
          name: "name"
        }, {
          fieldLabel: "{% trans 'Base URL' %}",
          name: "base_url",
          value: "http://__:<<APIKEY>>@<<HOST>>:31234/"
        } ],
        buttons: [{
          text: config.submitButtonText,
          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
          handler: function(self){
            self.ownerCt.ownerCt.getForm().submit({
              success: function(provider, response){
                if( response.result ){
                  peerhostGrid.store.reload();
                  addwin.hide();
                }
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
    }));
    addwin.show();
  },

  initComponent: function(){
    var peerhostGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'peering__peerhost_panel_inst',
      title: "{% trans 'openATTIC Peers' %}",
      viewConfig: { forceFit: true },
      buttons: [ {
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          peerhostGrid.store.reload();
        }
      }, {
        text: "{% trans 'Add Peer' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          peerhostGrid.showEditWindow({
            title: "{% trans 'Add Peer' %}",
            submitButtonText: "{% trans 'Create Peer' %}"
          });
        }
      }, {
        text: "{% trans 'Edit Peer' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = peerhostGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            peerhostGrid.showEditWindow({
              title: "{% trans 'Edit Peer' %}",
              submitButtonText: "{% trans 'Edit Peer' %}"
            }, sel.data);
          }
        }
      }, {
        text: "{% trans 'Delete Peer' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = peerhostGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              "{% trans 'Delete Peer' %}",
              interpolate(
                "{% trans 'Do you really want to delete %s?' %}",[sel.data.name]),
                function(btn){
                  if(btn == 'yes'){
                    peering__PeerHost.remove( sel.data.id, function(provider, response){
                      peerhostGrid.store.reload();
                    } );
                  }
                }
              );
            }
          }
        }
      ],
      store: {
        xtype: 'directstore',
        fields: ['id', 'base_url', 'name', 'hostname'],
        directFn: peering__PeerHost.all
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Name' %}",
          width: 100,
          dataIndex: "name"
        }, {
          header: "{% trans 'Hostname' %}",
          width: 200,
          dataIndex: "hostname"
        }]
      })
    }));
    Ext.oa.Peering__Peerhost_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Peering__Peerhost_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("peering__peerhost_panel", Ext.oa.Peering__Peerhost_Panel);

Ext.oa.Peering__Peerhost_Module = Ext.extend(Object, {
  panel: "peering__peerhost_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_services", {
      text: "{% trans 'openATTIC Peers' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'peering__peerhost_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Peering__Peerhost_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
