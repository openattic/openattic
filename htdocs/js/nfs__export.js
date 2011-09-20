Ext.namespace("Ext.oa");

Ext.oa.Nfs__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var currentChartId = null;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "NFS",
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['address', 'path', 'options', 'state'],
        directFn: nfs__Export.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "address",
          width: 100,
          dataIndex: "address"
        }, {
          header: "path",
          width: 200,
          dataIndex: "path"
        }, {
          header: "options",
          width: 200,
          dataIndex: "options"
        }, {
          header: "state",
          width: 50,
          dataIndex: "state"
        }]
      })
    }));
    Ext.oa.Nfs__Export_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: 'Linux (NFS)',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/nfs.png',
      panel: this,
      href: '#',
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
