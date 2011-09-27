Ext.namespace("Ext.oa");

Ext.oa.Cmdlog__LogEntry_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var fields = ['id', 'command', 'exitcode', 'endtime'];
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
    var textStore = new Ext.data.DirectStore({
      fields: ['id', 'command', 'exitcode', 'endtime', 'starttime', 'text', {
        name: 'state', mapping: 'exitcode', convert: function( val, row ){
          if( val === 0 ) return "Success";
          if( val === 1 ) return "Failure";
          return "Other";
        }
      }],
      directFn: cmdlog__LogEntry.get
    });
    var textView = new Ext.DataView({
      tpl: new Ext.XTemplate(
        '<tpl for=".">',
          '<div class="x-panel-header logcommandtitle" style="height: 20px">',
            '<span style="float: right">{starttime} &ndash; {endtime}</span>',
            '{command}: {state} ({exitcode})',
          '</div>',
          '<div class="logcommandtext" style="height: 200px">',
            '<pre style="white-space: pre-wrap">{text}</pre>',
          '</div>',
        '</tpl>'),
      singleSelect: true,
      region: 'south',
      split: true,
      height: 200,
      loadingText: "Select a log entry to see the command's output here.",
      itemSelector: 'div.logcommandtext',
      loadingText: 'Loading...',
      store: textStore
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Log Entries",
      layout: "border",
      items: [{
        xtype: "grid",
        region: "center",
        viewConfig: { forceFit: true },
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
        listeners: {
          cellclick: function( self, rowIndex, colIndex, evt ){
            var record = self.getStore().getAt(rowIndex);
            textStore.load({ params: { id: record.data.id } });
          }
        },
        bbar: new Ext.PagingToolbar({
          pageSize: 100,
          store:    store
        })
      }, textView ]
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
