Ext.namespace("Ext.oa");

Ext.oa.Http__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var currentChartId = null;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "http",
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['path', 'state'],
        directFn: http__Export.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "path",
          width: 280,
          dataIndex: "path"
        }, {
          header: "state",
          width: 50,
          dataIndex: "state"
        } ]
      })
    }));
    Ext.oa.Http__Export_Panel.superclass.initComponent.apply(this, arguments);
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
