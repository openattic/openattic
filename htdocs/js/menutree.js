Ext.namespace("Ext.oa");

Ext.oa.MenuTree = Ext.extend(Ext.tree.TreePanel, {
  style: 'padding: 0px 5px 10px 10px',
  xtype: 'portal',
  border: false,
  rootVisible: false,
  region: 'west',
  useArrows: true,
  autoScroll: true,
  animate: true,
  enableDD: false,
  containerScroll: true,
  border: false,
  split: true,
  width: 200,
  minSize: 175,
  maxSize: 400,
  collapsible: true,
  margins: '35 0 5 5', //beginnt da, wo die anderen panels auch starten
  root: {
    children: [
      {
        text: 'Status',
        icon: '/filer/static/icons/television.png',
        children: [
          {text: 'Dashboard',          leaf: true},
          {text: 'Protokolle',         leaf: true},
          {text: 'Performance',        leaf: true},
          {text: 'Speicherverteilung', leaf: true},
          {text: 'Dienste',            leaf: true}
        ],
      }, {
      text: 'Laufwerke',
      icon: '/filer/static/icons/heart.png',
      children: [{
          text: 'LVM',
          children: [
            {text: 'LV List', leaf: true},
            {text: 'VG List', leaf: true}
          ]
        },
        {text: 'Snapshots',     leaf: true},
        {text: 'Block Devices', leaf: true}]
      }, {
        text: 'Freigaben',
        icon: '/filer/static/icons/bug.png',
        children: [ {
            text: 'iSCSI',
            children: [
              {text: 'Target List',    leaf: true},
              {text: 'Initiator List', leaf: true}
            ]
          }, {
            text: 'Samba',
            children: [{text: 'Share List', leaf: true}]
          }, {
            text: 'NFS',
            children: [{text: 'Export List', leaf: true}]
          }, {
            text: 'HTTP',
            children: [
              {text: 'Export List',  leaf: true},
              {text: 'WebDAV',       leaf: true},
              {text: 'Webinterface', leaf: true}
            ]
          }, {
            text: 'FC',
            children: [{text: 'FC Targets', leaf: true}]
          }, {
            text: 'AFP',
            children: [{text: 'AFP Shares', leaf: true}]
          } ]
      }, {
        text: 'Dienste',
        icon: '/filer/static/icons/heart.png',
        children: [
          {text: 'Deduplizierung', leaf: true},
          {
            text: 'DRBD',
            children: [{text: 'DRBD', leaf: true}]
          },
          {text: 'rSync',       leaf: true},
          {text: 'Snapmanager', leaf: true},
          {text: 'VTL',         leaf: true},
          {text: 'Revisioning', leaf: true},
          {text: 'Backup',      leaf: true}
        ]
      }, {
        text: 'System',
        icon: '/filer/static/icons/cog.png',
        children: [ {
            text: 'Kommando-Log',
            children: [{text: 'Log-Entries', leaf: true}]
          }, {
            text: 'Netzwerk',
            children: [
              {text: 'General',          leaf: true},
              {text: 'Management-Iface', leaf: true},
              {text: 'Zugriffs-Iface',   leaf: true}
            ]
          },
          {text: 'User Management',  leaf: true},
          {text: 'Datum/Uhrzeit',    leaf: true},
          {text: 'E-Mail',           leaf: true},
          {text: 'openITCockpit',    leaf: true},
          {text: 'openQRM',          leaf: true},
          {text: 'WebSSH',           leaf: true},
          {text: 'Online Update',    leaf: true},
          {text: 'Shutdown/Reboot',  leaf: true}
        ]
      }
    ],
    text: 'root',
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
