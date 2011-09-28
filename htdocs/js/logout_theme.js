window.MainViewModules.push({
  prepareMenuTree: function(tree){
    tree.root.attributes.children[5].children.push({
      text: 'Logout',
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/actions/system-log-out.png',
      listeners: {
        click: function(self, ev){
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
                msg:     'Sie haben sich erfolgreich ausgeloggt!',
                buttons: Ext.MessageBox.OK,
                fn:      redirect
              });
            }
          });
        }
      }
    });
    tree.root.attributes.children[5].children.push({
      text: 'Theme',
      leaf: true,
      listeners: {
        click: function(self, ev){
          Ext.Msg.show({
            title: 'Theme',
            msg:   'Please select a theme.',
            buttons: {
              yes:    'access',
              no:     'default',
              cancel: Ext.Msg.CANCEL
            },
            fn: function(btn, text){
              if( btn == 'yes' ){
                Ext.state.Manager.set( "theme", "access" );
                window.location.reload.defer(200);
              }
              else if( btn == 'no' ){
                Ext.state.Manager.clear( "theme" );
                window.location.reload.defer(200);
              }
            }
          });
        }
      }
    });
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;
