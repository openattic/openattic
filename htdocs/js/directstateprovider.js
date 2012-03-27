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

Ext.state.DirectStateProvider = Ext.extend(Ext.state.Provider, {
  constructor: function(name, defaultValue){
    "use strict";
    Ext.state.DirectStateProvider.superclass.constructor.call(this);
    if( window.InitDirectState ){
      this.state = window.InitDirectState;
    }
    else{
      var self = this;
      userprefs__UserProfile.all_preferences(function(provider, response){
        self.state = response.result;
      });
    }
  },
  clear: function(name){
    "use strict";
    userprefs__UserProfile.clear_preference(name);
    Ext.state.DirectStateProvider.superclass.set.call(this, name);
  },
  set: function(name, value){
    "use strict";
    if( typeof value === "undefined" || value === null ){
      userprefs__UserProfile.clear_preference(name);
    }
    else{
      userprefs__UserProfile.set_preference(name, value);
    }
    Ext.state.DirectStateProvider.superclass.set.call(this, name, value);
  }
});
Ext.state.Manager.setProvider( new Ext.state.DirectStateProvider() );


// kate: space-indent on; indent-width 2; replace-tabs on;
