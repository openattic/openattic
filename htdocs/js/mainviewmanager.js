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

Ext.oa.MainViewManager = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var mainviewmanager = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'border',
      tbar: new Ext.Toolbar({
        cls: "mainviewtoolbar",
        items: [
          new Ext.BoxComponent({
            autoEl: {
              tag: "img",
              src: MEDIA_URL + '/openattic.png'
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
          new Ext.ux.ToolbarDroppable({
            createItem: function(data) {
              var record = data.draggedRecord;
              return new Ext.Button({
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
          }),
          new Ext.ux.ToolbarReorderer({
            defaultReorderable: false,
            messages: this.toolbarMessages
          })
        ],
        listeners: {
          afterrender: function(self){
            var td = self.getEl().query(".x-toolbar-extras-row");
//             console.log("asdlasde");
          }
        },
        smartInsert: function(obj){
          var tbar = mainviewmanager.getTopToolbar();
          for (var i = 0; i < tbar.items.length; i++) {
            var c = tbar.items.items[i];
            if (c.isFill) {
              tbar.insert(i, obj);
              return;
            }
          }
          tbar.add(obj);
        }
      }),
      items: [ new Ext.oa.MenuTree({
        region: "west",
        split: true,
        width: 250,
        minSize: 175,
        maxSize: 400,
        collapsible: true,
        border: false,
        enableDD: true,
        listeners: {
          'render': function(tree) {
            var findTreeNode = function(node, sourceEl){
              if( node.text === sourceEl.textContent )
                return node;
              for( var i = 0; i < node.childNodes.length; i++ ){
                var cldnode = findTreeNode(node.childNodes[i], sourceEl);
                if( cldnode )
                  return cldnode;
              }
              return null;
            };
            tree.dragZone = new Ext.dd.DragZone(tree.getEl(), {
              onBeforeDrag: function(evt){
                var sourceEl = evt.sourceEl;
                if( sourceEl ){
                  var treenode = findTreeNode(tree.getRootNode(), sourceEl);
                  return typeof treenode.attributes.panel !== "undefined";
                }
                return false;
              },
              getDragData: function(evt){
                var sourceEl = evt.getTarget(tree.itemSelector, 10);
                if( sourceEl ){
                  var ddEl = sourceEl.cloneNode(true);
                  var treenode = findTreeNode(tree.getRootNode(), sourceEl);
                  ddEl.id = Ext.id();
                  return {
                    ddel:     ddEl,
                    sourceEl: sourceEl,
                    repairXY: Ext.fly(sourceEl).getXY(),
                    sourceStore: tree.store,
                    draggedRecord: treenode.attributes
                  };
                }
              },
              getRepairXY: function() {
                return this.dragData.repairXY;
              }
            });
          }
        }
      }), {
        region: "center",
        activeItem: 0,
        border: false,
        hideBorders: true,
        layout: "card",
        layoutConfig: { deferredRender: true },
        items: (function(){
          var it = [];
          for( var i = 0; i < window.MainViewModules.length; i++ ){
            var mod = window.MainViewModules[i];
            if( Ext.isArray(mod.panel) ){
              for( var j = 0; j < mod.panel.length; j++ )
                it.push({ xtype: mod.panel[j] });
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
    Ext.oa.MainViewManager.superclass.initComponent.apply(this, arguments);

    this.menutree = this.items.items[0];
    this.modcontainer = this.items.items[1];
    this.currentComponent = window.MainViewModules[0];

    for( var i = 0; i < window.MainViewModules.length; i++ ){
      window.MainViewModules[i].prepareMenuTree(this.menutree);
    }

    var currstate = Ext.state.Manager.get("toolbarbuttons");
    if( currstate ){
      for( var i = 0; i < currstate.length; i++ ){
        this.topToolbar.add( new Ext.Button({
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

    this.menutree.on( 'beforeclick', this.treenodeClicked, this );
    var tbupdate = function(evt){
      var data = [];
      for( var i = 1; i < this.topToolbar.items.items.length; i++ ){
        data.push({
          text:  this.topToolbar.items.items[i].initialConfig.text,
          icon:  this.topToolbar.items.items[i].initialConfig.icon,
          panel: this.topToolbar.items.items[i].initialConfig.panel
        });
      }
      Ext.state.Manager.set("toolbarbuttons", data);
    };
    this.topToolbar.on( 'add', tbupdate, this );
    this.topToolbar.on( 'remove', tbupdate, this );
  },

  treenodeClicked: function( node, event ){
    if( typeof node.attributes.panel != "undefined" )
      this.switchComponent( node.attributes.panel );
  },

  switchComponent: function( toComponent ){
    if( typeof toComponent === "string" ){
      this.modcontainer.layout.setActiveItem( toComponent );
      this.menutree.markAsActive( toComponent );
    }
    else{
      this.modcontainer.layout.setActiveItem( toComponent.id );
      this.menutree.markAsActive( toComponent.id );
    }
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
