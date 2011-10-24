{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Zfs__Snapshot_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var zfsSnapPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans "Zfs Snapshots" %}",
       buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
          zfsSnapPanel.store.reload();
          }
        }],
      items: [{
        xtype: "grid",
        region: "center",
        viewConfig: { forceFit: true },
        store: new Ext.data.DirectStore({
          autoLoad: true,
          fields: ['name'],
          baseParams: { "filesystem":"zfs" },
          directFn: lvm__LogicalVolume.filter
        }),
        colModel: new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: "{% trans 'Volume' %}",
            width: 100,
            dataIndex: "name"
          }]
        })
      }]
    }));
    Ext.oa.Zfs__Snapshot_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[1].children.push({
      text: "{% trans 'Zfs Snapshots' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/snapshot.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Zfs__Snapshot_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
