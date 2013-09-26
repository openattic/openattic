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

window.MainViewModules.push({
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shutdown", {
      text: gettext('Logout'),
      id: "menu_logout",
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/actions/system-log-out.png'
    });
  },
  handleMenuTreeClick: function(record){
    if( record.data.id !== "menu_logout" )
      return;
    Ext.Msg.confirm(
      gettext('Logout'),
      gettext('Do you really want to logout?'),
      function(btn, text){
        if(btn === 'yes'){
          var conn = new Ext.data.Connection();
          conn.request({
            url: LOGOUT_URL,
            success: function( response, options ){
              var redirect = function(){
                location.href = INDEX_URL;
              };
              window.setTimeout( redirect, 20000 );
              Ext.Msg.show({
                title:   gettext('Logout'),
                msg:     gettext('Successfully logged out'),
                buttons: Ext.MessageBox.OK,
                fn:      redirect
              });
            }
          });
        }
      }
    );
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;
