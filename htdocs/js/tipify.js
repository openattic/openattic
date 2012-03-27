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

function mkFocusFunc(tiptext){
  "use strict";
  return function( self ){
    if( !Ext.state.Manager.get("form_tooltip_show", true) ){
      return;
    }
    self.fieldtip = new Ext.ToolTip({
      target: ( self.trigger ? self.trigger.id : self.id ),
      anchor: 'left',
      html: tiptext,
      width: Ext.state.Manager.get("form_tooltip_width", 200),
      autoHide: false,
      dismissDelay: 0,
      listeners: {
        hide: function( ttip ){
          ttip.destroy();
          self.fieldtip = null;
        }
      }
    });
    self.fieldtip.show();
  };
}

function mkBlurFunc(){
  "use strict";
  return function( self ){
    if( self.fieldtip ){
      self.fieldtip.hide();
    }
  };
}

function tipify(config, tiptext){
  "use strict";
  if( typeof config.listeners === "undefined" ){
    config.listeners = {};
  }
  config.listeners.focus = mkFocusFunc(tiptext);
  config.listeners.blur = mkBlurFunc();
  return config;
}

// kate: space-indent on; indent-width 2; replace-tabs on;
