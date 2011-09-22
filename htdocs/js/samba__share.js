Ext.namespace("Ext.oa");

Ext.oa.Samba__Share_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var currentChartId = null;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Samba",
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['path', 'state', 'available'],
        directFn: samba__Share.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "path",
          width: 200,
          dataIndex: "path"
        }, {
          header: "state",
          width: 50,
          dataIndex: "state"
        }, {
          header: "available",
          width: 50,
          dataIndex: "available"
        }]
      })
    }));
    Ext.oa.Samba__Share_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: 'Windows (Samba)',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/samba.png',
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
