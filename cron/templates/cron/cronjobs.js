{% load i18n %}

{% comment %}
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
{% endcomment %}

Ext.namespace("Ext.oa");

Ext.oa.Cron__Job_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: cron__Cronjob,
  id: "cron__job_panel_inst",
  title: "Cron Jobs",
  columns: [{
    header: "{% trans 'Minute' %}",
    width: 30,
    dataIndex: "minute"
  }, {
    header: "{% trans 'Hour' %}",
    width: 30,
    dataIndex: "hour"
  }, {
    header: "{% trans 'Day of Month' %}",
    width: 30,
    dataIndex: "dom"
  }, {
    header: "{% trans 'Month' %}",
    width: 30,
    dataIndex: "mon"
  }, {
    header: "{% trans 'Day of Week' %}",
    width: 30,
    dataIndex: "dow"
  }, {
    header: "{% trans 'Command' %}",
    width: 250,
    dataIndex: "command"
  }],
  form: {
    items: [
      tipify({
        xtype: 'volumefield'
      }, "{% trans 'Please select the volume to share.' %}"), {
        fieldLabel: "{% trans 'Minute' %}",
        name: "minute"
      }, {
        fieldLabel: "{% trans 'Hour' %}",
        name: "hour"
      }, {
        fieldLabel: "{% trans 'Day of Month' %}",
        name: "dom"
      }, {
        fieldLabel: "{% trans 'Month' %}",
        name: "mon"
      }, {
        fieldLabel: "{% trans 'Day of Week' %}",
        name: "dow"
      }, {
        fieldLabel: "{% trans 'Command' %}",
        name: "command"
      }
    ]
  }
});

Ext.reg("cron__job_panel", Ext.oa.Cron__Job_Panel);

Ext.oa.Cron__Job_Module = Ext.extend(Object, {
  panel: "cron__job_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_services", {
      text: "{% trans 'Cron Jobs' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'cron__job_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Cron__Job_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
