Ext.namespace("Ext.oa");

Ext.oa.MainViewManager = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var modules = [ 
      new Ext.oa.Portal(),
      new Ext.oa.Lvm__Disks_Panel(),
      new Ext.oa.Lvm__LogicalVolume_Panel(),
      new Ext.oa.Lvm__Mounts_Panel(),
      new Ext.oa.Lvm__Snapshot_Panel(),
      new Ext.oa.Nfs__Export_Panel(),
      new Ext.oa.Samba__Share_Panel(),
      new Ext.oa.Http__Export_Panel(),
      new Ext.oa.Ftp__User_Panel(),
      new Ext.oa.Cmdlog__LogEntry_Panel(),
      new Ext.oa.Munin__MuninNode_Panel(),
      new Ext.oa.WebSSHPanel(),
      new Ext.oa.SysUtils_Panel()
    ];

    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'border',
      items: [ new Ext.oa.MenuTree({
        split: true,
        width: 250,
        minSize: 175,
        maxSize: 400,
        region: 'west',
        border: false,
        collapsible: true
      }), {
        region: "center",
        activeItem: 0,
        layout: "card",
        items: modules
      }],
      modules: modules
    }));
    Ext.oa.MainViewManager.superclass.initComponent.apply(this, arguments);

    this.menutree = this.items.items[0];
    this.modcontainer = this.items.items[1];
    this.currentComponent = modules[0];

    for( var i = 0; i < modules.length; i++ ){
      modules[i].prepareMenuTree(this.menutree);
    }

    this.menutree.on( 'beforeclick', this.treenodeClicked, this );
  },

  treenodeClicked: function( node, event ){
    if( node.leaf && typeof node.attributes.panel != "undefined" )
      this.switchComponent( node.attributes.panel );
  },

  switchComponent: function( toComponent ){
    this.modcontainer.layout.setActiveItem( toComponent.id );
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
