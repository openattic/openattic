exports.config = {

  seleniumAddress: 'http://localhost:4444/wd/hub',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 360000,
  },
  framework: 'jasmine2',

  suites: {
    //dashboard        : '../e2e/dashboard/**/*.e2e.js',
    //todowidget       : '../e2e/dashboard/todoWidget/*.e2e.js',
    general            : '../e2e/general/**/*.e2e.js',
    disks              : '../e2e/disks/**/*.e2e.js',
    pools              : '../e2e/pools/**/*e2e.js',
    volumes            : '../e2e/volumes/**/*.e2e.js',
    volumes_add        : '../e2e/volumes/add/**/*.e2e.js',
    volumes_protection : '../e2e/volumes/protection/**/*.e2e.js',
    volumes_resize     : '../e2e/volumes/resize/**/*.e2e.js',
    snapshot_add       : '../e2e/snapshots/add/**/*.e2e.js',
    snapshot_clone     : '../e2e/snapshots/clone/**/*.e2e.js',
    http_share_add     : '../e2e/shares/http/*.e2e.js',
    nfs_share_add      : '../e2e/shares/nfs/*.e2e.js',
    cifs_share_add     : '../e2e/shares/cifs/*.e2e.js',
    lun_add            : '../e2e/shares/lun/*.e2e.js',
    hosts              : '../e2e/hosts/**/*.e2e.js',
    users              : '../e2e/users/**/*.e2e.js',
    auth               : '../e2e/auth/*.e2e.js',
    cmdlogs            : '../e2e/commandLogs/**/*.e2e.js',
    //wizards            : '../e2e/wizards/**/*.e2e.js',
    fs_wiz_btrfs_nfs   : '../e2e/wizards/file/fileStorage_btrfs_nfs.e2e.js',
    fs_wiz_ext_cifs    : '../e2e/wizards/file/fileStorage_ext_cifs.e2e.js',
    blockStorage       : '../e2e/wizards/block/blockStorage.e2e.js',
    vmStorage_xfs_nfs  : '../e2e/wizards/vm/vmStorage_xfs_nfs.e2e.js'
    zvol_add	       : '../e2e/volumes/zvol.e2e.js',
  },

  onPrepare: function(){
    browser.driver.manage().window().maximize();
  },
};
