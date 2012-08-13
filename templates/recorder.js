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

window.RECORDING = false;
window.RECORDED_COMMANDS = [];

for( var id in Ext.Direct.providers ){
  if( Ext.Direct.providers.hasOwnProperty(id) ){
    Ext.Direct.providers[id].on("beforecall", function( provider, opt ){
      if( !window.RECORDING || ["create", "set", "set_ext", "remove"].indexOf(opt.method) == -1 )
        return;
      var methstr = opt.method;
      var obj = opt.action.split("__");
      if( opt.isForm ){
        console.log(opt);
        var methstr = "set";
        var argstr = opt.args[2].form.baseParams.id + ", " + Ext.encode(opt.args[2].form.getFieldValues());
      }
      else if( opt.data === null ){
        var argstr = '';
      }
      else{
        var argstrings = [];
        Ext.each( opt.data, function(item){
          argstrings.push(Ext.encode(item));
        } );
        var argstr = argstrings.join(', ');
      }
      window.RECORDED_COMMANDS.push(String.format("{0}.{1}.{2}({3})",
        obj[0], obj[1], methstr, argstr ));
    });
  }
}



window.MainViewModules.push({
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_system", {
      id:   'api-record-node',
      text: gettext('API Record'),
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/actions/media-record.png',
      listeners: {
        click: function(self, ev){
          if( window.RECORDING ){
            var win = new Ext.Window({
              title: "API",
              items: {
                xtype: "textarea",
                value: (window.RECORDED_COMMANDS.join(';\n') + ';\n'),
              },
              layout: "fit",
              height: 180,
              width:  300
            });
            win.show();
            tree.getNodeById('api-record-node').getUI().getIconEl().src = MEDIA_URL + '/oxygen/22x22/actions/media-record.png'
          }
          else{
            window.RECORDING = true;
            tree.getNodeById('api-record-node').getUI().getIconEl().src = MEDIA_URL + '/oxygen/22x22/actions/media-playback-stop.png'
          }
        }
      }
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
