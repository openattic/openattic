Ext.namespace("Ext.oa");
Ext.oa.Settings_Panel = Ext.extend(Ext.Panel,{
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "settings_panel_inst",
      title: 'Personal Settings',
      width:700,
      height:300,
      labelWidth: 250,
      bodyStyle: 'padding:10px;',     // lazy inline style
      layout: 'form',
      items: [ {
        xtype: "checkbox",
        fieldLabel: "Auto-expand root nodes",
        width: 80,
        checked: Ext.state.Manager.get("expand_root_nodes", true),
        listeners: {
          check: function( self, checked ){
            Ext.state.Manager.set("expand_root_nodes", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: "tipify",
        checked: Ext.state.Manager.get("form_tooltip_show", true),
        listeners: {
          check: function( self, checked){
            Ext.state.Manager.set("form_tooltip_show", checked);
          }
        }
      },{
        xtype:"numberfield",
        fieldLabel: "ab welchem Schwellwert LV rot:",
        listeners: {
          check: function(self, checked){
            Ext.state.Manager.set("lv_red_threshold", parseFloat(text));
          }
        }
      } ],
      buttons: [{
        text: 'Save',
      },{
        text: 'Change THEME',
        icon: MEDIA_URL + '/oxygen/16x16/apps/preferences-desktop-theme.png',
        listeners: {
          click: function(self, ev){
            var addwin = new Ext.Window({
              title: "Select Theme",
              layout: "fit",
              height: 100,
              width: 250,
              items:{
                html: "Please select your desired theme"
              },
              buttons: [{
                text: 'access',
                handler: function(btn){
                  Ext.state.Manager.set( "theme", "access" );
                  // For some reason, window.location.reload.defer() does not work in chrome.
                  setTimeout( function(){window.location.reload()}, 200 );
                }
              },{
                text:  'gray',
                handler: function(btn){
                  Ext.state.Manager.set( "theme", "gray" );
                  setTimeout( function(){window.location.reload()}, 200 );
                }
              },{
                text:  'default',
                handler: function(btn){
                  Ext.state.Manager.clear( "theme" );
                  setTimeout( function(){window.location.reload()}, 200 );
                }
              }]
            });
            addwin.show()
          }
        }
      }],
    }));
    Ext.oa.Settings_Panel.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg("settings_panel", Ext.oa.Settings_Panel);

Ext.oa.Settings_Module = Ext.extend(Object, {
  panel: "settings_panel",
  prepareMenuTree: function(tree){
  }
});

window.MainViewModules.push(new Ext.oa.Settings_Module());

// kate: space-indent on; indent-width 2; replace-tabs on;
