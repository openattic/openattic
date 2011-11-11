Ext.namespace("Ext.oa");

Ext.oa.Portal = Ext.extend(Ext.ux.Portal, {
  initComponent: function(){
    var tools = [{
      id: 'gear',
      handler: function(){
        Ext.Msg.alert('Message', 'The Settings tool was clicked.');
      }
    },{
      id: 'close',
      handler: function(e, target, panel){
        panel.ownerCt.remove(panel, true);
      }
    }];
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "masterportalofduhm",
      region:'center',
      margins:'35 5 5 0',
      items: (function(){
        var state = Ext.state.Manager.get("portalstate",
          [["portlet_lvs", "portlet_nfs"], ["portlet_cpu", "portlet_iops_itcosm3"], ["portlet_ram", "portlet_iops_sdb"]]);
        var all_portlets = [{
          title: 'LVs',
          layout:'fit',
          id: 'portlet_lvs',
          tools: tools,
          items: new Ext.grid.GridPanel({
            height: 250,
            viewConfig: { forceFit: true },
            split: true,
            store: (function(){
              // Anon function that is called immediately to set up the store's DefaultSort
              var store = new Ext.data.DirectStore({
                autoLoad: true,
                fields: ['name', 'megs', 'filesystem',  'formatted', 'id', 'state', 'fs', {
                  name: 'fsused',
                  mapping: 'fs',
                  sortType: 'asInt',
                  convert: function( val, row ){
                    if( val === null || typeof val.stat === "undefined" )
                      return '';
                    return (val.stat.used / val.stat.size * 100 ).toFixed(2);
                  }
                }],
                directFn: lvm__LogicalVolume.all
              });
              store.setDefaultSort("fsused", "DESC");
              return store;
            }()),
            colModel:  new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [{
                header: "LV",
                width: 200,
                dataIndex: "name"
              }, {
                header: "Size",
                width: 75,
                dataIndex: "megs",
                align: 'right',
                renderer: function( val, x, store ){
                  return String.format("{0} GB", (val / 1000).toFixed(2));
                }
              }, {
                header: "Used",
                width: 75,
                dataIndex: "fsused",
                align: 'right',
                renderer: function( val, x, store ){
                  if( !val )
                    return '';
                  if( val > Ext.state.Manager.get("lv_red_threshold", 90.0) )
                    var color = "red";
                  else
                    var color = "green";
                  return String.format('<span style="color:{1};">{0}%</span>', val, color);
                }
              }]
            })
          })
        }, {
          title: 'NFS',
          layout:'fit',
          id: 'portlet_nfs',
          tools: tools,
          items: new Ext.grid.GridPanel({
          height: 320,
          split: true,
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
          })
        }, {
          title: 'CPU Stats',
          id: 'portlet_cpu',
          tools: tools,
          height: 300,
          items: (function(){
            var chart = new Ext.canvasXpress({
              options: {
                graphType: 'Pie',
                background: 'rgb(244,244,244)',
                colorScheme: 'pastel',
                pieSegmentPrecision:  0,
                pieSegmentSeparation: 0,
                pieSegmentLabels: 'inside',
                pieType: 'solid'
              },
              data: {y: {
                vars:  ['a', 'b'],
                smps:  ['CPU'],
                data:  [[1], [2]]
              }},
              events: { click: function(){} }
            });
            hoststats__HostStats.get_cpu(function(provider, result){
              if(result.result){
                var conf = {
                  smps: ['CPU'],
                  vars: [],
                  data: []
                }
                for( var key in result.result ){
                  if( key === "time_taken" ) continue;
                  if( result.result[key] < 0.5 ) continue;
                  conf.vars.push(key);
                  conf.data.push([result.result[key]]);
                }
                chart.canvas.updateData({ y: conf });
              }
            });
            return chart;
          }())
        }, {
          title: 'RAM Stats',
          id: 'portlet_ram',
          tools: tools,
          height: 300,
          items: (function(){
            var chart = new Ext.canvasXpress({
              options: {
                graphType: 'Pie',
                background: 'rgb(244,244,244)',
                colorScheme: 'pastel',
                pieSegmentPrecision:  0,
                pieSegmentSeparation: 0,
                pieSegmentLabels: 'inside',
                pieType: 'solid'
              },
              data: {y: {
                vars:  ['a', 'b'],
                smps:  ['RAM'],
                data:  [[1], [2]]
              }},
              events: { click: function(){} }
            });
            hoststats__HostStats.get_mem(function(provider, result){
              if(result.result){
                var conf = {
                  smps: ['RAM'],
                  vars: [],
                  data: []
                }
                for( var key in result.result ){
                  conf.vars.push(key);
                  conf.data.push([result.result[key]]);
                }
                chart.canvas.updateData({ y: conf });
              }
            });
            chart.on("leftclick", function(){});
            return chart;
          }())
        }, {
          title: 'itc_osm3 I/O',
          id: 'portlet_iops_itcosm3',
          tools: tools,
          items: {
            xtype: "naggraphimage",
            title: "4 hours",
            timespan: 4*60*60,
            height: 280,
            title: false,
            graphwidth: 230,
            currentRecord: { data: { id: 39 } },
            currentId: 1
          }
        }, {
          title: 'sdb I/O',
          id: 'portlet_iops_sdb',
          tools: tools,
          items: {
            xtype: "naggraphimage",
            title: "4 hours",
            timespan: 4*60*60,
            height: 280,
            title: false,
            graphwidth: 230,
            currentRecord: { data: { id: 90 } },
            currentId: 1
          }
        }];
        var items = [];
        // For each column...
        for( var c = 0; c < state.length; c++ ){
          var colitems = [];
          // for each portlet in this column's state...
          for( var p = 0; p < state[c].length; p++ ){
            // find this portlet in the all_portlets list and add it to this column
            for( var i = 0; i < all_portlets.length; i++ ){
              if( all_portlets[i].id === state[c][p] ){
                colitems.push(all_portlets[i]);
              }
            }
          }
          // now add a column wrapper for this column
          items.push({
            columnWidth:.33,
            style:'padding:10px 0 10px 10px',
            items: colitems
          });
        }
        return items;
      }())
    }));
    Ext.oa.Portal.superclass.initComponent.apply(this, arguments);
    this.on("drop", function(e){
      var portal = this;
      var state = [];
      for( var c = 0; c < portal.items.getCount(); c++ ){
        var colIds = [];
        var col = portal.items.get(c);
        for( var p = 0; p < col.items.getCount(); p++ ){
          colIds.push(col.items.get(p).id);
        }
        state.push(colIds);
      }
      Ext.state.Manager.set("portalstate", state);
    }, this);
  },

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: 'Dashboard',
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/gnome-session.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.unshift( new Ext.oa.Portal() );

// kate: space-indent on; indent-width 2; replace-tabs on;
