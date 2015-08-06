exports.config = {

  seleniumAddress: 'http://localhost:4444/wd/hub',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 360000,
  },
  framework: 'jasmine2',

  suites: {
    //dashboard        : 'test/e2e/dashboard/**/*.e2e.js',
    //todowidget       : 'test/e2e/dashboard/todoWidget/*.e2e.js',
    general            : 'test/e2e/general/**/*.e2e.js',
    disks              : 'test/e2e/disks/**/*.e2e.js',
    pools              : 'test/e2e/pools/**/*e2e.js',
    volumes            : 'test/e2e/volumes/**/*.e2e.js',
    volumes_add        : 'test/e2e/volumes/add/**/*.e2e.js',
    volumes_protection : 'test/e2e/volumes/protection/**/*.e2e.js',
    volumes_resize     : 'test/e2e/volumes/resize/**/*.e2e.js',
    snapshot_add       : 'test/e2e/snapshots/add/**/*.e2e.js',
    snapshot_clone     : 'test/e2e/snapshots/clone/**/*.e2e.js',
    http_share_add     : 'test/e2e/shares/http/*.e2e.js',
    nfs_share_add      : 'test/e2e/shares/nfs/*.e2e.js',
    cifs_share_add     : 'test/e2e/shares/cifs/*.e2e.js',
    lun_add            : 'test/e2e/shares/lun/*.e2e.js',
    hosts              : 'test/e2e/hosts/**/*.e2e.js',
    users              : 'test/e2e/users/**/*.e2e.js',
    auth               : 'test/e2e/auth/*.e2e.js',
    cmdlogs            : 'test/e2e/commandLogs/**/*.e2e.js',
    //wizards            : 'test/e2e/wizards/**/*.e2e.js',
    fs_wiz_btrfs_nfs   : 'test/e2e/wizards/file/fileStorage_btrfs_nfs.e2e.js',
    fs_wiz_ext_cifs    : 'test/e2e/wizards/file/fileStorage_ext_cifs.e2e.js',
    blockStorage       : 'test/e2e/wizards/block/blockStorage.e2e.js',
    vmStorage_xfs_nfs  : 'test/e2e/wizards/vm/vmStorage_xfs_nfs.e2e.js'
  },

  onPrepare: function(){
    browser.driver.manage().window().maximize();
  },
};