{% load i18n %}

window.MainViewModules.push({
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shutdown", {
      text: "{% trans 'Logout' %}",
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/actions/system-log-out.png',
      listeners: {
        click: function(self, ev){
          Ext.Msg.confirm(
            "{% trans 'Logout' %}",
            "{% trans 'Do you really want to logout?' %}",
            function(btn, text){
              if(btn == 'yes'){
                var conn = new Ext.data.Connection();
                conn.request({
                  url: LOGOUT_URL,
                  success: function( response, options ){
                    var redirect = function(){
                      location.href = INDEX_URL;
                    };
                    window.setTimeout( redirect, 20000 );
                    Ext.Msg.show({
                      title:   "{% trans 'Logout' %}",
                      msg:     "{% trans 'Successfully logged out' %}",
                      buttons: Ext.MessageBox.OK,
                      fn:      redirect
                    });
                  }
                });
              }
            }
          );
        }
      }
    });
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;
