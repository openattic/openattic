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

Ext.oa.getDefaultPortlets = function(tools){
  "use strict";
  return [{
    title: 'LVs',
    layout:'fit',
    id: 'portlet_lvs',
    tools: (function(){
      var mytools = tools.slice();
      mytools.unshift({
        id: 'refresh',
        handler: function(){
          Ext.StoreMgr.lookup("portlet_lvs_store").reload();
        }
      });
      return mytools;
    }()),
    items: new Ext.grid.GridPanel({
      height: 265,
      viewConfig: { forceFit: true },
      split: true,
      store: (function(){
        // Anon function that is called immediately to set up the store's DefaultSort
        var store = new Ext.data.DirectStore({
          storeId: "portlet_lvs_store",
          autoLoad: true,
          fields: ['name', 'megs', 'filesystem',  'formatted', 'id', 'state', 'fs', 'fswarning', 'fscritical', {
            name: 'fsused',
            mapping: 'fs',
            sortType: 'asInt',
            convert: function( val, row ){
              if( val === null || typeof val.stat === "undefined" ){
                return -1; // fake to sort unknown values always at the bottom
              }
              return (val.stat.used / val.stat.size * 100 ).toFixed(2);
            }
          }],
          directFn: lvm__LogicalVolume.filter,
          baseParams: {
            '__exclude__': { filesystem: '' }
          }
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
          header: "Used",
          width: 150,
          dataIndex: "fsused",
          align: 'right',
          renderer: function( val, x, store ){
            if( !val || val === -1 ){
              return '';
            }
            var id = Ext.id();
            (function(){
              if( Ext.get(id) === null ){
                return;
              }
              new Ext.ProgressBar({
                renderTo: id,
                value: val/100.0,
                text:  String.format("{0}%", val),
                cls:   ( val > store.data.fscritical ? "lv_used_crit" :
                        (val > store.data.fswarning  ? "lv_used_warn" : "lv_used_ok"))
              });
            }).defer(25);
            return '<span id="' + id + '"></span>';
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
        if( typeof chart.canvas !== "undefined" ){
          hoststats__HostStats.get_cpu(function(provider, result){
            if(result.result){
              var conf = {
                smps: ['CPU'],
                vars: [],
                data: []
              };
              var key;
              for( key in result.result ){
                if( key === "time_taken" ){
                  continue;
                }
                if( result.result[key] < 0.5 ){
                  continue;
                }
                conf.vars.push(key);
                conf.data.push([result.result[key]]);
              }
              chart.canvas.updateData({ y: conf });
              chart.el.unmask();
            }
          });
        }
        updateChart.defer(30000);
      };
      chart.on("afterrender", function(){
        chart.el.mask(gettext("Loading..."));
        updateChart();
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
        if( typeof chart.canvas !== "undefined" ){
          hoststats__HostStats.get_mem(function(provider, result){
            if(result.result){
              var conf = {
                smps: ['RAM'],
                vars: [],
                data: []
              };
              var key;
              for( key in result.result ){
                conf.vars.push(key);
                conf.data.push([result.result[key]]);
              }
              chart.canvas.updateData({ y: conf });
              chart.el.unmask();
            }
          });
        }
        updateChart.defer(30000);
      };
      chart.on("afterrender", function(){
        chart.el.mask(gettext("Loading..."));
        updateChart();
      });
      chart.on("leftclick", function(){});
      return chart;
    }())
  }];
};

// kate: space-indent on; indent-width 2; replace-tabs on;


