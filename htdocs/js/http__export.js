Ext.namespace("Ext.oa");

Ext.oa.Http__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var currentChartId = null;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "http",
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['path', 'state', 'id', 'volume', {
          name: 'volumename',
          mapping: 'volume',
          convert: function( val, row ){
            return val.name;
          }
        }],
        directFn: http__Export.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [ {
          header: "Path",
          width: 350,
          dataIndex: "path"
        }, {
          header: "Browse",
          width: 100,
          dataIndex: "volumename",
          renderer: function(val, x, store){
            return String.format(
              '<a href="/volumes/{0}" target="_blank" title="Browse">' +
                '<img alt="Browser" src="/filer/static/icons/application_double.png">' +
              '</a>',
              val );
          }
        } ]
      })
    }));
    Ext.oa.Http__Export_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: 'Web (HTTP)',
      leaf: true,
      panel: this,
      icon: '/filer/static/icons2/22x22/mimetypes/www.png',
      href: '#',
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
