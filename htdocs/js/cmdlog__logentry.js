Ext.namespace("Ext.oa");

Ext.oa.Cmdlog__LogEntry_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var currentChartId = null;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      viewConfig: { forceFit: true },
      title: "Log Entries",
      store: new Ext.data.DirectStore({
          autoLoad: true,
          fields: ['command', 'exitcode', 'text'],
          directFn: cmdlog__LogEntry.all_values,
          baseParams: {'fields': ['command', 'exitcode']}
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true,
        },
        columns: [{
            header: 'Befehl',
            dataIndex: 'command'
          }, {
            header: "Exit-Status",
            dataIndex: 'exitcode'
        }]
      })
    }));
    Ext.oa.Cmdlog__LogEntry_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[5].children.push({
      text: 'Command Log',
      leaf: true,
      icon: '/filer/static/icons2/22x22/mimetypes/x-office-spreadsheet.png',
      panel: this,
      href: '#',
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
