/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

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

Ext.onReady(function(){
  for( var id = 0; id < Ext.Direct.providers.items.length; id++ ){
    Ext.Direct.providers.items[id].on("beforecall", function( provider, opt ){
      if( !window.RECORDING || ["create", "create_volume", "set", "set_ext", "remove"].indexOf(opt.method) == -1 )
        return;
      var methstr = opt.method;
      var obj = opt.action.split("__");
      if( opt.isForm ){
        if( opt.args[2].form.baseParams.id === -1 ){
          var methstr = "create";
          var argstr = Ext.encode(opt.args[2].form.getFieldValues());
        }
        else{
          var methstr = "set";
          var argstr = opt.args[2].form.baseParams.id + ", " + Ext.encode(opt.args[2].form.getFieldValues());
        }
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
      window.RECORDED_COMMANDS.push(Ext.String.format("api.{0}.{1}.{2}({3})",
        obj[0], obj[1], methstr, argstr ));
    });
  }
});


window.MainViewModules.push({
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      id:   'menu_apirecord',
      text: gettext('API Record'),
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/actions/media-record.png'
    });
  },
  handleMenuTreeClick: function(record){
    if( record.data.id !== "menu_apirecord" )
      return;
    if( window.RECORDING ){
      window.RECORDED_COMMANDS.push('');
      var win = new Ext.Window({
        title: "API Client Script",
        items: {
          xtype: "textarea",
          value: ([
            '#!/usr/bin/env python\n\n',
            'from xmlrpclib import ServerProxy\n\n',
            'api = ServerProxy("http://__:<<paste API key here>>@'+window.HOSTNAME+':31234/")\n\n'
          ].join('') + window.RECORDED_COMMANDS.join('\n'))
        },
        layout: "fit",
        height: 480,
        width:  640
      });
      win.show();
      record.set("icon", MEDIA_URL + '/oxygen/22x22/actions/media-record.png');
      window.RECORDING = false;
      window.RECORDED_COMMANDS = [];
    }
    else{
      window.RECORDING = true;
      record.set("icon", MEDIA_URL + '/oxygen/22x22/actions/media-playback-stop.png');
    }
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
