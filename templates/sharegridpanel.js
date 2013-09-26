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


Ext.oa.getShareEditWindow = function(config, record){
  Ext.applyIf(config, {
    height: 200,
    width: 500,
    texts: {}
  });
  Ext.applyIf(config.texts, {
    submit: gettext("Submit"),
    cancel: gettext("Cancel")
  });
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
          load:   config.api.get_ext,
          submit: config.api.set_ext
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
        aboutToSubmit: function(btn, conf){
          // Default: do nothing
          return true;
        },
        buttons: [{
          text: config.texts.submit,
          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
          handler: function(btn){
            addwin.getEl().mask(gettext("Loading..."));
            var conf = {
              success: function(provider, response){
                if(response.result){
                  if( typeof config.success === "function"){
                    config.success();
                  }
                  addwin.close();
                }
              },
              failure: function(){
                addwin.getEl().unmask();
              }
            };
            var datform = btn.ownerCt.ownerCt;
            if( datform.aboutToSubmit(btn, conf) === true ){
              datform.submit(conf);
            }
            else{
              addwin.getEl().unmask()
            }
          }
        },{
          text: config.texts.cancel,
          icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
          handler: function(){
            addwin.close();
          }
        }]
      };
      Ext.apply(form, config.form);
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
  return addwin;
}


Ext.define('Ext.oa.ShareGridPanel', {

  extend: 'Ext.grid.GridPanel',
  alias: 'sharegridpanel',
  api: null,
  form: {},
  texts: {},
  window: {},
  allowEdit: true,
  allowAdd: true,
  allowDelete: true,
  filterParams: false,
  filterSearchParam: null,

  initComponent: function(){
    var self = this;
    var filters = {};
    var filterCount = 0;
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
      mycolumns.push(Ext.apply({ sortable: true }, this.columns[i]));
    }
    this.columns = mycolumns;
    Ext.apply(this, {
      setFilter: function(field, value){
        if( filterCount === 0 ){
          //self.store.directFn = self.api.filter;
        }
        if( typeof filters[field] === "undefined" ){
          filterCount++;
        }
        filters[field] = value;
      },
      delFilter: function(field){
        if( typeof filters[field] !== "undefined" ){
          delete filters[field];
          filterCount--;
        }
        if( filterCount === 0 ){
          //self.store.directFn = self.api.all;
        }
      }
    });
    this.store = this.store || {};
    delete this.initialConfig["store"];
    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      store: new Ext.data.DirectStore({
        id: self.store.id || self.id + "_store",
        proxy: {
          type: "direct",
          directFn: self.api.filter,
          startParam: undefined,
          limitParam: undefined,
          pageParam:  undefined
        },
        fields: (function(){
          var cols = ["id", "__unicode__"],
              c;
          for( c = 0; c < self.columns.length; c++ ){
            cols.push(self.columns[c].dataIndex);
          }
          if( typeof self.store.fields !== "undefined" ){
            for( c = 0; c < self.store.fields.length; c++ ){
              cols.push(self.store.fields[c]);
            }
          }
          return cols;
        }()),
      }),
      forceFit: true,
      bbar: {
        xtype: 'toolbar',
        hidden: true,
        items: ["Search:", {
          xtype: 'textfield',
          deferEmptyText: false,
          emptyText: gettext('Search...'),
          enableKeyEvents: true,
          listeners: {
            change: function( fld, newVal, oldVal ){
              if( typeof self.searchTimeout !== "undefined" ){
                clearTimeout(self.searchTimeout);
              }
              if( newVal !== '' ){
                self.setFilter(self.filterSearchParam, newVal);
              }
              else{
                self.delFilter(self.filterSearchParam);
              }
              self.store.load();
            },
            keypress: function( fld, evt ){
              if( typeof self.searchTimeout !== "undefined" ){
                clearTimeout(self.searchTimeout);
              }
              if(evt.getKey() === evt.ENTER){
                fld.initialConfig.listeners.change.apply(self, [fld, fld.getValue()]);
              }
              else if(evt.getKey() === evt.ESC){
                fld.initialConfig.listeners.change.apply(self, [fld, '']);
                self.bottomToolbar.hide();
                self.doLayout();
              }
              else{
                self.searchTimeout = Ext.defer(fld.initialConfig.listeners.change,2000, self, [fld, fld.getValue()]);
              }
            }
          }
        }, {
          xtype: 'button',
          icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
          handler: function(){
            var fld = self.bottomToolbar.items.items[1];
            fld.initialConfig.listeners.change.apply(self, [fld, '']);
            self.bottomToolbar.hide();
            self.doLayout();
          }
        }]
      }
    }));
    // Same goes for buttons, if any are defined in the prototype.
    if( typeof this.buttons === "undefined" ){
      this.buttons = [];
    }
    else{
      var mybuttons = [];
      if(typeof buttons !== 'undefined')
      {
        for( i = 0; i < this.buttons.length; i++ ){
          mybuttons[i] = Ext.apply({}, this.buttons[i]);
          Ext.applyIf(mybuttons[i], { scope: self });
        }
        this.buttons = mybuttons;
      }
    }
    this.store.proxy.extraParams = filters;
    if( this.filterParams !== false ){
      for( i in this.filterParams ){
        if( this.filterParams.hasOwnProperty(i) ){
          this.setFilter(i, this.filterParams[i] );
        }
      }
    }
    this.buttons.unshift({
      text: "",
      icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
      tooltip: self.texts.reload,
      scope: self,
      handler: function(){
        self.store.load();
      }
    });
    if( this.allowAdd ){
      if( this.form !== null ){
        this.buttons.push({
          text: self.texts.add,
          icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
          scope: self,
          handler: function(){
            self.showEditWindow({
              title: self.texts.add,
              texts: {
                cancel: self.texts.cancel,
                submit: self.texts.add
              }
            });
          }
        });
      }
      if( this.allowEdit ){
        this.buttons.push({
          text:  self.texts.edit,
          icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
          scope: self,
          handler: Ext.bind(self.editFunction, self, [self]),
        });
      }
      if( this.allowDelete ){
        this.buttons.push({
          text: self.texts.remove,
          icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
          handler: this.deleteFunction,
          scope: self
        });
      }
    }
    this.callParent(arguments);
  },

  editFunction: function(self){
    var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selected.items[0];
      this.showEditWindow({
        title: self.texts.edit,
        texts: {
          cancel: self.texts.cancel,
          submit: self.texts.edit
        }
      },sel.data);
    }
  },

  deleteConfirm: function(sel, handler, scope){
    Ext.Msg.confirm(
      this.texts.remove,
      interpolate(this.texts.confirm, [sel.data.__unicode__]),
      handler, scope
    );
  },

  deleteFunction: function(){
    var sm = this.getSelectionModel();
    var self = this;
    if( sm.hasSelection() ){
      var sel = sm.selected.items[0];
      self.deleteConfirm( sel, function(btn){
        if(btn === 'yes'){
          self.api.remove( sel.data.id, function(provider, response){
            sel.store.load();
          } );
        }
      }, self );
    }
  },

  initSearch: function(){
    if( this.filterSearchParam === null || typeof this.api.filter === "undefined" ){
      Ext.Msg.alert("Search", "This panel cannot be searched.");
      return;
    }
    this.bottomToolbar.show();
    this.bottomToolbar.items.items[1].focus();
  },

  refresh: function(){
    this.store.load();
  },

  showEditWindow: function(config, record){
    var self = this;
    Ext.apply(config, this.window);
    var addwin = Ext.oa.getShareEditWindow(Ext.apply(config, {
      api:     self.api,
      success: function(){ self.store.load(); },
      form:    self.form
    }), record);
    addwin.show();
  },

  onRender: function(){
    this.callParent(arguments);
    this.store.load();
    var self = this;
    var menubuttons = [], gridbuttons = this.getDockedItems(".toolbar")[1].items.getRange();
    var i;
    for( i = 0; i < gridbuttons.length; i++ ){
      menubuttons.push({
        text:    (gridbuttons[i].initialConfig.text || gridbuttons[i].initialConfig.tooltip),
        icon:     gridbuttons[i].initialConfig.icon,
        handler:  gridbuttons[i].initialConfig.handler,
        scope:    gridbuttons[i].initialConfig.scope
      });
    }
    var menu = new Ext.menu.Menu({
      items: menubuttons
    });
    this.on({
      itemcontextmenu: function(grid, record, item, itemidx, event, evopts){
        event.stopEvent();
        menu.showAt(event.xy);
      },
      itemdblclick: function(grid, row, event){
        if( this.allowEdit && this.getSelectionModel().hasSelection() ){
          this.editFunction(this);
        }
      }
    }, this);
    this.keyMap = new Ext.util.KeyMap({
      target: self.getEl(),
      scope: self,
      key: [Ext.EventObject.DELETE],
      fn: this.deleteFunction
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;

