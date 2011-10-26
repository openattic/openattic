Ext.namespace("Ext.oa");

Ext.oa.DangerousMessage = function(color){
  // http://www.sencha.com/forum/showthread.php?7613-Ext.MessageBox-extend-class&p=46792&viewfull=1#post46792
  var f = function(){};
  f.prototype = Ext.MessageBox;
  var o = Ext.extend(f, {
    getDialog: function() {
      var d = o.superclass.getDialog.apply(this, arguments);
      d.mask.addClass(color);
      d.on("hide", function(){
        d.mask.removeClass(color);
      });
      return d;
    }
  });
  return new o();
};
Ext.oa.RedDangerousMessage = Ext.oa.DangerousMessage("redmask");

Ext.oa.YellowDangerousMessage = Ext.oa.DangerousMessage("yellowmask");

// kate: space-indent on; indent-width 2; replace-tabs on;
