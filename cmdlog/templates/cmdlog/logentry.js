/*
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.oa.Cmdlog__LogEntry_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";
    var fields = ['id', 'command', 'exitcode', 'endtime', 'user'];
    var store = new Ext.data.DirectStore({
      remoteSort: true,
      fields: fields,
      directFn: cmdlog__LogEntry.filter_range,
      baseParams: {
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
      }),
      paramOrder: ['start', 'limit', 'sort', 'dir', 'kwds']
    });
    var textStore = new Ext.data.DirectStore({
      fields: ['id', 'command', 'exitcode', 'endtime', 'starttime', 'text', {
        name: 'state', mapping: 'exitcode', convert: function( val, row ){
          if( val === 0 ){ return "Success"; }
          if( val === 1 ){ return "Failure"; }
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
          '<div class="logcommandtext" style="height: 168px; overflow: auto">',
            '<pre style="white-space: pre-wrap">{text}</pre>',
          '</div>',
        '</tpl>'),
      singleSelect: true,
      region: 'south',
      height: 200,
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
        viewConfig: {
          forceFit: true
        },
        store: store,
        colModel: new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
              header: gettext('End time'),
              dataIndex: 'endtime'
            }, {
              header: gettext('Command'),
              dataIndex: 'command'
            }, {
              header: gettext('User'),
              dataIndex: 'user'
            }, {
              header: gettext('Exit Status'),
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
          afterPageText:  gettext('of {0}'),
          beforePageText: gettext('Page'),
          store:    store,
          items: [ {
            xtype: "textfield",
            emptyText: gettext('Search...'),
            enableKeyEvents: true,
            listeners: {
              change: function( self, newVal, oldVal ){
                if( newVal !== '' ){
                  store.baseParams.kwds.text__icontains = newVal;
                }
                else{
                  delete store.baseParams.kwds.text__icontains;
                }
                store.reload();
              },
              keypress: function( self, evt ){
                if( typeof window.Cmdlog__LogEntry_search !== "undefined" ){
                  clearTimeout(window.Cmdlog__LogEntry_search);
                }
                if(evt.getKey() === evt.ENTER){
                  self.initialConfig.listeners.change(self, self.getValue());
                }
                else{
                  window.Cmdlog__LogEntry_search = self.initialConfig.listeners.change.defer(2000, self, [self, self.getValue()]);
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
                      ref:   'datefield',
                      listeners: {
                        select: function( self, newValue ){
                          cmdlog__LogEntry.count_older_than(
                            parseInt(newValue.format("U"), 10),
                            function(provider, response){
                              self.ownerCt.countlabel.setText(
                                interpolate(gettext('%s Entries matched'), [response.result])
                              );
                            }
                          );
                        }
                      }
                    }, gettext('Log Entries newer than the date you enter here will be kept.')
                  ), {
                    xtype: "label",
                    text:  gettext('Waiting for date selection...'),
                    cls:   "form_hint_label",
                    ref:   "countlabel"
                  }],
                  buttons: [{
                    text: gettext('Delete'),
                    ref:   'shoopmit',
                    handler: function(self){
                      var date = self.ownerCt.ownerCt.datefield.getValue();
                      cmdlog__LogEntry.remove_older_than(
                        parseInt(date.format("U"), 10),
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
    "use strict";
    Ext.oa.Cmdlog__LogEntry_Panel.superclass.onRender.apply(this, arguments);
    this.items.items[0].store.reload();
  }
});

Ext.reg("cmdlog__logentry_panel", Ext.oa.Cmdlog__LogEntry_Panel);

Ext.oa.Cmdlog__LogEntry_Module = Ext.extend(Object, {
  panel: "cmdlog__logentry_panel",

  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Command Log'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/actions/bookmark-new.png',
      panel: "cmdlog__logentry_panel_inst",
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Cmdlog__LogEntry_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
