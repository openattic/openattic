{% comment %}
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
{% endcomment %}

Ext.namespace("Ext.oa");

Ext.oa.DragSelector = function(cfg){
  // Based upon Ext.DataView.DragSelector
  cfg = cfg || {};
  var view, proxy, tracker;
  var bodyRegion, graphRegion, dragRegion = new Ext.util.Region(0,0,0,0);

  function cancelClick(){
    return false;
  }

  function onBeforeStart(e){
    graphRegion = view.items.items[0].el.getRegion();
    bodyRegion = new Ext.util.Region(
      graphRegion.top   + 30, // top
      graphRegion.right - 30, // right
      graphRegion.top   + 30 + view.graphheight, // bottom
      graphRegion.right - 30 - view.graphwidth   // left
    );
    var x = e.xy[0], y = e.xy[1];
    return bodyRegion.contains(new Ext.util.Region(y,x,y,x));
  }

  function onStart(e){
    view.on('containerclick', cancelClick, view, {single:true});
    if(!proxy){
      proxy = view.el.createChild({cls:'x-view-selector'});
    }else{
      if(proxy.dom.parentNode !== view.el.dom){
        view.el.dom.appendChild(proxy.dom);
      }
      proxy.setDisplayed('block');
    }
  }

  function onDrag(e){
    var startXY = tracker.startXY;
    var xy = tracker.getXY();

    var x = Math.min(startXY[0], xy[0]);
    var y = Math.min(startXY[1], xy[1]);
    var w = Math.abs(startXY[0] - xy[0]);
    var h = Math.abs(startXY[1] - xy[1]);

    dragRegion.left = x;
    dragRegion.top = graphRegion.top;
    dragRegion.right = x+w;
    dragRegion.bottom = graphRegion.bottom;

    dragRegion.constrainTo(bodyRegion);
    proxy.setRegion(dragRegion);
  }

  function onEnd(e){
    if (!Ext.isIE) {
      view.un('containerclick', cancelClick, view);
    }
    if(proxy){
      proxy.setDisplayed(false);
    }
    var startXY = tracker.startXY;
    var xy = tracker.getXY();

    var width = bodyRegion.right - bodyRegion.left;
    var startFac = Math.min( Math.max( (startXY[0] - bodyRegion.left) / width, 0.0 ), 1.0 );
    var endFac   = Math.min( Math.max( (xy[0] - bodyRegion.left)      / width, 0.0 ), 1.0 );

    var currStart = view.currStart,
      currEnd   = view.currEnd || currStart + view.timespan,
      currSpan  = currEnd - currStart,
      newStart  = currStart + (currSpan * startFac),
      newEnd    = currStart + (currSpan * endFac);

    if( newStart > newEnd ){
      var tmp = newEnd;
      newEnd = newStart;
      newStart = tmp;
    }
    view.loadInterval( view.currentRecord, view.currentId, parseInt(newStart, 10), parseInt(newEnd, 10) );
  }

  function onRender(view){
    tracker = new Ext.dd.DragTracker({
      onBeforeStart: onBeforeStart,
      onStart: onStart,
      onDrag: onDrag,
      onEnd: onEnd
    });
    tracker.initEl(view.el);
  }

  this.init = function(dataView){
    view = dataView;
    view.on('render', onRender);
  };
};


Ext.define('Ext.oa.Nagios__Graph_ImagePanel', {
  alias: 'widget.nagios__graph_imagepanel',
  extend: 'Ext.Panel',
  graphcolors: ( "{{ PROFILE.theme }}" !== "access" ? {
    bgcol: 'FFFFFF',
    grcol: '',
    fgcol: '111111',
    sacol: 'FFFFFF',
    sbcol: 'FFFFFF'
  } : {
    bgcol: '1F2730',
    grcol: '222222',
    fgcol: 'FFFFFF',
    sacol: '1F2730',
    sbcol: '1F2730'
  }),
  reloadTimerId: 0,
  initComponent: function(){
    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      reloadInterval: 0,
      graphheight: 150,
      graphwidth:  700,
      currStart: 0,
      currEnd: 0,
      layout: "vbox",
      layoutConfig: { "align": "center" },
      plugins: [ new Ext.oa.DragSelector() ],
      items: Ext.create("Ext.Component", {
        autoEl: {
          tag: "img",
          src: MEDIA_URL + "/extjs/resources/themes/images/default/tree/s.gif"
        },
        listeners: {
          render: function(self){
            self.el.on("load", function(ev, target, options){
              this.ownerCt.doLayout();
              this.ownerCt.el.unmask();
            }, self);
            self.el.on("error", function(ev, target, options){
              this.ownerCt.el.unmask();
              this.ownerCt.el.mask(gettext('Image not available yet'));
            }, self);
            self.el.on("dblclick", function(ev, target, options){
              this.loadRecord(this.currentRecord, this.currentId);
            }, self.ownerCt);
          },
          afterrender: function(){
            // Wait until the <img> element has actually been created, then reload the record
            if( this.ownerCt.currentRecord ){
              this.ownerCt.reload();
            }
          }
        }
      })
    }));
    this.callParent(arguments);
    this.on( "afterrender", function(){
      var self = this;
      if( this.reloadInterval ){
        Ext.defer(
          function(){
            window.mainpanel.on("switchedComponent", function(cmp){
              if(cmp.id === "dashboard_inst" || cmp.id === "nagios__service_panel_inst"){
                self.doLayout();
              }
            });
          }, 25);
      }
    }, this );
  },

  loadInterval: function(record, id, start, end){
    var params = {};
    Ext.apply(params, this.graphcolors);

    Ext.apply(params, {
      start: start || parseInt((new Date().getTime() / 1000) - this.timespan, 10),
      grad:  Ext.state.Manager.get("nagios_graph_grad", false).toString(),
      width: this.graphwidth,
      height: this.graphheight
    });

    this.currStart = params.start;
    if( end ){
      params.end   = end;
      this.currEnd = end;
    }
    else{
      this.currEnd  = 0;
    }

    this.el.mask(gettext('Loading...'));
    var url = Ext.String.format( PROJECT_URL + "/nagios/{0}/{1}.png?{2}", record.data.id, id, Ext.urlEncode(params) );
    this.items.items[0].el.dom.src = url;
  },

  loadRecord: function(record, id){
    this.currentRecord = record;
    this.currentId = id;
    if( this.el ){
      this.loadInterval(record, id);
      if( this.reloadInterval ){
        if( this.reloadTimerId !== 0 ){
          clearTimeout(this.reloadTimerId);
        }
        this.reloadTimerId = Ext.defer(this.loadRecord,
          this.reloadInterval*1000, this, [this.currentRecord, this.currentId]);
      }
    }
  },

  reload: function(){
    this.loadRecord(this.currentRecord, this.currentId);
  }
});


Ext.define('Ext.oa.Nagios__Graph_ImagePortlet', {
  alias: 'widget.nagios__graph_imageportlet',
  extend: 'Ext.app.Portlet',
  initComponent: function(){
    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      bodyCls: "nagiosportlet",
      items: {
        xtype: 'nagios__graph_imagepanel',
        reloadInterval: 300,
        timespan: 4*60*60,
        height: 265,
        graphwidth: 230
      }
    }));
    if( this.recordId && typeof this.graphId !== "undefined" ){
      Ext.applyIf( this.items, {
        currentRecord: { data: { id: this.recordId } },
        currentId: this.graphId
      });
    }
    this.callParent(arguments);
  },

  onClose: function(){
    this.callParent(arguments);
    var portletstate = Ext.state.Manager.get( "nagios_portlets", [] ),
        i;
    for( i = 0; i < portletstate.length; i++ ){
      if( "portlet_nagios_" + portletstate[i].id === this.id ){
        portletstate.remove(portletstate[i]);
        break;
      }
    }
    Ext.state.Manager.set( "nagios_portlets", portletstate );
  }
});


Ext.define('Ext.oa.Nagios__Service_Panel', {
  alias: 'widget.nagios__service_panel',
  extend: 'Ext.Panel',
  initComponent: function(){
    var nagiosGrid = this;
    var renderDate = function(val, x, store){
      if(!val) return gettext("unknown");
      var date = new Date(val * 10000);
      return Ext.Date.format(date, get_format_ext("SHORT_DATETIME_FORMAT"));
    };
    var stateicons = {
      0: MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png',
      1: MEDIA_URL + '/oxygen/16x16/status/dialog-warning.png',
      2: MEDIA_URL + '/oxygen/16x16/status/dialog-error.png',
      3: MEDIA_URL + '/oxygen/16x16/categories/system-help.png',
      "NaN": MEDIA_URL + '/oxygen/16x16/categories/system-help.png'
    };
    var renderDesc = function( val, x, store ){
      return '<img src="' + stateicons[parseInt(store.data.current_state, 10)] + '" /> ' + val;
    };

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "nagios__service_panel_inst",
      title: gettext('Nagios Services'),
      layout: "border",
      border: false,
      buttons: [ {
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          nagiosGrid.items.items[0].store.load();
        }
      }, {
        text: "Dashboard",
        icon: MEDIA_URL + '/icons2/16x16/apps/gnome-session.png',
        handler: function(self){
          var dashboard = mainpanel.find( "id", "dashboard_inst" )[0];
          var graphpanel = nagiosGrid.find("id", "naggraphpanel")[0];
          if( graphpanel.currentRecord && graphpanel.currentGraph ){
            var record = graphpanel.currentRecord;
            var graph  = graphpanel.currentGraph;
            Ext.Msg.prompt(
              "Create Nagios portlet",
              "Please enter the title for the new Portlet.",
              function(btn, text){
                if( btn === "ok" ){
                  var portletstate = Ext.state.Manager.get( "nagios_portlets", [] );
                  var portletid = record.data.id + "_" + graph.id;
                  portletstate.push({
                    id:       portletid,
                    recordid: record.data.id,
                    graphid:  graph.id,
                    title:    text
                  });
                  Ext.state.Manager.set( "nagios_portlets", portletstate );
                  dashboard.makePortlet({
                    xtype: 'nagios__graph_imageportlet',
                    title: text,
                    id: "portlet_nagios_" + portletid,
                    recordId: record.data.id,
                    graphId:  graph.id,
                    tools: (function(){
                      var mytools = dashboard.portletTools.slice();
                      mytools.unshift({
                        id: 'refresh',
                        handler: function(ev, btn, portlet, self){
                          portlet.items.items[0].reload();
                        }
                      });
                      return mytools;
                    }()),
                  });
                }
              },
              this, false,
              graphpanel.currentRecord.data.description + " - " + graphpanel.currentGraph.title
            );
          }
        }
      } ],
      items: [ {
        xtype: 'grid',
        region: "center",
        selModel: { mode: "SINGLE" },
        border: false,
        loadMask: true,
        forceFit: true,
        store: {
          proxy: {
            type: "direct",
            directFn: nagios__Service.filter,
            startParam: undefined,
            limitParam: undefined,
            pageParam:  undefined
          },
          fields: ['id', 'description', {
            name: "targetname",
            mapping: "target",
            convert: toUnicode
          }, {
            name: "hostname",
            mapping: "host",
            convert: toUnicode
          }, {
            name: "plugin_output",
            mapping: "state",
            convert: function(val){
              if(val){
                return val.plugin_output;
              }
            }
          }, {
            name: "current_state",
            mapping: "state",
            convert: function(val){
              if(val){
                return val.current_state;
              }
            }
          }, {
            name: "last_check",
            mapping: "state",
            convert: function(val, row){
              if(val && val.last_check && val.last_check !== "0"){
                return val.last_check;
              }
              return null;
            }
          }, {
            name: "next_check",
            mapping: "state",
            convert: function(val, row){
              if(val && val.next_check){
                return val.next_check;
              }
              return null;
            }
          }]
        },
        defaults: {
          sortable: true
        },
        columns: [{
          header: gettext('Service Description'),
          width: 200,
          dataIndex: "description",
          renderer: renderDesc
        }, {
          header: gettext('Plugin Output'),
          width: 200,
          dataIndex: "plugin_output"
        }, {
          header: gettext('Target'),
          width: 100,
          dataIndex: "targetname"
        }, {
          header: gettext('Host'),
          width: 100,
          dataIndex: "hostname"
        }, {
          header: gettext('Last Check'),
          width: 120,
          dataIndex: "last_check",
          renderer: renderDate
        }, {
          header: gettext('Next Check'),
          width: 120,
          dataIndex: "next_check",
          renderer: renderDate
        }],
        listeners: {
          itemmousedown: function( self, record ){
            if( !record.raw.graphs || record.raw.graphs.length === 0 ){
              self.ownerCt.items.items[1].getEl().mask(
                gettext('No performance data available for service') + "<br />" +
                "<center>" + record.data.description + "</center>"
              );
            }
            else{
              self.ownerCt.ownerCt.items.items[2].getEl().unmask();
              self.ownerCt.ownerCt.items.items[2].items.items[1].getSelectionModel().clearSelections();
              self.ownerCt.ownerCt.items.items[2].loadRecord(record);
            }
          }
        }
      }, {
        region: "south",
        layout: "border",
        border: false,
        height: Ext.state.Manager.get( "nagios_graphpanel_height", 300 ),
        split: true,
        listeners: {
          resize: function( self, adjW, adjH, rawW, rawH ){
            Ext.state.Manager.set( "nagios_graphpanel_height", adjH );
          }
        },
        items: [{
          xtype: "tabpanel",
          region: "center",
          activeTab: 0,
          border: false,
          id: 'naggraphpanel',
          items: [{
            xtype: "nagios__graph_imagepanel",
            title: gettext('4 hours'),
            timespan: 4*60*60,
            reloadInterval: 300
          }, {
            xtype: "nagios__graph_imagepanel",
            title: gettext('1 day'),
            timespan: 24*60*60
          }, {
            xtype: "nagios__graph_imagepanel",
            title: gettext('1 week'),
            timespan: 7*24*60*60
          }, {
            xtype: "nagios__graph_imagepanel",
            title: gettext('1 month'),
            timespan: 30*24*60*60
          }, {
            xtype: "nagios__graph_imagepanel",
            title: gettext('1 year'),
            timespan: 365*24*60*60
          }],
          loadRecord: function( record, graph ){
            this.currentRecord = record;
            this.currentGraph = graph;
            this.items.each( function(item){
              item.loadRecord( record, graph.id );
            } );
          }
        }, {
          region: "west",
          title: gettext('Graphs'),
          xtype:  'grid',
          selModel: { mode: "SINGLE" },
          width: 160,
          forceFit: true,
          store: (function(){
            var store = new Ext.data.ArrayStore({
              fields: ["id", "title"],
              sorters: [{property: "title", direction: "ASC"}]
            });
            return store;
          }()),
          columns: [{
            header: gettext('Graph'),
            dataIndex: "title"
          }],
          listeners: {
            itemmousedown: function( self, record ){
              self.ownerCt.ownerCt.items.items[0].loadRecord(self.ownerCt.currentRecord, record.data);
            }
          },
          loadRecord: function( record ){
            this.currentRecord = record;
            this.store.loadData( record.raw.graphs );
            this.ownerCt.items.items[0].loadRecord(record, record.raw.graphs[0]);
          }
        }],
        loadRecord: function( record ){
          this.items.items[1].loadRecord( record );
        }
      }],
      bbar: {
        xtype: 'toolbar',
        hidden: true,
        items: ["Search:", {
          xtype: 'textfield',
          deferEmptyText: false,
          emptyText: gettext('Search...'),
          enableKeyEvents: true,
          listeners: {
            change: function( fld, newVal, oldVal ){
              if( typeof nagiosGrid.searchTimeout !== "undefined" ){
                clearTimeout(nagiosGrid.searchTimeout);
              }
              if( newVal !== '' ){
                nagiosGrid.items.items[0].store.proxy.extraParams["description__icontains"] = newVal;
              }
              else{
                delete nagiosGrid.items.items[0].store.proxy.extraParams["description__icontains"];
              }
              nagiosGrid.items.items[0].store.load();
            },
            keypress: function( fld, evt ){
              if( typeof nagiosGrid.searchTimeout !== "undefined" ){
                clearTimeout(nagiosGrid.searchTimeout);
              }
              if(evt.getKey() === evt.ENTER){
                fld.initialConfig.listeners.change.apply(nagiosGrid, [fld, fld.getValue()]);
              }
              else if(evt.getKey() === evt.ESC){
                fld.initialConfig.listeners.change.apply(nagiosGrid, [fld, '']);
                nagiosGrid.bottomToolbar.hide();
                nagiosGrid.doLayout();
              }
              else{
                nagiosGrid.searchTimeout = Ext.defer(fld.initialConfig.listeners.change, 2000, nagiosGrid, [fld, fld.getValue()]);
              }
            }
          }
        }, {
          xtype: 'button',
          icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
          handler: function(){
            var fld = nagiosGrid.bottomToolbar.items.items[1];
            fld.initialConfig.listeners.change.apply(nagiosGrid, [fld, '']);
            nagiosGrid.bottomToolbar.hide();
            nagiosGrid.doLayout();
          }
        }]
      }
    }));
    this.callParent(arguments);
  },
  refresh: function(){
    this.items.items[0].store.load();
  },
  onRender: function(){
    this.callParent(arguments);
    this.items.items[0].store.load();
  },
  initSearch: function(){
    this.bottomToolbar.show();
    this.bottomToolbar.items.items[1].focus();
  }
});


Ext.oa.Nagios__Service_Module = {
  panel: "nagios__service_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Monitoring'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: "nagios__service_panel_inst"
    });
  },

  getDashboardPortlets: function(tools){
    var portletstate = Ext.state.Manager.get( "nagios_portlets", [] ),
        portlets = [],
        i;
    for( i = 0; i < portletstate.length; i++ ){
      portlets.push( {
        xtype: 'nagios__graph_imageportlet',
        title: portletstate[i].title,
        id: 'portlet_nagios_' + portletstate[i].id,
        tools: (function(){
          var mytools = tools.slice();
          mytools.unshift({
            id: 'refresh',
            handler: function(ev, btn, portlet, self){
              portlet.items.items[0].reload();
            }
          });
          return mytools;
        }()),
        recordId: portletstate[i].recordid,
        graphId:  portletstate[i].graphid
      } );
    }
    return portlets;
  }
};


window.MainViewModules.push( Ext.oa.Nagios__Service_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
