{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.DragSelector = function(cfg){
  // Based upon Ext.DataView.DragSelector
  cfg = cfg || {};
  var view, proxy, tracker;
  var bodyRegion, graphRegion, dragRegion = new Ext.lib.Region(0,0,0,0);

  this.init = function(dataView){
    view = dataView;
    view.on('render', onRender);
  };

  function cancelClick(){
    return false;
  }

  function onBeforeStart(e){
    graphRegion = view.items.items[0].el.getRegion();
    bodyRegion = new Ext.lib.Region(
      graphRegion.top   + 30, // top
      graphRegion.right - 30, // right
      graphRegion.top   + 30 + view.graphheight, // bottom
      graphRegion.right - 30 - view.graphwidth   // left
    );
    var x = e.xy[0], y = e.xy[1];
    return bodyRegion.contains(new Ext.lib.Region(y,x,y,x));
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
    var startFac = Math.min( Math.max( (startXY[0] - bodyRegion.left) / width, 0. ), 1. );
    var endFac   = Math.min( Math.max( (xy[0] - bodyRegion.left)      / width, 0. ), 1. );

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
    view.loadInterval( view.currentRecord, view.currentId, parseInt(newStart), parseInt(newEnd) );
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
};


Ext.oa.Nagios__Graph_ImagePanel = Ext.extend(Ext.Panel, {
  graphcolors: {
    {% if PROFILE.theme != "access" %}
    bgcol: 'FFFFFF',
    grcol: '',
    fgcol: '111111',
    sacol: 'FFFFFF',
    sbcol: 'FFFFFF'
    {% else %}
    bgcol: '1F2730',
    grcol: '222222',
    fgcol: 'FFFFFF',
    sacol: '1F2730',
    sbcol: '1F2730'
    {% endif %}
  },
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
      items: new Ext.BoxComponent({
        autoEl: {
          tag: "img",
          src: MEDIA_URL + "/extjs/resources/images/default/s.gif"
        },
        listeners: {
          render: function(self){
            self.el.on("load", function(ev, target, options){
              this.ownerCt.doLayout();
              this.ownerCt.el.unmask();
            }, self);
            self.el.on("error", function(ev, target, options){
              this.ownerCt.el.unmask();
              this.ownerCt.el.mask("{% trans 'Image not available yet' %}");
            }, self);
            self.el.on("dblclick", function(ev, target, options){
              this.loadRecord(this.currentRecord, this.currentId);
            }, self.ownerCt);
          }
        }
      })
    }));
    Ext.oa.Nagios__Graph_ImagePanel.superclass.initComponent.apply(this, arguments);
    this.on( "afterrender", function(){
      // Wait until the <img> element has actually been created, then reload the record
      this.items.items[0].on( "afterrender", function(){
        if( this.currentRecord ){
          this.loadRecord( this.currentRecord, this.currentId );
        }
      }, this );
    }, this );
  },

  loadInterval: function(record, id, start, end){
    var params = {};
    Ext.apply(params, this.graphcolors);

    Ext.apply(params, {
      start: start || parseInt((new Date().getTime() / 1000) - this.timespan),
      grad:  Ext.state.Manager.get("nagios_graph_grad", false).toString(),
      width: this.graphwidth,
      height: this.graphheight
    });

    this.currStart = params["start"];
    if( end ){
      params["end"] = end;
      this.currEnd  = end;
    }
    else
      this.currEnd  = 0;

    this.el.mask("{% trans 'Loading...' %}");
    var url = String.format( PROJECT_URL + "/nagios/{0}/{1}.png?{2}", record.data.id, id, Ext.urlEncode(params) );
    this.items.items[0].el.dom.src = url;
  },

  loadRecord: function(record, id){
    this.currentRecord = record;
    this.currentId = id;
    if( this.el ){
      this.loadInterval(record, id);
      if( this.reloadInterval ){
        if( this.reloadTimerId != 0 )
          clearTimeout(this.reloadTimerId);
        this.reloadTimerId = this.loadRecord.defer(this.reloadInterval*1000, this, [this.currentRecord, this.currentId]);
      }
    }
  }
});

Ext.reg("naggraphimage", Ext.oa.Nagios__Graph_ImagePanel);


Ext.oa.Nagios__Graph_ImagePortlet = Ext.extend(Ext.ux.Portlet, {
  initComponent: function(){
    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      bodyCssClass: "nagiosportlet",
      items: {
        xtype: "naggraphimage",
        reloadInterval: 300,
        timespan: 4*60*60,
        height: 265,
        graphwidth: 230
      }
    }));
    if( this.recordId && this.graphId ){
      Ext.applyIf( this.items, {
        currentRecord: { data: { id: this.recordId } },
        currentId: this.graphId
      });
    }
    Ext.oa.Nagios__Graph_ImagePortlet.superclass.initComponent.apply(this, arguments);
  },

  onClose: function(){
    Ext.oa.Nagios__Graph_ImagePortlet.superclass.onClose.apply(this, arguments);
    var portletstate = Ext.state.Manager.get( "nagios_portlets", [] );
    for( var i = 0; i < portletstate.length; i++ ){
      if( "portlet_nagios_" + portletstate[i].id === this.id ){
        portletstate.remove(portletstate[i]);
        break;
      }
    }
    Ext.state.Manager.set( "nagios_portlets", portletstate );
  }
});

Ext.reg("naggraphportlet", Ext.oa.Nagios__Graph_ImagePortlet);


Ext.oa.Nagios__Service_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var nagiosGrid = this;
    var renderDate = function(val, x, store){
      return new Date(val * 1000);
    };
    var stateicons = {
      0: MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png',
      1: MEDIA_URL + '/oxygen/16x16/status/dialog-warning.png',
      2: MEDIA_URL + '/oxygen/16x16/status/dialog-error.png',
      NaN: MEDIA_URL + '/oxygen/16x16/categories/system-help.png'
    };
    var renderDesc = function( val, x, store ){
      return '<img src="' + stateicons[parseInt(store.data.current_state)] + '" /> ' + val;
    };

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "nagios__service_panel_inst",
      title: "{% trans 'Nagios Services' %}",
      layout: "border",
      buttons: [ {
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          nagiosGrid.items.items[0].store.reload();
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
                    xtype: "naggraphportlet",
                    title: text,
                    id: "portlet_nagios_" + portletid,
                    recordId: record.data.id,
                    graphId:  graph.id
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
        loadMask: true,
        viewConfig: { forceFit: true },
        store: {
          xtype: 'directstore',
          fields: ['id', 'description', {
            name: "volumename",    mapping: "volume", convert: function(val, row){ if(val) return val.name; }
          }, {
            name: "plugin_output", mapping: "state",  convert: function(val, row){ if(val) return val.plugin_output; }
          }, {
            name: "current_state", mapping: "state",  convert: function(val, row){ if(val) return val.current_state; }
          }, {
            name: "last_check",    mapping: "state",  convert: function(val, row){ if(val) return val.last_check; }
          }, {
            name: "next_check",    mapping: "state",  convert: function(val, row){ if(val) return val.next_check; }
          }],
          directFn: nagios__Service.all
        },
        colModel: new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: "{% trans 'Service Description' %}",
            width: 200,
            dataIndex: "description",
            renderer: renderDesc
          }, {
            header: "{% trans 'Plugin Output' %}",
            width: 200,
            dataIndex: "plugin_output"
          }, {
            header: "{% trans 'Volume' %}",
            width: 100,
            dataIndex: "volumename"
          }, {
            header: "{% trans 'Last Check' %}",
            width: 120,
            dataIndex: "last_check",
            renderer: renderDate
          }, {
            header: "{% trans 'Next Check' %}",
            width: 120,
            dataIndex: "next_check",
            renderer: renderDate
          }]
        }),
        listeners: {
          cellmousedown: function( self, rowIndex, colIndex, evt ){
            var record = self.getStore().getAt(rowIndex);
            if( !record.json.graphs || record.json.graphs.length === 0 )
              return;
            self.ownerCt.items.items[1].items.items[1].getSelectionModel().clearSelections();
            self.ownerCt.items.items[1].loadRecord(record);
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
            xtype: "naggraphimage",
            title: "{% trans '4 hours' %}",
            timespan: 4*60*60,
            reloadInterval: 300
          }, {
            xtype: "naggraphimage",
            title: "{% trans '1 day' %}",
            timespan: 24*60*60
          }, {
            xtype: "naggraphimage",
            title: "{% trans '1 week' %}",
            timespan: 7*24*60*60
          }, {
            xtype: "naggraphimage",
            title: "{% trans '1 month' %}",
            timespan: 30*24*60*60
          }, {
            xtype: "naggraphimage",
            title: "{% trans '1 year' %}",
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
          title: "{% trans 'Graphs' %}",
          xtype:  'grid',
          width: 160,
          viewConfig: { forceFit: true },
          store: new Ext.data.JsonStore({
            fields: ["id", "title"]
          }),
          colModel: new Ext.grid.ColumnModel({
            columns: [{
              header: "{% trans 'Graph' %}",
              dataIndex: "title"
            } ]
          }),
          listeners: {
            cellclick: function( self, rowIndex, colIndex, evt ){
              var record = self.getStore().getAt(rowIndex);
              self.ownerCt.items.items[0].loadRecord(self.currentRecord, record.data);
            }
          },
          loadRecord: function( record ){
            this.currentRecord = record;
            this.store.loadData( record.json.graphs );
            this.ownerCt.items.items[0].loadRecord(record, record.json.graphs[0]);
          }
        }],
        loadRecord: function( record ){
          this.items.items[1].loadRecord( record );
        }
      }]
    }));
    Ext.oa.Nagios__Service_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Nagios__Service_Panel.superclass.onRender.apply(this, arguments);
    this.items.items[0].store.reload();
  }
});

Ext.reg("nagios__service_panel", Ext.oa.Nagios__Service_Panel);

Ext.oa.Nagios__Service_Module = Ext.extend(Object, {
  panel: "nagios__service_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: "{% trans 'Monitoring' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: "nagios__service_panel_inst",
      href: '#'
    });
  },

  getDashboardPortlets: function(tools){
    var portletstate = Ext.state.Manager.get( "nagios_portlets", [] );
    var portlets = [];
    for( var i = 0; i < portletstate.length; i++ ){
      portlets.push( {
        xtype: "naggraphportlet",
        title: portletstate[i].title,
        id: 'portlet_nagios_' + portletstate[i].id,
        tools: tools,
        recordId: portletstate[i].recordid,
        graphId:  portletstate[i].graphid
      } );
    }
    return portlets;
  }
});


window.MainViewModules.push( new Ext.oa.Nagios__Service_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
