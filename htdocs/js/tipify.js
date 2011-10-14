function mkFocusFunc(tiptext){
  return function( self ){
    if( !Ext.state.Manager.get("form_tooltip_show", true) )
      return;
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
  }
}

function mkBlurFunc(){
  return function( self ){
    if( self.fieldtip ){
      self.fieldtip.hide();
    }
  }
}

function tipify(config, tiptext){
  if( typeof config.listeners === "undefined" )
    config.listeners = {};
  config.listeners.focus = mkFocusFunc(tiptext);
  config.listeners.blur = mkBlurFunc();
  return config;
}
