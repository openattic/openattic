{% load i18n %}

Ext.namespace("Ext.oa");


Ext.oa.Nagios__Graph_ImagePanel = Ext.extend(Ext.Panel, {
  graphcolors: {
    {% if PROFILE.theme != "access" %}
    bgcol: 'F3F3F3',
    grcol: '',
    fgcol: '111111'
    {% else %}
    bgcol: '1F2730',
    grcol: '222222',
    fgcol: 'FFFFFF'
    {% endif %}
  },
  initComponent: function(){
    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      reloadInterval: 0,
      graphwidth: false,
      layout: "vbox",
      layoutConfig: { "align": "center" },
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

  loadRecord: function(record, id){
    this.currentRecord = record;
    this.currentId = id;
    if( this.el ){
      this.el.mask("{% trans 'Loading...' %}");
      var url = String.format(
        PROJECT_URL + "/nagios/{0}/{1}.png?start={2}&grad={3}&{4}",
        record.data.id, id, parseInt((new Date().getTime() / 1000) - this.timespan),
        Ext.state.Manager.get("nagios_graph_grad", "false"),
        Ext.urlEncode(this.graphcolors)
      );
      if( this.graphwidth !== false ){
        url += "&width=" + this.graphwidth;
      }
      this.items.items[0].el.dom.src = url;
      if( this.reloadInterval )
        this.loadRecord.defer(this.reloadInterval*1000, this, [this.currentRecord, this.currentId]);
    }
  }
});

Ext.reg("naggraphimage", Ext.oa.Nagios__Graph_ImagePanel);


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
      buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            nagiosGrid.items.items[0].store.reload();
          }
        }
      ],
      items: [ {
        xtype: 'grid',
        region: "center",
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
            self.ownerCt.items.items[1].loadRecord(record);
          }
        }
      }, {
        region: "south",
        layout: "border",
        border: false,
        height: 300,
        items: [{
          xtype: "tabpanel",
          region: "center",
          activeTab: 0,
          border: false,
          items: [{
            xtype: "naggraphimage",
            title: "{% trans '4 hours' %}",
            timespan: 4*60*60
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
          loadRecord: function( record, id ){
            this.items.each( function(item){
              item.loadRecord( record, id );
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
              self.ownerCt.items.items[0].loadRecord(self.currentRecord, record.data.id);
            }
          },
          loadRecord: function( record ){
            this.currentRecord = record;
            this.store.loadData( record.json.graphs );
            this.ownerCt.items.items[0].loadRecord(record, record.json.graphs[0].id);
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
  }
});


window.MainViewModules.push( new Ext.oa.Nagios__Service_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
