Ext.namespace("Ext.oa");


Ext.oa.Lvm__LogicalVolume_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var currentChartId = null;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: 'LVM',
      layout: 'border',
      buttons: [{
          text: "Add Volume",
          icon: "/filer/static/icons2/16x16/add.png"
        }, {
          text: "Resize Volume",
          icon: "/filer/static/icons2/16x16/gtk-execute.png"
        }, {
          text: "Delete Volume",
          icon: "/filer/static/icons2/16x16/remove.png"
      }],
      items: [{
        xtype: 'grid',
        region: "center",
        ref: 'lvpanel',
        store: (function(){
          // Anon function that is called immediately to set up the store's DefaultSort
          var store = new Ext.data.DirectStore({
            autoLoad: true,
            fields: ['name', 'megs', 'filesystem',  'formatted', 'id', 'state', 'fs',
              {
                name: 'fsfree',
                mapping: 'fs',
                convert: function( val, row ){
                  if( val === null || typeof val.stat === "undefined" )
                    return '';
                  return val.stat.freeG.toFixed(2);
                }
              }, {
                name: 'fsused',
                mapping: 'fs',
                convert: function( val, row ){
                  if( val === null || typeof val.stat === "undefined" )
                    return '';
                  return val.stat.usedG.toFixed(2);
                }
              }],
            directFn: lvm__LogicalVolume.all
          });
          store.setDefaultSort("name");
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
              if( val >= 1000 )
                return String.format("{0} GB", (val / 1000).toFixed(2));
              return String.format("{0} MB", val);
            }
          }, {
            header: "FS",
            width: 50,
            dataIndex: "filesystem",
            renderer: function( val, x, store ){
              if( val )
                return val;
              return "&ndash;";
            }
          }, {
            header: "Free",
            width: 75,
            dataIndex: "fsfree",
            align: 'right',
            renderer: function( val, x, store ){
              if( !val )
                return '';
              return String.format("{0} GB", val);
            }
          }, {
            header: "Used",
            width: 75,
            dataIndex: "fsused",
            align: 'right',
            renderer: function( val, x, store ){
              if( !val )
                return '';
              return String.format("{0} GB", val);
            }
          }]
        }),
        listeners: {
          cellmousedown: function( self, rowIndex, colIndex, evt ){
            var record = self.getStore().getAt(rowIndex);
            var chartpanel = self.ownerCt.items.items[1];
            var defer = false;
            if( !chartpanel.collapsed ){
              chartpanel.collapse();
              defer = true;
            }
            if( !record.data.filesystem || currentChartId === record.data.id ){
              currentChartId = null;
              return;
            }
            currentChartId = record.data.id;
            chartpanel.items.items[0].store.loadData([[
                record.data.id, record.data.name,
                record.data.fsused, record.data.fsfree,
                (record.data.megs / 1000).toFixed(2)
              ]]);
            if( defer )
              chartpanel.expand.defer(500, chartpanel);
            else
              chartpanel.expand();
          }
        }
      }, {
        split: true,
        region: "east",
        title: "Storage usage",
        collapsible: true,
        collapsed: true,
        width:  460,
        layout: "fit",
        ref: 'chartpanel',
        items: new Ext.DataView({
          tpl: new Ext.XTemplate(
            '<tpl for=".">',
              '<div class="thumb-wrap" id="{name}">',
                '<img src="/filer/lvm/mem/{id}.png" width="450" title="{name}" />',
                '<span class="fsstat">{fsused} GB used &ndash; {fsfree} GB free &ndash; {total} GB total</span>',
              '</div>',
            '</tpl>'),
          singleSelect: true,
          autoHeight: true,
          itemSelector: 'div.thumb_wrap',
          loadingText: 'Loading...',
          store: new Ext.data.ArrayStore({
            fields: ['id', 'name', 'fsused', 'fsfree', 'total'],
            data: []
          })
        })
      }]
    }));
    Ext.oa.Lvm__LogicalVolume_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[1].children.push({
      text: 'Disk Management',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/database.png',
      panel: this,
      href: '#',
    });
    tree.root.attributes.children[1].children.push({
      text: 'Volume Management',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/volume.png',
      panel: this,
      href: '#',
    });
    tree.root.attributes.children[1].children.push({
      text: 'Snapshots',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/snapshot.png',
      panel: this,
      href: '#',
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
