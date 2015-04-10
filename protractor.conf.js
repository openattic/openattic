exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 360000
  },
  suites: {
    dashboard: 'test/e2e/dashboard/**/*.e2e.js',
    general: 'test/e2e/general/**/*.e2e.js',
    volumes: 'test/e2e/volumes/**/*.e2e.js'
  }
};