{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Lvm__Mounts_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var fields = ['dev', 'mountpoint', 'fstype', 'options', 'dump', 'pass'];
    var mountGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "lvm__mounts_panel_inst",
      title: "{% trans "Mount Points" %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          mountGrid.store.reload();
        }
      } ],
      store: {
        xtype: "directstore",
        fields: fields,
        directFn: lvm__VolumeGroup.get_mounts,
        reader: new Ext.data.ArrayReader({
          fields: fields
        })
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans "Device" %}",
          width: 300,
          dataIndex: "dev"
        }, {
          header: "{% trans "Mount Point" %}",
          width: 300,
          dataIndex: "mountpoint"
        }, {
          header: "{% trans "FS Type" %}",
          width: 100,
          dataIndex: "fstype"
        }, {
          header: "{% trans "Options" %}",
          width: 300,
          dataIndex: "options"
        } ]
      })
    }));
    Ext.oa.Lvm__Mounts_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Lvm__Mounts_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("lvm__mounts_panel", Ext.oa.Lvm__Mounts_Panel);

Ext.oa.Lvm__Mounts_Module = Ext.extend(Object, {
  panel: "lvm__mounts_panel",

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: "{% trans 'Mount Points' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/devices/hdd_unmount.png',
      panel: "lvm__mounts_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__Mounts_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
