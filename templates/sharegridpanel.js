/*
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.oa.ShareGridPanel = Ext.extend(Ext.grid.GridPanel, {
  api: null,
  form: {},
  texts: {},
  window: {},
  allowEdit: true,
  filterParams: false,

  initComponent: function(){
    "use strict";
    var self = this;
    var i;
    Ext.applyIf(this.texts, {
      reload:  gettext('Reload'),
      add:     gettext('Add Export'),
      edit:    gettext('Edit Export'),
      remove:  gettext('Delete Export'),
      submit:  gettext('Submit'),
      cancel:  gettext('Cancel'),
      confirm: gettext('Do you really want to delete export %s?')
    });
    Ext.applyIf(this.window, {
      height: 240,
      width:  500
    });
    // Without the next lines, further operations on this.columns would alter
    // the columns of the *prototype* instead of the object, thereby breaking
    // class inheritance. Solution: Copy the prototype's columns to the object.
    var mycolumns = [];
    for( i = 0; i < this.columns.length; i++ ){
      mycolumns.push(Ext.apply({}, this.columns[i]));
    }
    this.columns = mycolumns;
    // Same goes for buttons, if any are defined in the prototype.
    if( typeof this.buttons === "undefined" ){
      this.buttons = [];
    }
    else{
      var mybuttons = [];
      for( i = 0; i < this.buttons.length; i++ ){
        mybuttons[i] = Ext.apply({}, this.buttons[i]);
        Ext.applyIf(mybuttons[i], { scope: this });
      }
      this.buttons = mybuttons;
    }
    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      keys: [{
        scope: self,
        key: [Ext.EventObject.DELETE],
        handler: this.deleteFunction
        }],
      store: new Ext.data.DirectStore({
        fields: (function(){
          var cols = ["id"],
              c;
          for( c = 0; c < self.columns.length; c++ ){
            cols.push(self.columns[c].dataIndex);
          }
          if( typeof self.storefields !== "undefined" ){
            for( c = 0; c < self.storefields.length; c++ ){
              cols.push(self.storefields[c]);
            }
          }
          return cols;
        }()),
        directFn: (this.filterParams === false ? self.api.all : self.api.filter)
      }),
      viewConfig: {
        forceFit: true
      }
    }));
    if(this.filterParams !== false){
      this.store.baseParams = this.filterParams;
    }
    this.buttons.unshift({
      text: "",
      icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
      tooltip: self.texts.reload,
      scope: self,
      handler: function(){
        self.store.reload();
      }
    });
    this.buttons.push({
      text: self.texts.add,
      icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
      scope: self,
      handler: function(){
        self.showEditWindow({
          title: self.texts.add,
          submitButtonText: self.texts.add
        });
      }
    });
    if( this.allowEdit ){
      this.buttons.push({
        text:  self.texts.edit,
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        scope: self,
        handler: function(){
          var sm = self.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            self.showEditWindow({
              title: self.texts.edit,
              submitButtonText: self.texts.edit
            }, sel.data);
          }
        }
      });
    }
    this.buttons.push({
      text: self.texts.remove,
      icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
      handler: this.deleteFunction,
      scope: self
    });
    Ext.oa.ShareGridPanel.superclass.initComponent.apply(this, arguments);
  },

  editFunction: function(self){
    "use strict";
    var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      this.showEditWindow({
        title: self.texts.edit,
        submitButtonText: self.texts.edit
      },sel.data);
    }
  },

  deleteConfirm: function(sel){
    "use strict";
    return interpolate(this.texts.confirm, [sel.data.path]);
  },

  deleteFunction: function(){
    "use strict";
    var sm = this.getSelectionModel();
    var self = this;
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      Ext.Msg.confirm(
        self.texts.remove,
        self.deleteConfirm(sel),
        function(btn){
          if(btn === 'yes'){
            self.api.remove( sel.data.id, function(provider, response){
              sel.store.reload();
            } );
          }
        }
      );
    }
  },

  showEditWindow: function(config, record){
    "use strict";
    var self = this;
    Ext.apply(config, this.window);
    var addwin = new Ext.Window(Ext.apply(config, {
      layout: "fit",
      defaults: {
        autoScroll: true
      },
      items: (function(){
        var i;
        var form = {
          xtype: "form",
          bodyStyle: 'padding: 5px 5px;',
          api: {
            load:   self.api.get_ext,
            submit: self.api.set_ext
          },
          baseParams: {
            id: (record ? record.id: -1)
          },
          paramOrder: ["id"],
          listeners: {
            afterrender: function(form){
              form.getForm().load();
            }
          },
          defaults: {
            xtype: "textfield",
            anchor: '-20px',
            defaults : {
              anchor: "0px"
            }
          },
          buttons: [{
            text: config.submitButtonText,
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            handler: function(btn){
              addwin.getEl().mask(gettext("Loading..."));
              btn.ownerCt.ownerCt.getForm().submit({
                success: function(provider, response){
                  if(response.result){
                    self.store.reload();
                    addwin.hide();
                  }
                },
                failure: function(){
                  addwin.getEl().unmask();
                }
              });
            }
          },{
            text: self.texts.cancel,
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
            handler: function(){
              addwin.hide();
            }
          }]
        };
        Ext.apply(form, self.form);
        if( form.items[0].xtype == "fieldset" ){
          var items = form.items[0].items;
        }
        else{
          var items = form.items;
        }
        for( i = 0; i < items.length; i++ ){
          if( items[i].disabled ){
            items[i].disabled = !record;
          }
        }
        return form;
      }())
    }));
    addwin.show();
  },

  onRender: function(){
    "use strict";
    Ext.oa.ShareGridPanel.superclass.onRender.apply(this, arguments);
    this.store.reload();
    var self = this;
    var menubuttons = [];
    var i;
    for( i = 0; i < self.buttons.length; i++ ){
      menubuttons.push({
        text:    (self.buttons[i].initialConfig.text || self.buttons[i].initialConfig.tooltip),
        icon:     self.buttons[i].initialConfig.icon,
        handler:  self.buttons[i].initialConfig.handler,
        scope:    self.buttons[i].initialConfig.scope
      });
    }
    var menu = new Ext.menu.Menu({
      items: menubuttons
    });
    this.on({
      rowcontextmenu: function(grid, row, event){
        this.selectedNode = this.store.getAt(row);
        if((row) !== false) {
          this.getSelectionModel().selectRow(row);
        }
        event.stopEvent();
        menu.showAt(event.xy);
      },
      rowdblclick: function(grid, row, event){
        if( this.allowEdit && this.getSelectionModel().hasSelection() ){
          this.editFunction(this);
        }
      }
    }, this);
  }
});

Ext.reg("sharegridpanel", Ext.oa.ShareGridPanel);

// kate: space-indent on; indent-width 2; replace-tabs on;

