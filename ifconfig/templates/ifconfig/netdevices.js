{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Ifconfig__NetDevice_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var nfsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'iscsi__netdevice_panel_inst',
      title: "{% trans 'Network interfaces' %}",
      viewConfig: { forceFit: true },
      buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            nfsGrid.store.reload();
          }
        }
      ],
      store: {
        xtype: 'directstore',
        fields: ['id', 'devname', 'auto', 'dhcp'],
        directFn: ifconfig__NetDevice.all
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Device' %}",
          width: 100,
          dataIndex: "devname"
        }, {
          header: "{% trans 'Auto' %}",
          width: 200,
          dataIndex: "auto"
        }, {
          header: "{% trans 'DHCP' %}",
          width: 200,
          dataIndex: "dhcp"
        }]
      })
    }));
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("iscsi__netdevice_panel", Ext.oa.Ifconfig__NetDevice_Panel);

Ext.oa.Ifconfig__NetDevice_Module = Ext.extend(Object, {
  panel: "iscsi__netdevice_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: 'Network',
      icon: MEDIA_URL + '/icons2/22x22/places/gnome-fs-network.png',
      children: [ {
          text: 'General',
          leaf: true,
          icon: MEDIA_URL + '/icons2/22x22/apps/network.png',
          panel: 'iscsi__netdevice_panel_inst',
        }, {
          text: 'Proxy',            leaf: true,
          icon: MEDIA_URL + '/icons2/22x22/apps/preferences-system-network-proxy.png'
        }, {
          text: 'Domain',
          icon: MEDIA_URL + '/icons2/128x128/apps/domain.png',
          children: [
            {text: 'Active Directory',  leaf: true},
            {text: 'LDAP',   leaf: true}
          ]
      } ]
    });
  }
});


window.MainViewModules.push( new Ext.oa.Ifconfig__NetDevice_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
