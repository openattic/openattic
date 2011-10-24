{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Cmdlog__LogEntry_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var fields = ['id', 'command', 'exitcode', 'endtime'];
    var store = new Ext.data.DirectStore({
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
      loadingText: "{% trans "Select a log entry to see the command's output here." %}",
      itemSelector: 'div.logcommandtext',
      loadingText: "{% trans 'Loading...' %}",
      store: textStore
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "cmdlog__logentry_panel_inst",
      title: "{% trans 'Log Entries' %}",
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
              header: "{% trans 'End time' %}",
              dataIndex: 'endtime'
            }, {
              header: "{% trans 'Command' %}",
              dataIndex: 'command'
            }, {
              header: "{% trans 'Exit Status' %}",
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
          store:    store,
          items: ['->', {
            xtype: 'button',
            text:  "{% trans 'Delete old entries' %}",
            handler: function(){
              var win = new Ext.Window({
                title: "{% trans 'Delete old entries' %}",
                layout: "fit",
                height: 300,
                width: 500,
                modal: true,
                items: [{
                  xtype: "form",
                  defaults: {
                    xtype: "textfield",
                    anchor: '-20px'
                  },
                  items: [{
                    fieldLabel: "Date",
                    allowBlank: false,
                    name:  "date",
                    xtype: 'datefield',
                    ref:   'datefield',
                    listeners: {
                      select: function( self, newValue ){
                        cmdlog__LogEntry.count_older_than(
                          parseInt(newValue.format("U")),
                          function(provider, response){
                            self.ownerCt.countlabel.setText(
                              interpolate("{% trans '%s Entries matched' %}", [response.result])
                            );
                          }
                        );
                      }
                    }
                  }, {
                    xtype: "label",
                    text:  "{% trans 'Waiting for date selection...' %}",
                    cls:   "form_hint_label",
                    ref:   "countlabel"
                  }],
                  buttons: [{
                    text: 'Do it',
                    ref:   'shoopmit',
                    handler: function(self){
                      var date = self.ownerCt.ownerCt.datefield.getValue();
                      cmdlog__LogEntry.remove_older_than(
                        parseInt(date.format("U")),
                        function(provider, response){
                          win.hide();
                          store.reload();
                        }
                      );
                    }
                  }]
                }]
              });
              win.show();
            }
          }]
        })
      }, textView ]
    }));
    Ext.oa.Cmdlog__LogEntry_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Cmdlog__LogEntry_Panel.superclass.onRender.apply(this, arguments);
    this.items.items[0].store.reload();
  }
});

Ext.reg("cmdlog__logentry_panel", Ext.oa.Cmdlog__LogEntry_Panel);

Ext.oa.Cmdlog__LogEntry_Module = Ext.extend(Object, {
  panel: "cmdlog__logentry_panel",

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: "{% trans 'Command Log' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/actions/bookmark-new.png',
      panel: "cmdlog__logentry_panel_inst",
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Cmdlog__LogEntry_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
