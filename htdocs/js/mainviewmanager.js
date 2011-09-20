Ext.namespace("Ext.oa");

Ext.oa.MainViewManager = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var modules = [
      new Ext.oa.Lvm__LogicalVolume_Panel(),
      new Ext.oa.Nfs__Export_Panel(),
      new Ext.oa.Samba__Share_Panel(),
      new Ext.oa.Http__Export_Panel(),
      new Ext.oa.Cmdlog__LogEntry_Panel(),
      new Ext.oa.Munin__MuninNode_Panel()
    ];

    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'border',
      items: [ new Ext.oa.MenuTree({
        region: 'west',
        collapsible: true,
      }), {
        xtype: "tabpanel",
        region: "center",
        activeTab: 0,
        items: modules
      }],
      modules: modules
    }));
    Ext.oa.MainViewManager.superclass.initComponent.apply(this, arguments);
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
