window.MainViewModules.push({
  prepareMenuTree: function(tree){
    tree.root.attributes.children[5].children.push({
      text: 'Theme',
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/apps/preferences-desktop-theme.png',
      listeners: {
        click: function(self, ev){
          var addwin = new Ext.Window({
            title: "Please select a theme",
            layout: "fit",
            height: 100,
            width: 250,
            items:{
                html: "Please select your wanted Theme"
            },
            buttons: [{
                text:  'access',
                handler: function(btn){
                  Ext.state.Manager.set( "theme", "access" );
                  window.location.reload.defer(200);
            }},{ 
                text:  'gray',
                handler: function(btn){
                  Ext.state.Manager.set( "theme", "gray" );
                  window.location.reload.defer(200);
            }},{
                text:  'default',
                handler: function(btn){
                  Ext.state.Manager.clear( "theme" );
                  window.location.reload.defer(200);
            }}]
          });
          addwin.show()
        }
      }
    });
    tree.root.attributes.children[5].children.push({
      text: 'Logout',
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/actions/system-log-out.png',
      listeners: {
        click: function(self, ev){
            Ext.Msg.confirm(
                'Logout',
                'Do you really want to logout?',
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
                            title:   'Logout',
                            msg:     'Successfully logged out',
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
