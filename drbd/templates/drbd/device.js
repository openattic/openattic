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

Ext.oa.Drbd__Connection_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: drbd__Connection,
  id: "drbd__connection_panel_inst",
  title: gettext("DRBD"),
  texts: {
    add:     gettext('Add Device'),
    edit:    gettext('Edit Device'),
    remove:  gettext('Delete Device')
  },
  storefields: [{
    name: 'volumename',
    mapping: 'local_endpoint',
    convert: function(val, row){
      "use strict";
      if( val ){
        return val.volume.name;
      }
      return '';
    }
  }, {
    name: 'dstate_self',
    mapping: 'dstate',
    convert: function(val, row){
      "use strict";
      if( val ){
        return val.self;
      }
      return '';
    }
  }, {
    name: 'role_self',
    mapping: 'role',
    convert: function(val, row){
      "use strict";
      if( val ){
        return val.self;
      }
      return '';
    }
  }],
  columns: [{
    header: gettext('Resource Name'),
    dataIndex: "res_name"
  }, {
    header: gettext('Volume'),
    dataIndex: "volumename"
  }, {
    header: gettext('Protocol'),
    dataIndex: "protocol"
  }, {
    header: gettext('Disk state (here)'),
    dataIndex: "dstate_self"
  }, {
    header: gettext('Connection state'),
    dataIndex: "cstate"
  }, {
    header: gettext('Role'),
    dataIndex: "role_self"
  }],
  window: {
    height: 600,
    width:  700
  },
  form: null
});

Ext.reg("drbd__connection_panel", Ext.oa.Drbd__Connection_Panel);

Ext.oa.Drbd__Connection_Module = Ext.extend(Object, {
  panel: "drbd__connection_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_services", {
      text: gettext('DRBD'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: "drbd__connection_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Drbd__Connection_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
