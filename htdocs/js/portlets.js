Ext.namespace("Ext.oa");

Ext.oa.getDefaultPortlets = function(tools){
  return [{
    title: 'LVs',
    layout:'fit',
    id: 'portlet_lvs',
    tools: tools,
    items: new Ext.grid.GridPanel({
      height: 265,
      viewConfig: { forceFit: true },
      split: true,
      store: (function(){
        // Anon function that is called immediately to set up the store's DefaultSort
        var store = new Ext.data.DirectStore({
          autoLoad: true,
          fields: ['name', 'megs', 'filesystem',  'formatted', 'id', 'state', 'fs', 'fswarning', 'fscritical', {
            name: 'fsused',
            mapping: 'fs',
            sortType: 'asInt',
            convert: function( val, row ){
              if( val === null || typeof val.stat === "undefined" )
                return -1; // fake to sort unknown values always at the bottom
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
            if( !val || val === -1 )
              return '';
            if( val > store.data.fscritical )
              var color = "red";
            else if( val > store.data.fswarning )
              var color = "gold";
            else
              var color = "green";
            return String.format('<span style="color:{1};">{0}%</span>', val, color);
          }
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
          imageDir: MEDIA_URL+'/canvasxpress/images/',
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
      var updateChart = function(){
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
        updateChart.defer(30000);
      }
      updateChart();
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
          imageDir: MEDIA_URL+'/canvasxpress/images/',
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
      var updateChart = function(){
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
        updateChart.defer(30000);
      }
      updateChart();
      chart.on("leftclick", function(){});
      return chart;
    }())
  }];
}

// kate: space-indent on; indent-width 2; replace-tabs on;


