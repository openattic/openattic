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

Ext.oa.Cron__Job_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: cron__Cronjob,
  id: "cron__job_panel_inst",
  title: gettext('Cron Jobs'),
  texts: {
    add:     gettext('Add Job'),
    edit:    gettext('Edit Job'),
    remove:  gettext('Delete Job')
  },
  window: {
    height: 350
  },
  columns: [{
    header: gettext('Minute'),
    width: 30,
    dataIndex: "minute"
  }, {
    header: gettext('Hour'),
    width: 30,
    dataIndex: "hour"
  }, {
    header: gettext('Day of Month'),
    width: 30,
    dataIndex: "domonth"
  }, {
    header: gettext('Month'),
    width: 30,
    dataIndex: "month"
  }, {
    header: gettext('Day of Week'),
    width: 30,
    dataIndex: "doweek"
  }, {
    header: gettext('Command'),
    width: 250,
    dataIndex: "command"
  }],
  form: {
    items: [
      {
        xtype: 'volumefield'
      }, {
        fieldLabel: gettext('Minute'),
        name: "minute"
      }, {
        fieldLabel: gettext('Hour'),
        name: "hour"
      }, {
        fieldLabel: gettext('Day of Month'),
        name: "domonth"
      }, {
        fieldLabel: gettext('Month'),
        name: "month"
      }, {
        fieldLabel: gettext('Day of Week'),
        name: "doweek"
      }, {
        fieldLabel: gettext('Command'),
        name: "command"
      }
    ]
  },
  deleteConfirm: function(sel, handler, scope){
    "use strict";
    Ext.Msg.confirm(
      this.texts.remove,
      interpolate( gettext('Really delete this job?') + "<br />%s", [sel.data.command] ),
      handler, scope
    );
  }
});

Ext.reg("cron__job_panel", Ext.oa.Cron__Job_Panel);

Ext.oa.Cron__Job_Module = Ext.extend(Object, {
  panel: "cron__job_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_services", {
      text: gettext('Cron Jobs'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'cron__job_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Cron__Job_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
