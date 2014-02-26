/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.define('Ext.oa.Cmdlog__LogEntry_Panel', {
  alias: 'widget.cmdlog__logentry_panel',
  extend: 'Ext.Panel',
  initComponent: function(){
    var fields = ['id', 'command', 'exitcode', 'endtime', 'user'];
    Ext.define('cmdlog_logentry_store_model', {
      extend: 'Ext.data.Model',
      fields: fields
    });
    var store = Ext.create('Ext.data.Store', {
      model: "cmdlog_logentry_store_model",
      pageSize: 100,
      proxy: {
        type: 'direct',
        directFn: cmdlog__LogEntry.filter_range,
        startParam: undefined,
        limitParam: undefined,
        pageParam:  undefined,
        paramOrder: ['start', 'limit', 'sort', 'dir', 'kwds'],
        extraParams: {
          kwds: {
            '__fields__': fields
          },
          'start': 0, 'limit': 100,
          'sort': 'endtime', 'dir': 'DESC'
        },
        reader: new Ext.data.JsonReader({
          root:           'objects',
          totalProperty:  'total',
          fields:         fields
        })
      }
    });
    Ext.define('cmdlog_model', {
      extend: 'Ext.data.Model',
      fields: ['id', 'command', 'exitcode', 'endtime', 'starttime', 'text', {
        name: 'state', mapping: 'exitcode', convert: function( val, row ){
          if( val === 0 ){ return "Success"; }
          if( val === 1 ){ return "Failure"; }
          return "Other";
        }
      }]
    });
    var textStore = Ext.create('Ext.data.Store', {
      model: "cmdlog_model",
      proxy: {
        type: 'direct',
        startParam: undefined,
        limitParam: undefined,
        pageParam:  undefined,
        directFn: cmdlog__LogEntry.get
      }
    });
    var textView = new Ext.DataView({
      tpl: new Ext.XTemplate(
        '<tpl for=".">',
          '<div class="x-panel-header logcommandtitle" style="height: 20px">',
            '<span style="float: right">{starttime} &ndash; {endtime}</span>',
            '{command}: {state} ({exitcode})',
          '</div>',
          '<div class="logcommandtext" style="height: 168px; overflow: auto">',
            '<pre style="white-space: pre-wrap">{text}</pre>',
          '</div>',
        '</tpl>'),
      singleSelect: true,
      region: 'south',
      height: 200,
      deferEmptyText: false,
      emptyText: gettext("Select a log entry to see the command's output here."),
      itemSelector: 'div.logcommandtext',
      loadingText: gettext('Loading...'),
      store: textStore
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "cmdlog__logentry_panel_inst",
      title: gettext('Log Entries'),
      layout: "border",
      items: [{
        xtype: "grid",
        region: "center",
        forceFit: true,
        store: store,
        defaults: {
          sortable: true
        },
        columns: [{
          header: gettext('End time'),
          dataIndex: 'endtime',
          renderer: function(val){
            if(!val) return gettext("unknown");
            return Ext.Date.format(new Date(Date.parse(val)), get_format_ext("SHORT_DATETIME_FORMAT"));
          }
        }, {
          header: gettext('Command'),
          dataIndex: 'command'
        }, {
          header: gettext('User'),
          dataIndex: 'user'
        }, {
          header: gettext('Exit Status'),
          dataIndex: 'exitcode'
        }],
        listeners: {
          cellclick: function( self, td, cellIndex, record, tr, rowIndex, e, eOpts ){
            var record = self.getStore().getAt(rowIndex);
            textStore.load({ params: { id: record.data.id } });
          }
        },
        bbar: new Ext.PagingToolbar({
          afterPageText:  gettext('of {0}'),
          beforePageText: gettext('Page'),
          store:    store,
          items: [ {
            xtype: "textfield",
            id: "cmdlog_search_field",
            deferEmptyText: false,
            emptyText: gettext('Search...'),
            enableKeyEvents: true,
            listeners: {
              change: function( self, newVal, oldVal ){
                if( newVal !== '' ){
                  store.proxy.extraParams.kwds.text__icontains = newVal;
                }
                else{
                  delete store.proxy.extraParams.kwds.text__icontains;
                }
                store.load();
              },
              keypress: function( self, evt ){
                if( typeof window.Cmdlog__LogEntry_search !== "undefined" ){
                  clearTimeout(window.Cmdlog__LogEntry_search);
                }
                if(evt.getKey() === evt.ENTER){
                  self.initialConfig.listeners.change(self, self.getValue());
                }
                else{
                  window.Cmdlog__LogEntry_search = Ext.defer(self.initialConfig.listeners.change,2000, self, [self, self.getValue()]);
                }
              }
            }
          },'->', {
            xtype: 'button',
            text:  gettext('Delete old entries'),
            handler: function(){
              var win = new Ext.Window({
                title: gettext('Delete old entries'),
                layout: "fit",
                height: 300,
                width: 500,
                modal: true,
                items: [{
                  xtype: "form",
                  bodyStyle: "padding:5px 5px;",
                  defaults: {
                    xtype: "textfield",
                    anchor: '-20px'
                  },
                  items: [
                    tipify({
                      fieldLabel: gettext("Date"),
                      allowBlank: false,
                      name:  "date",
                      xtype: 'datefield',
                      itemId:'datefield',
                      listeners: {
                        select: function(self, newValue, eOpts){
                          cmdlog__LogEntry.count_older_than(
                            parseInt(Ext.Date.format(newValue, "U"), 10),
                            function(provider, response){
                              var countlabel = self.ownerCt.getComponent("countlabel")
                              countlabel.setText(
                                interpolate(gettext('%s Entries matched'), [response.result])
                              );
                            }
                          );
                        }
                      }
                    }, gettext('Log Entries newer than the date you enter here will be kept.')
                  ), {
                    xtype:  "label",
                    text:   gettext('Waiting for date selection...'),
                    cls:    "form_hint_label",
                    itemId: "countlabel"
                  }],
                  buttons: [{
                    text: gettext('Delete'),
                    ref:   'shoopmit',
                    handler: function(self){
                      var date = self.ownerCt.ownerCt.getComponent("datefield").getValue();
                      cmdlog__LogEntry.remove_older_than(
                        parseInt(Ext.Date.format(date, "U"), 10),
                        function(provider, response){
                          win.hide();
                          store.load();
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
    this.callParent(arguments);
  },
  onRender: function(){
    this.callParent(arguments)
    this.items.items[0].store.load();
  },
  refresh: function(){
    this.items.items[0].store.load();
  },
  initSearch: function(){
    Ext.get("cmdlog_search_field").focus();
  }
});


Ext.oa.Cmdlog__LogEntry_Module = {
  panel: "cmdlog__logentry_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Command Log'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/actions/bookmark-new.png',
      panel: "cmdlog__logentry_panel_inst"
    });
  }
};

window.MainViewModules.push( Ext.oa.Cmdlog__LogEntry_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
