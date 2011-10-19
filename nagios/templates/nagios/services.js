{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Nagios__Service_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var nagiosGrid = this;
    var renderDate = function(val, x, store){
      return new Date(val * 1000);
    };
    var stateicons = {
      0: MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png',
      1: MEDIA_URL + '/oxygen/16x16/status/dialog-warning.png',
      2: MEDIA_URL + '/oxygen/16x16/status/dialog-error.png'
    };
    var renderDesc = function( val, x, store ){
      return '<img src="' + stateicons[parseInt(store.data.current_state)] + '" title="no" /> ' + val;
    };

    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans 'Nagios Services' %}",
      viewConfig: { forceFit: true },
      buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            nagiosGrid.store.reload();
          }
        }
      ],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'description', {
          name: "volumename",    mapping: "volume", convert: function(val, row){ return val.name; }
        }, {
          name: "plugin_output", mapping: "state",  convert: function(val, row){ return val.plugin_output; }
        }, {
          name: "current_state", mapping: "state",  convert: function(val, row){ return val.current_state; }
        }, {
          name: "last_check",    mapping: "state",  convert: function(val, row){ return val.last_check; }
        }, {
          name: "next_check",    mapping: "state",  convert: function(val, row){ return val.next_check; }
        }],
        directFn: nagios__Service.all
      }),
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
      })
    }));
    Ext.oa.Nagios__Service_Panel.superclass.initComponent.apply(this, arguments);

    this.on("cellmousedown", function( self, rowIndex, colIndex, evt ){
        var record = self.getStore().getAt(rowIndex);
        if( record.json.perfdata.length === 0 )
          return;
        var graphwin = new Ext.Window({
          title: record.data.description,
          height: 230,
          width:  610,
          items: new Ext.BoxComponent({
            autoEl: {
              tag: "img",
              src: String.format(
                PROJECT_URL + "/nagios/{0}/{1}.png",
                record.data.id, 0
              )
            },
            listeners: {
              render: function(self){
                self.el.on("load", function(ev, target, options){
                  var offsetH = this.ownerCt.getHeight() - this.ownerCt.getInnerHeight()
                  this.ownerCt.setHeight( target.height + offsetH );
                  var offsetW = this.ownerCt.getWidth() - this.ownerCt.getInnerWidth()
                  this.ownerCt.setWidth( target.width + offsetW );
                }, self);
              }
            }
          }),
        });
        graphwin.show();
      }, this);

  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: "{% trans 'Monitoring' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Nagios__Service_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
