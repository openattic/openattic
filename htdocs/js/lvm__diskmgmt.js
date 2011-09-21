Ext.namespace("Ext.oa");

Ext.oa.Lvm__Partitions_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var diskStore = new Ext.data.JsonStore({
      fields: [
        "physical-sector-size", "logical-sector-size", "partition-table-type",
        "path", "model-name", "transport-type", "size"
      ],
      data: []
    });
    var partStore = new Ext.data.JsonStore({
      fields: [ "begin", "end", "flags-set", "number", "partition-name", "filesystem-type", "size" ],
      data: []
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'border',
      items: [ new Ext.DataView({
        title: "Disk information",
        height: 200,
        region: "north",
        tpl: new Ext.XTemplate(
          '<tpl for=".">',
            '<table>',
              '<tr><th>Path</th><td>{path}</td></tr>',
              '<tr><th>Size</th><td>{size}</td></tr>',
            '</table>',
          '</tpl>'),
        singleSelect: true,
        autoHeight: true,
        itemSelector: 'div.thumb_wrap',
        loadingText: 'Loading...',
        store: diskStore
      }), {
        xtype: "grid",
        title: "Partitions",
        region: 'center',
        store: partStore,
        colModel:  new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
              header: "#",
              width: 20,
              dataIndex: "number"
            }, {
              header: "Size",
              width: 100,
              dataIndex: "size"
          }]
        })
      }]
    }));
    Ext.oa.Lvm__Partitions_Panel.superclass.initComponent.apply(this, arguments);
    lvm__VolumeGroup.get_partitions(this.device, function(provider, response){
      if( response.result ){
        diskStore.loadData( [ response.result[0] ] );
        partStore.loadData( response.result[1] );
      }
    });
  }
});



Ext.oa.Lvm__Disks_Panel = Ext.extend(Ext.TabPanel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Disk Management",
    }));
    Ext.oa.Lvm__Disks_Panel.superclass.initComponent.apply(this, arguments);
    var self = this;
    lvm__VolumeGroup.get_devices(function(provider, response){
      if( response.result ){
        for( var i = 0; i < response.result.length; i++ ){
          self.add(new Ext.oa.Lvm__Partitions_Panel({
            title: response.result[i],
            device: ('/dev/' + response.result[i])
          }));
        }
        if( self.getActiveTab() === null ){
          self.setActiveTab(0);
        }
      }
    });
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[1].children.push({
      text: 'Disk Management',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/database.png',
      panel: this,
      href: '#',
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
