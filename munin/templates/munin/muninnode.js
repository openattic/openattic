{% load i18n %}

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

Ext.oa.Munin__MuninNode_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";
    var muninStore;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'munin__muninnode_panel_inst',
      title: "{% trans 'Performance' %}",
      layout: 'border',
      items: [{
        region: 'west',
        xtype:  'grid',
        width: 160,
        viewConfig: { forceFit: true },
        ref: "../modulespanel",
        store: {
          xtype: 'directstore',
          fields: [{
            name: 'name',
            convert: function( val, row ){
              return row; // LOL
            }
          }],
          directFn: munin__MuninNode.get_modules,
          baseParams: {'obj': 1}
        },
        colModel: new Ext.grid.ColumnModel({
          columns: [{
            header: "{% trans 'Modul' %}",
            dataIndex: "name"
          } ]
        }),
        listeners: {
          cellclick: function( self, rowIndex, colIndex, evt ){
            var record = self.getStore().getAt(rowIndex);
            muninStore.loadData([[ record.data.name.replace(/\./g, '_') ]]);
          }
        }
      }, {
        xtype: "tabpanel",
        region: 'center',
        ref: "imagespanel",
        tabPosition: 'bottom',
        activeTab: 0,
        items: (function(){
          muninStore = new Ext.data.ArrayStore({
            fields: ['name'],
            data: [['apache_accesses']]
          });
          var dv = function(when, urlwhen){
            return new Ext.DataView({
              title: when,
              tpl: new Ext.XTemplate(
                '<tpl for=".">',
                  '<div class="munin-graphs">',
                    '<img src="/munin/localdomain/localhost.localdomain/{name}-'+urlwhen+'.png" />',
                  '</div>',
                '</tpl>'),
              singleSelect: true,
              autoHeight: true,
              itemSelector: 'div.thumb_wrap',
              loadingText: 'Loading...',
              store: muninStore
            });
          };
          // Create four DataViews that use the same store to get the module name
          // from, but that use different templates in order to display the final images
          return [
            dv("{% trans 'day' %}",   "day"),
            dv("{% trans 'week' %}",  "week"),
            dv("{% trans 'month' %}", "month"),
            dv("{% trans 'year' %}",  "year")
          ];
        }())
      }]
    }));
    Ext.oa.Munin__MuninNode_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.Munin__MuninNode_Panel.superclass.onRender.apply(this, arguments);
    this.items.items[0].store.reload();
  }
});

Ext.reg("munin__muninnode_panel", Ext.oa.Munin__MuninNode_Panel);

Ext.oa.Munin__MuninNode_Module = Ext.extend(Object, {
  panel: "munin__muninnode_panel",

  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_status", {
      text: "{% trans 'Performance' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/samba.png',
      panel: 'munin__muninnode_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Munin__MuninNode_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
