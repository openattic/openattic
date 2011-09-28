Ext.namespace("Ext.oa");

Ext.oa.Lvm__Partitions_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var partStore = new Ext.data.JsonStore({
      fields: [ "begin", "end", "flags-set", "number", "partition-name", "filesystem-type", "size" ],
      data: []
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
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
            header: gettext("Size"),
            width: 100,
            dataIndex: "size"
          }, {
            header: gettext("Begin"),
            width: 100,
            dataIndex: "begin"
          }, {
            header: gettext("End"),
            width: 100,
            dataIndex: "end"
          }, {
            header: gettext("FS Type"),
            width: 100,
            dataIndex: "filesystem-type"
          }, {
            header: gettext("Label"),
            width: 100,
            dataIndex: "partition-name"
          }, {
            header: gettext("Flags"),
            width: 100,
            dataIndex: "flags-set"
        }]
      })
    }));
    Ext.oa.Lvm__Partitions_Panel.superclass.initComponent.apply(this, arguments);
    var self = this;
    lvm__VolumeGroup.get_partitions(this.device, function(provider, response){
      if( response.result ){
        var disk = response.result[0];
        self.setTitle( String.format( "{0} &mdash; {1}, {2}, {3}",
          disk["path"], disk["size"], disk["transport-type"], disk["model-name"]
        ));
        partStore.loadData( response.result[1] );
      }
    });
  }
});



Ext.oa.Lvm__Disks_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: gettext("Disk Management"),
      layout: 'accordion',
      buttons: [ {
        text: gettext("Initialize"),
        handler: function(){ alert("add me to a VG"); }
      } ]
    }));
    Ext.oa.Lvm__Disks_Panel.superclass.initComponent.apply(this, arguments);
    var self = this;
    lvm__VolumeGroup.get_devices(function(provider, response){
      if( response.result ){
        for( var i = 0; i < response.result.length; i++ ){
          self.add(new Ext.oa.Lvm__Partitions_Panel({
            title: String.format("/dev/{0} &mdash; {1} {2} {3}",
              response.result[i].block, response.result[i].vendor,
              response.result[i].model, response.result[i].rev),
            device: ('/dev/' + response.result[i].block)
          }));
        }
      }
    });
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[1].children.push({
      text: gettext('Disk Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__Disks_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
