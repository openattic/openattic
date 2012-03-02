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

Ext.oa.Samba__Share_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
  //initComponent: function(){
    var sambaShareGrid = this;
    var addwin = new Ext.Window(Ext.apply(config,{
      layout: "fit",
      defaults: {autoScroll: true},
      height: 430,
      width: 500,
      items: [{
        xtype: "form",
        bodyStyle: 'padding: 5px 5px;',
        api:{
          load: samba__Share.get_ext,
          submit: samba__Share.set_ext
        },
        baseParams: {
          id: (record ? record.id : -1)
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
          defaults: {
            anchor: "0px"
          }
        },
        items: [{
          xtype: 'fieldset',
          layout: 'form',
          items: [{
            xtype:'volumefield',
            listeners: {
              select: function(self, record, index){
              lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                self.ownerCt.namefield.setValue( response.result.name );
                self.ownerCt.namefield.enable();
                self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                self.ownerCt.dirfield.enable();
              } );
             }
           }
          },{
            xtype: 'textfield',
            fieldLabel: "{% trans 'Share name' %}",
            allowBlank: false,
            name: "name",
            ref: 'namefield',
            disabled: (!record),
          },{
          xtype: 'textfield',
          fieldLabel: "{% trans 'Path' %}",
            allowBlank: false,
            name: "path",
            ref: 'dirfield',
            disabled: (!record),
          },{
            xtype: 'textfield',
            fieldLabel: "{% trans 'System user' %}",
            allowBlank: true,
            name: "force_user",
            ref: 'userfield'
          }, {
            xtype: 'textfield',
            fieldLabel: "{% trans 'System Group' %}",
            allowBlank: true,
            name: "force_group",
            ref: 'groupfield'
          }, {
            xtype: 'checkbox',
            fieldLabel: "{% trans 'Browseable' %}",
            allowBlank: false,
            name: "browseable",
            ref: 'browseablefield'
          }, {
            xtype: 'checkbox',
            fieldLabel: "{% trans 'Available' %}",
            allowBlank: false,
            name: "available",
            ref: 'availablefield'
          }, {
            xtype: 'checkbox',
            fieldLabel: "{% trans 'Writeable' %}",
            allowBlank: false,
            name: "writeable",
            ref: 'writeablefield'
          }, {
            xtype: 'checkbox',
            fieldLabel: "{% trans 'Guest OK' %}",
            allowBlank: false,
            name: "guest_ok",
            ref: 'guestokfield'
          }, tipify({
            xtype: 'textfield',
            fieldLabel: "{% trans 'Dir Mode' %}",
            allowBlank: false,
            name: "dir_mode",
            ref: 'dirmodefield',
            value:     '0775'
          },"{% trans 'Set rights for the Directory' %}"),
          {
            xtype: 'textfield',
            fieldLabel: "{% trans 'Comment' %}",
            allowBlank: true,
            name: "comment",
            ref: 'commentfield'
          }, tipify({
            xtype: 'textfield',
            fieldLabel: "{% trans 'Create Mode' %}",
            allowBlank: false,
            name: "create_mode",
            ref: 'createmodefield',
            value:     '0664'
          }, "{% trans 'Set rights for owner, group and others' %}" ) ]
        }],
        buttons: [{
          text: config.submitButtonText,
          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
          handler: function(self){
            self.ownerCt.ownerCt.getForm().submit({
              success: function(provider, response){
                if (response.result){
                  sambaShareGrid.store.reload();
                  addwin.hide();
                }
              }
            });
          }
        }, {
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
    var sambaShareGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "samba__share_panel_inst",
      title: "samba",
      viewConfig: {forceFit: true},
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          sambaShareGrid.store.reload();
        }
      },{
        text: "{% trans 'Add Share' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          sambaShareGrid.showEditWindow({
            title: "{% trans 'Add Share' %}",
            submitButtonText: "{%trans 'Create Share' %}"
          });
        }
      },{
        text:  "{% trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = sambaShareGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            sambaShareGrid.showEditWindow({
              title: "{% trans 'Edit' %}",
              submitButtonText: "{% trans 'Edit' %}"
            }, sel.data);
         }
       }
     },{
        text: "{% trans 'Delete Share' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: sambaShareGrid
        }],
      keys: [{ scope: sambaShareGrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],
      store: new Ext.data.DirectStore({
      fields: ['id','name', 'path', 'available'],
      directFn: samba__Share.all
        }),
      viewConfig: {forceFit: true},
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Share name' %}",
          width: 100,
          dataIndex: "name"
        }, {
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
        }, {
          header: "{% trans 'Available' %}",
          width: 50,
          dataIndex: "available",
          renderer: this.renderBoolean
        }]
      })
     }));
    Ext.oa.Samba__Share_Panel.superclass.initComponent.apply(this, arguments);
  },
  renderBoolean: function (val, x, store){
     if (val)
       return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
     return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
      },
  deleteFunction: function(self){
    var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      Ext.Msg.confirm(
        "{% trans 'Delete Share' %}",
        interpolate(
          "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
          function(btn){
            if(btn == 'yes'){
              samba__Share.remove( sel.data.id, function(provider, response){
              sel.store.reload();
          });
        }
      });
    }
  },
  onRender: function(){
    Ext.oa.Samba__Share_Panel.superclass.onRender.apply(this, arguments);
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

Ext.reg("samba__share_panel", Ext.oa.Samba__Share_Panel);

Ext.oa.Samba__Share_Module = Ext.extend(Object, {
  panel: "samba__share_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Windows (Samba)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/samba.png',
      panel: "samba__share_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Samba__Share_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
