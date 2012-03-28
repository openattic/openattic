// kate: space-indent on; indent-width 2; replace-tabs on;

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

Ext.namespace('Ext.oa');

Ext.oa.WebSSHIframe = Ext.extend(Ext.BoxComponent, {
  // http://www.extjs.com/forum/showthread.php?p=54416#post54416
  onRender : function(ct, position){
    "use strict";
    this.el = ct.createChild({
      tag: 'iframe',
      frameBorder: 0,
      width: 665,
      height: 455,
      src: '/ajaxterm/'
    });
  }
});

Ext.oa.WebSSHPanel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";
    var currentChartId = null;
    var nfsGrid = this;

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "webssh_panel_inst",
      layout: 'vbox',
      layoutConfig: {
        align: 'center',
        defaultMargins: {top:25, right:0, bottom:0, left:0}
      },

      items: [{
        title: 'SSH',
        items: new Ext.oa.WebSSHIframe()
       }]
    }));
    Ext.oa.WebSSHPanel.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg("webssh_panel", Ext.oa.WebSSHPanel);

Ext.oa.WebSSHModule = Ext.extend(Object, {
  panel: "webssh_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_system", ({
      text: 'SSH/Telnet',
      leaf: true,
      panel: "webssh_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/apps/gnome-terminal.png',
      href: '#',
      layout: 'absolute'
     }));
  }
});

window.MainViewModules.push( new Ext.oa.WebSSHModule() );

// kate: space-indent on; indent-width 2; replace-tabs on;

