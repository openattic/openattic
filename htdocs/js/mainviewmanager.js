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

Ext.define('Ext.oa.MainViewManager', {

  alias: 'mainviewmanager',
  extend: 'Ext.Panel',
  initComponent: function(){
    var mainviewmanager = this;
    var i, currstate, tbupdate;
    var droppable = Ext.create('Ext.ux.ToolbarDroppable', {
      createItem: function(data) {
        var record = data.records[0].raw;
        return Ext.create('Ext.Button', {
          text:  record.text,
          icon:  record.icon,
          panel: record.panel,
          height: 70,
          iconAlign: "top",
          reorderable: true,
          handler: function(self){
            mainviewmanager.switchComponent(record.panel);
          }
        });
      }
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'border',
      tbar: Ext.create('Ext.toolbar.Toolbar', {
        cls: "mainviewtoolbar",
        id:  "mainviewtoolbar",
        items: [
          Ext.create('Ext.Component', {
            autoEl: {
              tag: "img",
              src: MEDIA_URL + '/openattic.png',
              width: 140
            },
            region: "north",
            cls: "atticlogo",
            listeners: {
              render: function(self){
                self.el.on("click", function(ev, target, options){
                  mainviewmanager.switchComponent("dashboard_inst");
                }, self);
              }
            },
            height: 75
          })
        ],
        plugins : [
          droppable,
          Ext.create('Ext.ux.ToolbarReorderer', {
            defaultReorderable: false,
            messages: this.toolbarMessages
          })
        ],
        listeners: {
          afterrender: function(self){
            var td = self.getEl().query(".x-toolbar-extras-row");
          }
        },
        smartInsert: function(obj){
          var tbar = mainviewmanager.getDockedComponent('mainviewtoolbar');
          var i, c;
          for (i = 0; i < tbar.items.length; i++) {
            c = tbar.items.items[i];
            if (c.isFill) {
              tbar.insert(i, obj);
              return;
            }
          }
          tbar.add(obj);
        }
      }),
      items: [ Ext.create('Ext.oa.MenuTree', {
        region: "west",
        split: true,
        width: 250,
        minSize: 175,
        maxSize: 400,
        collapsible: true,
        border: false,
        viewConfig: {
          plugins: {
            ptype: "treeviewdragdrop",
            ddGroup: "menutreedd"
          }
        },
        listeners: {
          afterlayout: function(self, layout, eOpts) {
            droppable.addDDGroup("menutreedd");
          }
        }
      }), {
        region: "center",
        activeItem: 0,
        border: false,
        hideBorders: true,
        layout: {
          type: "card",
          deferredRender: true
        },
        items: (function(){
          var it = [],
              i, j,
              mod;
          for( i = 0; i < window.MainViewModules.length; i++ ){
            mod = window.MainViewModules[i];
            if( Ext.isArray(mod.panel) ){
              for( j = 0; j < mod.panel.length; j++ ){
                it.push({ xtype: mod.panel[j] });
              }
            }
            else if( typeof mod.panel === "string" ){
/*              console.log( "Pushing xtype "+mod.panel );*/
              it.push({ xtype: mod.panel });
            }
            else if( typeof mod !== "undefined" ){
/*              console.log( "Pushing panel "+mod.title );*/
              it.push( mod );
            }
          }
          return it;
        }())
      }],
      modules: window.MainViewModules
    }));
    this.callParent(arguments);

    this.addEvents({
        'switchedComponent': true
        });

    this.menutree = this.items.items[0];
    this.modcontainer = this.items.items[2];
    this.currentComponent = window.MainViewModules[0];

    for( i = 0; i < window.MainViewModules.length; i++ ){
      if( typeof window.MainViewModules[i].prepareMenuTree !== "undefined" ){
        window.MainViewModules[i].prepareMenuTree(this.menutree);
      }
    }

    this.menutree.on( 'beforeitemclick', this.treenodeClicked, this );

    this.on("afterrender", function(){
      currstate = Ext.state.Manager.get("toolbarbuttons");
      if( currstate ){
        for( i = 0; i < currstate.length; i++ ){
          this.getDockedComponent('mainviewtoolbar').add( Ext.create('Ext.Button', {
            text:  currstate[i].text,
            icon:  currstate[i].icon,
            panel: currstate[i].panel,
            iconAlign: "top",
            height: 70,
            reorderable: true,
            handler: function(self){
              mainviewmanager.switchComponent(self.initialConfig.panel);
            }
          }) );
        }
      }

      var tbupdate = function(evt){
        var data = [];
        var d;
        for( d = 1; d < this.getDockedComponent('mainviewtoolbar').items.items.length; d++ ){
          var panelId = this.getDockedComponent('mainviewtoolbar').items.items[d].initialConfig.panel;
          if(typeof panelId !== 'string'){
            panelId = this.getDockedComponent('mainviewtoolbar').items.items[d].initialConfig.panel.id
          }

          data.push({
            text:  this.getDockedComponent('mainviewtoolbar').items.items[d].initialConfig.text,
            icon:  this.getDockedComponent('mainviewtoolbar').items.items[d].initialConfig.icon,
            panel: panelId
          });
        }

        Ext.state.Manager.set("toolbarbuttons", data);
      };
      this.getDockedComponent('mainviewtoolbar').on( 'add', tbupdate, this );
      this.getDockedComponent('mainviewtoolbar').on( 'remove', tbupdate, this );
    }, this);

    var map = Ext.create('Ext.util.KeyMap', {
      target: document,
      key: 'f',
      ctrl: true,
      fn: function(){
        var act = this.modcontainer.layout.activeItem;
        if( typeof act.initSearch === "undefined" ){
          Ext.Msg.alert("Search", "This panel cannot be searched.");
        }
        else{
          act.initSearch();
        }
      },
      scope: this,
      stopEvent: true
    });
    var f5again = false;
    var resetf5 = function(){
      f5again = false;
    };
    var othermap = Ext.create('Ext.util.KeyMap', {
      target: document,
      key: Ext.EventObject.F5,
      fn: function(key, evt){
        if( !f5again && Ext.state.Manager.get("catch_f5", false) ){
          f5again = true;
          Ext.defer(resetf5,1000);
          evt.stopEvent();

          var act = this.modcontainer.layout.activeItem;
          if( typeof act.refresh !== "undefined" ){
            act.refresh();
          }
        }
      },
      scope: this
    });
  },

  treenodeClicked: function( view, record, itemel, itemidx, event, evopts ){
    var i;
    if( record.data.panel !== "" ){
      this.switchComponent( record.data.panel );
    }
    else{
      for( i = 0; i < window.MainViewModules.length; i++ ){
        if( typeof window.MainViewModules[i].handleMenuTreeClick !== "undefined" ){
          window.MainViewModules[i].handleMenuTreeClick(record);
        }
      }
    }
  },

  switchComponent: function( toComponent ){
    if( typeof toComponent === "string" ){
      this.modcontainer.getLayout().setActiveItem( toComponent );
      this.menutree.markAsActive( toComponent );
      this.fireEvent( 'switchedComponent', Ext.get(toComponent) );
    }
    else{
      this.modcontainer.getLayout().setActiveItem( toComponent.id );
      this.menutree.markAsActive( toComponent.id );
      this.fireEvent( 'switchedComponent', toComponent );
    }
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
