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

Ext.oa.Cron__Job_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    var cronGrid = this;
    var addwin = new Ext.Window(Ext.apply(config, {
      layout: "fit",
      defaults: {autoScroll: true},
      height: 240,
      width: 500,
      items:[{
        xtype: "form",
        bodyStyle: 'padding: 5px 5px;',
        api: {
          load: cron__Cronjob.get_ext,
          submit: cron__Cronjob.set_ext
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
          anchor: '-20px',
          defaults : {
            anchor: "0px"
          }
        },
        items: [
          tipify({
            xtype: 'volumefield'
          }, "{% trans 'Please select the volume to share.' %}"), {
            xtype: 'textfield',
            fieldLabel: "{% trans 'Minute' %}",
            name: "minute",
          }, {
            xtype: 'textfield',
            fieldLabel: "{% trans 'Hour' %}",
            name: "hour",
          }, {
            xtype: 'textfield',
            fieldLabel: "{% trans 'Day of Month' %}",
            name: "dom",
          }, {
            xtype: 'textfield',
            fieldLabel: "{% trans 'Month' %}",
            name: "mon",
          }, {
            xtype: 'textfield',
            fieldLabel: "{% trans 'Day of Week' %}",
            name: "dow",
          }, {
            xtype: 'textfield',
            fieldLabel: "{% trans 'Command' %}",
            name: "command",
          }
        ],
        buttons: [{
          text: config.submitButtonText,
          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
          handler: function(self){
            self.ownerCt.ownerCt.getForm().submit({
              success: function(provider, response){
                if(response.result){
                  cronGrid.store.reload();
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
    var cronGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig,{
      id: "cron__job_panel_inst",
      title: "nfs",
      viewConfig: {forceFit: true},
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          cronGrid.store.reload();
        }
      },{
        text: "{% trans 'Add Cronjob' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          cronGrid.showEditWindow({
            title: "{% trans 'Add Cronjob' %}",
            submitButtonText: "{% trans 'Create Cronjob' %}"
          });
        }
      },{
        text:  "{% trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = cronGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            cronGrid.showEditWindow({
              title: "{% trans 'Edit' %}",
              submitButtonText: "{% trans 'Edit' %}"
            }, sel.data);
          }
        }
      },{
        text: "{% trans 'Delete Cronjob' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: cronGrid
      }],
      keys: [{ scope: cronGrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],
      store: new Ext.data.DirectStore({
        fields: ['id', 'minute', 'hour', 'dom', 'mon', 'dow', 'command'],
        directFn: cron__Cronjob.all
      }),
      viewConfig: {forceFit: true},
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Minute' %}",
          width: 30,
          dataIndex: "minute"
        }, {
          header: "{% trans 'Hour' %}",
          width: 30,
          dataIndex: "hour"
        }, {
          header: "{% trans 'Day of Month' %}",
          width: 30,
          dataIndex: "dom"
        }, {
          header: "{% trans 'Month' %}",
          width: 30,
          dataIndex: "mon"
        }, {
          header: "{% trans 'Day of Week' %}",
          width: 30,
          dataIndex: "dow"
        }, {
          header: "{% trans 'Command' %}",
          width: 250,
          dataIndex: "command"
        }]
      })
    }));
    Ext.oa.Cron__Job_Panel.superclass.initComponent.apply(this, arguments);
  },
  deleteFunction: function(self){
    var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      Ext.Msg.confirm(
        "{% trans 'Delete Cronjob' %}",
        interpolate(
          "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
        function(btn){
          if(btn == 'yes'){
            cron__Cronjob.remove( sel.data.id, function(provider, response){
              sel.store.reload();
            } );
          }
        }
      );
    }
  },

  onRender: function(){
    Ext.oa.Cron__Job_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
    var self = this;
    var menu = new Ext.menu.Menu({
      items: [{
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
          menu.showAt(event.xy);
        }
      }
    });
  }
});

Ext.reg("cron__job_panel", Ext.oa.Cron__Job_Panel);

Ext.oa.Cron__Job_Module = Ext.extend(Object, {
  panel: "cron__job_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_services", {
      text: "{% trans 'Cron Jobs' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'cron__job_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Cron__Job_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
