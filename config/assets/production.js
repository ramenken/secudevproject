'use strict';

module.exports = {
  client: {
    lib: {
      css: [
        'public/lib/bootstrap/dist/css/bootstrap.min.css'
        //'public/lib/bootstrap/dist/css/bootstrap-theme.min.css',
      ],
      js: [
        'public/lib/angular/angular.min.js',
        'public/lib/angular-resource/angular-resource.min.js',
        'public/lib/angular-animate/angular-animate.min.js',
        'public/lib/angular-messages/angular-messages.min.js',
        'public/lib/angular-ui-router/release/angular-ui-router.min.js',
        'public/lib/angular-ui-utils/ui-utils.min.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'public/lib/angular-file-upload/angular-file-upload.min.js',
        'public/lib/angular-sanitize/angular-sanitize.min.js',
        'public/lib/jquery/dist/jquery.min.js',
        'public/lib/angular-route/angular-route.min.js',
        'public/lib/angular-loading-bar/build/loading-bar.min.js',
        'public/lib/ng-file-upload/ng-file-upload.js',
        'public/lib/ng-file-upload-shim/ng-file-upload-shim.js'
      ]
    },
    css: 'public/dist/application.min.css',
    js: 'public/dist/application.min.js'
  }
};
