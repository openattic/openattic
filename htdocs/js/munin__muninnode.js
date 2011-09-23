Ext.namespace("Ext.oa");

Ext.oa.Munin__MuninNode_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: 'Performance',
      layout: 'border',
      items: [{
        region: 'west',
        xtype:  'grid',
        width: 130,
        ref: "../modulespanel",
        store: new Ext.data.DirectStore({
          autoLoad: true,
          fields: [{
            name: 'name',
            convert: function( val, row ){
              return row; // LOL
            }
          }],
          directFn: munin__MuninNode.get_modules,
          baseParams: {'obj': 1}
        }),
        colModel: new Ext.grid.ColumnModel({
          columns: [{
            header: "Modul",
            width: 110,
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
          // muninStore needs to be global so the listener can access it
          muninStore = new Ext.data.ArrayStore({
              fields: ['name'],
              data: [['apache_accesses']]
            });
          var dv = function(when){
            return new Ext.DataView({
              title: when,
              tpl: new Ext.XTemplate(
                '<tpl for=".">',
                  '<div class="munin-graphs">',
                    '<img src="/munin/localdomain/localhost.localdomain/{name}-'+when+'.png" />',
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
          return [ dv("day"), dv("week"), dv("month"), dv("year") ];
        }())
      }]
    }));
    Ext.oa.Munin__MuninNode_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: 'Performance',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/samba.png',
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
