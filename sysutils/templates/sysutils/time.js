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

Ext.namespace("Ext.oa");

Ext.oa.Time_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";
    var timeGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: gettext('Date/Time'),
      layout: 'absolute',
      items: [{
        xtype: 'form',
        width: 350,
        x: 30,
        y: 30,
        defaultType: 'textfield',
        autoHeight: true,
        frame: true,
        reader: new Ext.data.JsonReader({fields: ['server','id']}),
        api: {
          // The server-side method to call for load() requests
          load: sysutils__NTP.get_ext,
          // The server-side must mark the submit handler as a 'formHandler'
          submit: sysutils__NTP.set
        },
        baseParams: {id:1},
        paramOrder: ["id"],
        items: [{
          fieldLabel: gettext('NTP Server'),
          name: "server",
          width: 200,
          allowBlank: false,
          ref: 'serverfield'
        }],
        buttons: [{
          text: gettext('Save'),
          handler: function(self){
            sysutils__NTP.set(1, {
              'server': self.ownerCt.ownerCt.serverfield.getValue()
            });
            Ext.Msg.show({
              title:   gettext('NTP'),
              msg:     gettext('Successfully Updated NTP Server'),
              buttons: Ext.MessageBox.OK
            });
          }
        }]
      }]
    }));
    Ext.oa.Time_Panel.superclass.initComponent.apply(this, arguments);
    this.items.items[0].getForm().load({
    });
  },

  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Date/Time'),
      leaf: true,
      panel: this,
      icon: MEDIA_URL + '/icons2/22x22/apps/date_time.png',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Time_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
