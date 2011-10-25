// kate: space-indent on; indent-width 2; replace-tabs on;

Ext.namespace('Ext.oa');

Ext.oa.Settings_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var currentChartId = null;
    var nfsGrid = this;

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "settings_panel_inst",
      title: 'Settings!',
      html: "Settings!"
    }));
    Ext.oa.WebSSHPanel.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg("settings_panel", Ext.oa.Settings_Panel);

Ext.oa.Settings_Module = Ext.extend(Object, {
  panel: "settings_panel",
  prepareMenuTree: function(tree){
  }
});

window.MainViewModules.push( new Ext.oa.Settings_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;

