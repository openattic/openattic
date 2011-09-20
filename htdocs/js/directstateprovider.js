
Ext.state.DirectStateProvider = Ext.extend(Ext.state.Provider, {
  constructor: function(name, defaultValue){
    Ext.state.DirectStateProvider.superclass.constructor.call(this);
    if( window.InitDirectState )
      this.state = window.InitDirectState;
    else{
      var self = this;
      userprefs__UserProfile.all_preferences(function(provider, response){
        self.state = response.result;
      });
    }
  },
  clear: function(name){
    userprefs__UserProfile.clear_preference(name);
    Ext.state.DirectStateProvider.superclass.set.call(this, name);
  },
  set: function(name, value){
    if( typeof value === "undefined" || value === null )
      userprefs__UserProfile.clear_preference(name);
    else
      userprefs__UserProfile.set_preference(name, value);
    Ext.state.DirectStateProvider.superclass.set.call(this, name, value);
  }
});
Ext.state.Manager.setProvider( new Ext.state.DirectStateProvider() );


// kate: space-indent on; indent-width 2; replace-tabs on;
