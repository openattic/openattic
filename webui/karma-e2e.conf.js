// Karma configuration for e2e tests

module.exports = function (config) {
    config.set({

        basePath: 'abc),

        files: [
            'test/e2e/**/*.js'
        ],

        logLevel: config.LOG_DEBUG,

        autoWatch: false,

        browsers: ['Chrome'],

        frameworks: ['ng-scenario'],

        singleRun: true,

        urlRoot: '/_karma_/',

        proxies: {
            '/': 'http://localhost:8080/'
        }

    });
};
