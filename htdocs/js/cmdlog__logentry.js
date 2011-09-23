Ext.namespace("Ext.oa");

Ext.oa.Cmdlog__LogEntry_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var fields = ['command', 'exitcode', 'endtime'];
    var store = new Ext.data.DirectStore({
      autoLoad: true,
      remoteSort: true,
      fields: fields,
      directFn: cmdlog__LogEntry.range_values,
      baseParams: {
        'fields': fields,
        'start': 0, 'limit': 100,
        'sort': 'endtime', 'dir': 'DESC'
      },
      reader: new Ext.data.JsonReader({
        root:           'objects',
        totalProperty:  'total',
        fields:         fields
      }),
      paramOrder: ['start', 'limit', 'sort', 'dir', 'fields']
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      viewConfig: { forceFit: true },
      title: "Log Entries",
      store: store,
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
            header: 'Zeitpunkt (Ende)',
            dataIndex: 'endtime'
          }, {
            header: 'Befehl',
            dataIndex: 'command'
          }, {
            header: "Exit-Status",
            dataIndex: 'exitcode'
        }]
      }),
      bbar: new Ext.PagingToolbar({
        pageSize: 100,
        store:    store
      })
    }));
    Ext.oa.Cmdlog__LogEntry_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: 'Command Log',
      leaf: true,
      icon: '/filer/static/icons2/22x22/actions/bookmark-new.png',
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
