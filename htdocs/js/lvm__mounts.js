Ext.namespace("Ext.oa");

Ext.oa.Lvm__Mounts_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var fields = ['dev', 'mountpoint', 'fstype', 'options', 'dump', 'pass'];
    var mountGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Mount Points",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: "/filer/static/icons2/16x16/actions/reload.png",
        tooltip: 'Reload',
        handler: function(self){
          mountGrid.store.reload();
        }
      } ],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: fields,
        directFn: lvm__VolumeGroup.get_mounts,
        reader: new Ext.data.ArrayReader({
          fields: fields
        })
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "Device",
          width: 300,
          dataIndex: "dev"
        }, {
          header: "Mount Point",
          width: 300,
          dataIndex: "mountpoint"
        }, {
          header: "FS Type",
          width: 100,
          dataIndex: "fstype"
        }, {
          header: "Options",
          width: 300,
          dataIndex: "options"
        } ]
      })
    }));
    Ext.oa.Lvm__Mounts_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: 'Mount Points',
      leaf: true,
      icon: '/filer/static/icons2/22x22/devices/hdd_unmount.png',
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
