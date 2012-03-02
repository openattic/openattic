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

Ext.oa.Http__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    var httpGrid = this;
    var addwin = new Ext.Window(Ext.apply(config,{
// Ext.apply(this, Ext.apply(this.initialConfig, {
   layout: "fit",
   defaults: { autoScroll: true },
     height: 200,
     width: 500,
     items: [{
       xtype: "form",
       bodyStyle: 'padding:5px ;',
       api: {
         load: http__Export.get_ext,
         submit: http__Export.set_ext
      },
      baseParams: {
        id: (record ? record.id: -1)
      },
      paramOrder: ["id"],
      listeners: {
        afterrender: function(self){
          self.getForm().load();
        }
      },
      defaults: {
        xtype: "textfield",
        anchor: '-20',
        defaults: {
          anchor: "0px"
        }
      },
      items: [{
        xtype: 'fieldset',
        title: 'HTTP Export',
        layout: 'form',
        items: [{
          xtype: 'volumefield',
          listeners: {
            select: function(self, record, index){
              lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                self.ownerCt.dirfield.enable();
              } );
            }
          }
        }, {
          xtype: 'textfield',
          fieldLabel: "{% trans 'Directory' %}",
          name: "path",
          disabled: (!record),
          ref: 'dirfield'
        }]
      }],
      buttons: [{
        text: config.submitButtonText,
        icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
        handler: function(self){
          self.ownerCt.ownerCt.getForm().submit({
          params: {id: -1, init_master: true, ordering: 0},
          success: function(provider,response){
            if(response.result){
              httpGrid.store.reload();
              addwin.hide();
            }
          }
        });
      }
    },{
        text: "{% trans 'Cancel' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
        handler: function(self){
                 addwin.hide();
        }
      }]
    }]
 }));
 addwin.show();
    },
     initComponent: function(){
       var httpGrid = this;
       Ext.apply(this, Ext.apply(this.initialConfig, {
         id: "http__export_panel_inst",
         title: "http",
         viewConfig: {forceFit: true},
         buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          httpGrid.store.reload();
        }
      }, {
        text: "{% trans 'Add Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          httpGrid.showEditWindow({
            title: "{% trans 'Add Export' %}",
            submitButtonText:  "{% trans 'Create Export' %}"
          });
        }
      },{
        text:  "{% trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = httpGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            httpGrid.showEditWindow({
              title:  "{% trans 'Edit Export' %}",
              submitButtonText:  "{% trans 'Edit Export' %}"
            },sel.data);
          }
        }
      },{
        text: "{% trans 'Delete Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: httpGrid
      }],
      keys: [{ scope: httpGrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],
      store: new Ext.data.DirectStore ({
        fields: ['path', 'id', 'volume', {
          name: 'volumename',mapping: 'volume',convert: function( val, row ){ return val.name;}
        }],
        directFn: http__Export.all
      }),
      viewConfig: {forceFit: true },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [ {
          header: "{% trans 'Path' %}",
          width: 350,
          dataIndex: "path"
        }, {
          header: "{% trans 'Browse' %}",
          width: 100,
          dataIndex: "volumename",
          renderer: function(val, x, store){
            return String.format(
              '<a href="/volumes/{0}" target="_blank" title="{% trans "Browse in new window" %}">' +
                '<img alt="Browser" src="{{ MEDIA_URL }}/oxygen/16x16/places/folder-remote.png">' +
              '</a>',
              val );
          }
        } ]
      })
    }));
    Ext.oa.Http__Export_Panel.superclass.initComponent.apply(this, arguments);
  },
    deleteFunction: function(self){
    var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        Ext.Msg.confirm(
            "{% trans 'Delete Export' %}",
            interpolate(
              "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
              function(btn){
                if(btn == 'yes'){
                  http__Export.remove( sel.data.id, function(provider, response){
                  sel.store.reload();
                  });
                }
          });
      }
    },
    
  onRender: function(){
    Ext.oa.Http__Export_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
    var self = this;
    var menu = new Ext.menu.Menu({
    items: [{
            id: 'delete',
            text: 'delete',
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png"
        }],
        listeners: {
          itemclick: function(item) {
                    self.deleteFunction()
          }
        }
   });
    this.on({
      'contextmenu': function(event) {
        if( this.getSelectionModel().hasSelection() ){
          event.stopEvent();
          this.getSelectionModel
          menu.showAt(event.xy);
        }
      }
    });
  }
});

Ext.reg("http__export_panel", Ext.oa.Http__Export_Panel);

Ext.oa.Http__Export_Module = Ext.extend(Object, {
  panel: "http__export_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Web (HTTP)' %}",
      leaf: true,
      panel: "http__export_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Http__Export_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
