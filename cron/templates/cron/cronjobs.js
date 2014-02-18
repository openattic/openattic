/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.define('Ext.oa.Cron__Job_Panel', {
  alias: 'widget.cron__job_panel',
  extend: 'Ext.oa.ShareGridPanel',
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
  store: {
    fields: [{
      name: 'hostname',
      mapping: 'host',
      convert: toUnicode
    }]
  },
  columns: [{
    header: gettext('Host'),
    width: 30,
    dataIndex: "hostname"
  }, {
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
    header: gettext('User'),
    width: 30,
    dataIndex: "user"
  }, {
    header: gettext('Command'),
    width: 250,
    dataIndex: "command"
  }],
  form: {
    items: [{
        xtype: 'combo',
        allowBlank: false,
        fieldLabel: gettext('Host'),
        name: 'host',
        store: (function(){
          Ext.define('cronjob_ifconfig_all_store_model', {
            extend: 'Ext.data.Model',
            fields: [
              {name: 'id'},
              {name: 'name'}
            ]
          });
          return Ext.create('Ext.data.Store', {
            model: "cronjob_ifconfig_all_store_model",
            proxy: {
              type: 'direct',
              directFn: ifconfig__Host.all
            }
          });
        }()),
        triggerAction: 'all',
        deferEmptyText: false,
        emptyText:     gettext('Select...'),
        selectOnFocus: true,
        displayField:  'name',
        valueField:    'id',
        listeners: {
          afterrender: function(self){
            self.store.load();
          }
        }
      }, {
        fieldLabel: gettext('User'),
        name: "user"
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
    Ext.Msg.confirm(
      this.texts.remove,
      interpolate( gettext('Really delete this job?') + "<br />%s", [sel.data.command] ),
      handler, scope
    );
  }
});


Ext.oa.Cron__Job_Module = {
  panel: "cron__job_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_services", {
      text: gettext('Cron Jobs'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/actions/appointment.png',
      panel: 'cron__job_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Cron__Job_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
