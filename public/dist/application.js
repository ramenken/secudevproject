'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function () {
  // Init module configuration options
  var applicationModuleName = 'mean';
  var applicationModuleVendorDependencies = ['ngResource', 'ngAnimate', 'ngMessages', 'ngRoute', 'ui.router', 'ui.bootstrap', 'ui.utils', 'ngSanitize', 'angularFileUpload', 'angular-loading-bar', 'ngFileUpload'];

  // Add a new vertical module
  var registerModule = function (moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: applicationModuleVendorDependencies,
    registerModule: registerModule
  };
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider', '$httpProvider',
  function ($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');

    $httpProvider.interceptors.push('authInterceptor');
  }
]);

angular.module(ApplicationConfiguration.applicationModuleName).run(["$rootScope", "$state", "Authentication", function ($rootScope, $state, Authentication) {

  // Check authentication before changing state
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (toState.data && toState.data.roles && toState.data.roles.length > 0) {
      var allowed = false;
      toState.data.roles.forEach(function (role) {
        if (Authentication.user.roles !== undefined && Authentication.user.roles.indexOf(role) !== -1) {
          allowed = true;
          return true;
        }
      });

      if (!allowed) {
        event.preventDefault();
        if (Authentication.user !== undefined && typeof Authentication.user === 'object') {
          $state.go('forbidden');
        } else {
          $state.go('signin');
        }
      }
    }
  });

  // Record previous state
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    if (!fromState.data || !fromState.data.ignoreState) {
      $state.previous = {
        state: fromState,
        params: fromParams,
        href: $state.href(fromState, fromParams)
      };
    }
  });
}]);

//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash && window.location.hash === '#_=_') {
    if (window.history && history.pushState) {
      window.history.pushState('', document.title, window.location.pathname);
    } else {
      // Prevent scrolling by storing the page's current scroll offset
      var scroll = {
        top: document.body.scrollTop,
        left: document.body.scrollLeft
      };
      window.location.hash = '';
      // Restore the scroll offset, should be flicker free
      document.body.scrollTop = scroll.top;
      document.body.scrollLeft = scroll.left;
    }
  }

  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
ApplicationConfiguration.registerModule('core.admin', ['core']);
ApplicationConfiguration.registerModule('core.admin.routes', ['ui.router']);

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('messages');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('store');
ApplicationConfiguration.registerModule('cart');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users', ['core']);
ApplicationConfiguration.registerModule('users.admin', ['core.admin']);
ApplicationConfiguration.registerModule('users.admin.routes', ['core.admin.routes']);

'use strict';

angular.module('core.admin').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Admin',
      state: 'admin',
      type: 'dropdown',
      roles: ['admin']
    });
  }
]);

'use strict';

// Setting up route
angular.module('core.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin', {
        abstract: true,
        url: '/admin',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      });
  }
]);

'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing
    $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'modules/core/client/views/home.client.view.html'
    })
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true
      }
    });
  }
]);

'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', '$http', '$window', 'Authentication', 'Menus',
  function ($scope, $state, $http, $window, Authentication, Menus) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;
    
    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });

    $scope.signout = function () {
      $http.post('/api/auth/signout').success(function(){
        $window.location.reload();
      });
    };
  }
]);

'use strict';

angular.module('core').controller('HomeController', ['$scope', '$state', 'Authentication',
  function ($scope, $state, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    if($scope.authentication.user) {
      $state.go('messages.list');
    } else {
      $state.go('signin');
    }
  }
]);

'use strict';

/**
 * Edits by Ryan Hutchison
 * Credit: https://github.com/paulyoder/angular-bootstrap-show-errors */

angular.module('core')
  .directive('showErrors', ['$timeout', '$interpolate', function ($timeout, $interpolate) {
    var linkFn = function (scope, el, attrs, formCtrl) {
      var inputEl, inputName, inputNgEl, options, showSuccess, toggleClasses,
        initCheck = false,
        showValidationMessages = false,
        blurred = false;

      options = scope.$eval(attrs.showErrors) || {};
      showSuccess = options.showSuccess || false;
      inputEl = el[0].querySelector('.form-control[name]') || el[0].querySelector('[name]');
      inputNgEl = angular.element(inputEl);
      inputName = $interpolate(inputNgEl.attr('name') || '')(scope);

      if (!inputName) {
        throw 'show-errors element has no child input elements with a \'name\' attribute class';
      }

      var reset = function () {
        return $timeout(function () {
          el.removeClass('has-error');
          el.removeClass('has-success');
          showValidationMessages = false;
        }, 0, false);
      };

      scope.$watch(function () {
        return formCtrl[inputName] && formCtrl[inputName].$invalid;
      }, function (invalid) {
        return toggleClasses(invalid);
      });

      scope.$on('show-errors-check-validity', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          initCheck = true;
          showValidationMessages = true;

          return toggleClasses(formCtrl[inputName].$invalid);
        }
      });

      scope.$on('show-errors-reset', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          return reset();
        }
      });

      toggleClasses = function (invalid) {
        el.toggleClass('has-error', showValidationMessages && invalid);
        if (showSuccess) {
          return el.toggleClass('has-success', showValidationMessages && !invalid);
        }
      };
    };

    return {
      restrict: 'A',
      require: '^form',
      compile: function (elem, attrs) {
        if (attrs.showErrors.indexOf('skipFormGroupCheck') === -1) {
          if (!(elem.hasClass('form-group') || elem.hasClass('input-group'))) {
            throw 'show-errors element does not have the \'form-group\' or \'input-group\' class';
          }
        }
        return linkFn;
      }
    };
}]);

'use strict';

angular.module('core').factory('authInterceptor', ['$q', '$injector',
  function ($q, $injector) {
    return {
      responseError: function(rejection) {
        if (!rejection.config.ignoreAuthModule) {
          switch (rejection.status) {
            case 401:
              $injector.get('$state').transitionTo('authentication.signin');
              break;
            case 403:
              $injector.get('$state').transitionTo('forbidden');
              break;
          }
        }
        // otherwise, default behaviour
        return $q.reject(rejection);
      }
    };
  }
]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [
  function () {
    // Define a set of default roles
    this.defaultRoles = ['user', 'admin'];

    // Define the menus object
    this.menus = {};

    // A private function for rendering decision
    var shouldRender = function (user) {
      if (!!~this.roles.indexOf('*')) {
        return true;
      } else {
        if(!user) {
          return false;
        }
        for (var userRoleIndex in user.roles) {
          for (var roleIndex in this.roles) {
            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
              return true;
            }
          }
        }
      }

      return false;
    };

    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exist');
        }
      } else {
        throw new Error('MenuId was not provided');
      }

      return false;
    };

    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      return this.menus[menuId];
    };

    // Add new menu object by menu id
    this.addMenu = function (menuId, options) {
      options = options || {};

      // Create the new menu
      this.menus[menuId] = {
        roles: options.roles || this.defaultRoles,
        items: options.items || [],
        shouldRender: shouldRender
      };

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      delete this.menus[menuId];
    };

    // Add menu item object
    this.addMenuItem = function (menuId, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Push new menu item
      this.menus[menuId].items.push({
        title: options.title || '',
        state: options.state || '',
        type: options.type || 'item',
        class: options.class,
        roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.defaultRoles : options.roles),
        position: options.position || 0,
        items: [],
        shouldRender: shouldRender
      });

      // Add submenu items
      if (options.items) {
        for (var i in options.items) {
          this.addSubMenuItem(menuId, options.state, options.items[i]);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Add submenu item object
    this.addSubMenuItem = function (menuId, parentItemState, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === parentItemState) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: options.title || '',
            state: options.state || '',
            roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : options.roles),
            position: options.position || 0,
            shouldRender: shouldRender
          });
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === menuItemState) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    //Adding the topbar menu
    this.addMenu('topbar', {
      roles: ['*']
    });
  }
]);

'use strict';

// Create the Socket.io wrapper service
angular.module('core').service('Socket', ['Authentication', '$state', '$timeout',
  function (Authentication, $state, $timeout) {
    // Connect to Socket.io server
    this.connect = function () {
      // Connect only when authenticated
      if (Authentication.user) {
        this.socket = io();
      }
    };
    this.connect();

    // Wrap the Socket.io 'on' method
    this.on = function (eventName, callback) {
      if (this.socket) {
        this.socket.on(eventName, function (data) {
          $timeout(function () {
            callback(data);
          });
        });
      }
    };

    // Wrap the Socket.io 'emit' method
    this.emit = function (eventName, data) {
      if (this.socket) {
        this.socket.emit(eventName, data);
      }
    };

    // Wrap the Socket.io 'removeListener' method
    this.removeListener = function (eventName) {
      if (this.socket) {
        this.socket.removeListener(eventName);
      }
    };
  }
]);

'use strict';

// Configuring the Messages module
angular.module('messages').run(['Menus',
  function (Menus) {
    // Add the messages dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Messages',
      state: 'messages.list',
      roles: ['user', 'admin']
    });
    Menus.addMenuItem('topbar', {
      title: 'Search',
      state: 'search',
      roles: ['user', 'admin']
    });
  }
]);
'use strict';

// Setting up route
angular.module('messages').config(['$stateProvider',
  function ($stateProvider) {
    // Messages state routing
    $stateProvider
      .state('messages', {
        abstract: true,
        url: '/messages',
        template: '<ui-view/>'
      })
      .state('messages.list', {
        url: '/',
        templateUrl: 'modules/messages/client/views/messages.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('messages.view', {
        url: '/:messageId',
        templateUrl: 'modules/messages/client/views/view-message.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('messages.edit', {
        url: '/:messageId/edit',
        templateUrl: 'modules/messages/client/views/edit-message.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('search', {
        url: '/search',
        templateUrl: 'modules/messages/client/views/search-message.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);

'use strict';

// Messages controller
angular.module('messages').controller('MessagesController', ['$scope', '$stateParams', '$rootScope', '$location', '$http', 'Users', 'Authentication', 'Messages', '$window',
  function ($scope, $stateParams, $rootScope, $location, $http, Users, Authentication, Messages, $window) {
    $scope.authentication = Authentication;

    $scope.imagePopover = {
      imageUrl: '',
      templateUrl: 'imagePopoverTemplate.html',
      opened: false
    };

    $scope.stylePopover = {
      templateUrl: 'stylePopoverTemplate.html',
      opened: false
    };

    $scope.addUrl = function() {
      $rootScope.$broadcast('addStyle', $scope.imagePopover.imageUrl);
      $scope.imagePopover.imageUrl = '';
      $scope.imagePopover.opened = 'false';
    };

    $scope.addStyle = function(value) {
      $rootScope.$broadcast('addStyle', value);
      $scope.stylePopover.opened = 'false';
    };

    // Create new Message
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'messageForm');

        return false;
      }

      // Create new Message object
      var message = new Messages({
        content: this.content
      });

      // Pass the current user to prevent exploits
      message.displayedUser = $scope.authentication.user;

      // Don't Redirect after save
      message.$save(function (response) {
        // Clear form fields
        $scope.content = '';
        $scope.messages = $scope.loadMessages();
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
        //$window.location.reload();
      });
    };

    // Remove existing Message
    $scope.remove = function (message) {
      if (message) {
        message.$remove(function(){
          $location.path('messages/');
        });

        for (var i in $scope.messages) {
          if ($scope.messages[i] === message) {
            $scope.messages.splice(i, 1);
          }
        }
      } else {
        $scope.message.$remove(function () {
          $location.path('messages/');
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    // Update existing Message
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'messageForm');

        return false;
      }

      var message = $scope.message;

      message.$update(function () {
        $location.path('messages/' + message._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Messages
    $scope.find = function () {
      $scope.currentUser = $scope.getUser();
      $scope.loadMessages();
    };

    $scope.getUser = function() {
      $http.get('/api/messages/user').success(function(response) {
        $scope.currentUser = response;
      });
    };

    // Find existing Message
    $scope.findOne = function () {
      $scope.message = Messages.get({
        messageId: $stateParams.messageId
      });
    };

    $scope.currentPage = 1;
    $scope.maxSize = 5;

    $http.get('/api/messages/count').success(function(response) {
      $scope.totalItems = response.count;
    });

    $scope.setPage = function(value) {
    	$scope.currentPage = value;
    };

    $scope.pageChanged = function() {
    	$scope.loadMessages();
    };

    $scope.loadMessages = function() {
    	$http.get('/api/messages/page/' + $scope.currentPage).success(function(response) {
    		$scope.messages = response;
    	});
    };
  }
]);

'use strict';

// Messages controller
angular.module('messages').controller('SearchController', ['$scope', '$stateParams', '$filter', '$http', 'Authentication', 'Messages', '$window',
  function ($scope, $stateParams, $filter, $http, Authentication, Messages, $window) {
    $scope.user = Authentication.user;

    $scope.isCollapsed = true;
    $scope.status = {
      isAdvanced: true,
      isopen: false
    };

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 5;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };

    $scope.searchPosts = function() {
      console.log($scope.status.isAdvanced);
      if(!$scope.status.isAdvanced) {
        console.log('Basic Search');
        if($scope.fields.keyword)
          $http.get('/api/messages/basicsearch/' + $scope.fields.keyword).success(function(response){
            $scope.messages = response;
          });
      } else {
        console.log('Advanced Search');
        $http.get('/api/messages/advancedsearch/' + JSON.stringify($scope.fields)).success(function(response){
          $scope.messages = response;
        });
      }
    };

    $scope.items = [{value: 'Username', text: 'Search by Username'},
                    {value: 'Date', text: 'Search by Date'},
                    {value: 'Name', text: 'Search by Name'}];

    $scope.date_items = [{value: '=', text: 'Equals to'},
                         {value: '>=', text: 'Greather than or equal to'},
                         {value: '<=', text: 'Less than or equal to'},
                         {value: 'between', text: 'To'}];

    $scope.date = {date: '', range: '', type: 1};
    $scope.post = {username: '', firstName: '', type: 1};
    $scope.fields = {keyword: '',
                     additionalFields: [{name: 'Date',
                                         values: {date_start: new Date(), date_end: new Date(), range: '=', type: 1},
                                         template: 'field-date.html'}
                                        /*{name: 'Username',
                                         values: {name: '', type: 1},
                                         template: 'field-text.html'}*/]
                    };

    $scope.check = function() {
    };

    $scope.addField = function(option) {
      var filter = {name: '',
                    values: null,
                    template: ''};

      filter.name = option;
      if(option === 'Username' || option === 'Name') {
        filter.values = {name: '', type: 1};
        filter.template = 'field-text.html';
      } else if(option === 'Date') {
        filter.values = {date_start: new Date(), date_end: new Date(), range: '=', type: 1};
        filter.template = 'field-date.html';
      }

      if(filter.values)
        $scope.fields.additionalFields.push(filter);
    };

    $scope.removeField = function(index) {
      $scope.fields.additionalFields.splice(index, 1);
    };

  }
]);

'use strict';

angular.module('messages').directive('contentStyling', ['$rootScope', function($rootScope) {
  return {
    scope: { model: '=ngModel' },
    link: function(scope, element, attrs) {
      $rootScope.$on('addStyle', function(e, val) {
        var domElement = element[0];
        var moveSelection = 4;
        if(val.length <= 0)
          return;

        if(val === '<b>')
          val = '<b></b>';
        else if(val === '<i>')
          val = '<i></i>';
        else if(val === '<u>')
          val = '<u></u>';
        else {
          val = '<img src=\"' + val + '\"/>';
          moveSelection = 0;
        }

        if (document.selection) {
          domElement.focus();
          var sel = document.selection.createRange();
          sel.text = val;
          domElement.focus();
        } else if (domElement.selectionStart || domElement.selectionStart === 0) {
          var startPos = domElement.selectionStart;
          var endPos = domElement.selectionEnd;
          var scrollTop = domElement.scrollTop;
          domElement.value = domElement.value.substring(0, startPos) + val + domElement.value.substring(endPos, domElement.value.length);
          domElement.focus();
          domElement.selectionStart = startPos + val.length - moveSelection;
          domElement.selectionEnd = endPos + val.length - moveSelection;
          domElement.scrollTop = scrollTop;
        } else {
          domElement.value += val;
          domElement.focus();
        }

        scope.model = domElement.value;
      });
    }
  };
}]);

'use strict';

//Messages service used for communicating with the messages REST endpoints
angular.module('messages').factory('Messages', ['$resource',
  function ($resource) {
    return $resource('api/messages/:messageId', {
      messageId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

// Configuring the Store module
angular.module('store').run(['Menus',
  function (Menus) {
    // Add the donate item
    Menus.addMenuItem('topbar', {
      title: 'Donate',
      state: 'donate',
      roles: ['user','admin']
    });

    // Add the stores dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Store',
      state: 'store',
      type: 'dropdown',
      roles: ['user','admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'store', {
      title: 'View Cart',
      state: 'store.cart',
      roles: ['user','admin']
    });
    Menus.addSubMenuItem('topbar', 'store', {
      title: 'Add Item',
      state: 'store.add',
      roles: ['admin']
    });
    Menus.addSubMenuItem('topbar', 'store', {
      title: 'Purchase Items',
      state: 'store.list',
      roles: ['user','admin']
    });
  }
]);

'use strict';

// Setting up route
angular.module('store').config(['$stateProvider',
  function ($stateProvider) {
    // Articles state routing
    $stateProvider
      .state('donate', {
        url: '/donate',
        templateUrl: 'modules/store/client/views/donate.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('store', {
        abstract: true,
        url: '/store',
        template: '<ui-view/>'
      })
      .state('store.list', {
        url: '',
        templateUrl: 'modules/store/client/views/view-store.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('store.add', {
        url: '/newitem',
        templateUrl: 'modules/store/client/views/create-item.client.view.html',
        data: {
          roles: ['admin']
        }
      })
      .state('store.cart', {
        url: '/cart',
        templateUrl: 'modules/store/client/views/view-cart.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);

'use strict';

// Store controller
angular.module('store').controller('StoreController', ['$scope', '$stateParams', '$rootScope', '$location', '$http', 'Users', 'Authentication', 'FileUploader', 'Store', 'CartItem', '$timeout', '$state', '$window',
  function ($scope, $stateParams, $rootScope, $location, $http, Users, Authentication, FileUploader, Store, CartItem, $timeout, $state, $window) {
  	$scope.user = Authentication.user;
    $scope.imageURL = '/modules/store/client/img/items/default.png';
    $scope.value = 45.00;
    $scope.donation = {};
    $scope.donation.packs = [{'name': '$5 Donation Pack'  , 'value': '4edd40c86762e0fb1210185d'},
      		     	         {'name': '$10 Donation Pack', 'value': '4edd40c86762e0fb1211810d'},
      		     	         {'name': '$20 Donation Pack', 'value': '4edd40c86762e0fb1211820d'}];
    $scope.donation.pack = $scope.donation.packs[0].value;
    $scope.donation.quantity = 1;
    $scope.name = '5 Donation Pack';

    $scope.newCart = function() {
    	// Temporary Function
    	$http.get('/api/store/cart/newcart');
    };

    $scope.addPacktoCart = function() {
    	console.log('Adding (' + $scope.donation.pack + ' - ' + $scope.donation.quantity + ') item to cart');
    	var cartItem = new CartItem({
	      	_itemId: $scope.donation.pack,
	      	quantity: $scope.donation.quantity,
	      	displayedUser: $scope.user
      	});

      	cartItem.$save(function (response) {
        	// Clear form fields
        	$scope.donation.quantity = 1;
        	$scope.donation.pack = $scope.donation.packs[0].value;
      	}, function (errorResponse) {
        	$scope.error = errorResponse.data.message;
      	});
    };

    $scope.addToCart = function() {
      console.log('Adding (' + $scope.quantity + ') items to cart.');
	  $scope.error = null;

	  // TO DO Error Checking

      // Create new Message object
      var cartItem = new CartItem({
      	_itemId: $scope.preview._id,
      	name: $scope.preview.name,
      	itemImageURL: $scope.preview.itemImageURL,
      	price: $scope.preview.price,
      	displayedUser: $scope.user, // Validation of user
      	quantity: $scope.quantity
      });

      console.log(cartItem);

      // Don't Redirect after save
      cartItem.$save(function (response) {
        // Clear form fields
        $scope.quantity = 1;
        $scope.preview = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.removeCartItem = function(itemId) {
    	$http.delete('/api/store/cart/' + itemId).success(function (response){
    		console.log('Deleted: ' + response);
    	});
    };

    $scope.findCartItems = function() {
    	$http.get('/api/store/cart').success(function(cart){
    		$scope.cart = cart;
    		console.log($scope.cart);
    	});
    };

    $scope.checkout = function() {
    	console.log("CHECKOUT");
    	$http.get('/api/store/cart/checkout').success(function(response){
    		$window.location = response;
    	});
    };

    $scope.confirmCheckout = function() {
    	console.log("Confirming Checkout!");
    	var params = $location.search();
    	$http.post('api/store/cart/confirmcheckout', params);
    };

  	$scope.addItem = function(isValid) {
    	$scope.error = null;

      	if (!isValid) {
	        $scope.$broadcast('show-errors-check-validity', 'itemForm');
        	return false;
      	}

	    $scope.uploadProfilePicture();
    };

    // Find a list of Items
    $scope.findItems = function () {
      	$scope.items = $scope.loadItems();
    };

    // Find existing item
    $scope.displayItem = function (item) {
	  	$scope.preview = item;
	  	$scope.quantity = 1;
    };

    $scope.currentPage = 1;
    $scope.maxSize = 5;

    $http.get('/api/store/count').success(function(response) {
      $scope.totalShopItems = response.count;
    });

    $scope.setPage = function(value) {
    	$scope.currentPage = value;
    };

    $scope.pageChanged = function() {
    	$scope.loadItems();
    };

    $scope.loadItems = function() {
    	$http.get('/api/store/page/' + $scope.currentPage).success(function(response) {
    		$scope.items = response;
    	});
    };

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: '/api/store/additem'
    });

    // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    $scope.uploader.onBeforeUploadItem = function(item) {
      	item.formData.push({
      		'name': $scope.item.name, 
      		'description': $scope.item.description, 
      		'price': $scope.item.price
  		});
    };

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the user has successfully uploaded a new picture
    $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      $scope.success = true;

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();

      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.uploadProfilePicture = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
      $scope.imageURL = '/modules/store/client/img/items/default.png';
    };
  }
]);
'use strict';

//Item service used for communicating with the store REST endpoints
angular.module('store').factory('Store', ['$resource',
  function ($resource) {
    return $resource('api/store/item/:itemId', {
      itemId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

angular.module('cart').factory('CartItem', ['$resource',
  function ($resource) {
    return $resource('api/store/cart/:itemId', {
      itemId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

// Configuring the Articles module
angular.module('users.admin').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Create Users',
      state: 'admin.create'
    });
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Backup Posts',
      state: 'admin.backup'
    });
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'View Carts',
      state: 'admin.carts'
    });
  }
]);

'use strict';

// Setting up route
angular.module('users.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin.create', {
        url: '/create',
        templateUrl: 'modules/users/client/views/admin/admin-signup.client.view.html',
        controller: 'AdminAuthController'
      })
      .state('admin.backup', {
        url: '/backup',
        templateUrl: 'modules/users/client/views/admin/admin-backup.client.view.html',
        controller: 'BackUpController'
      })
      .state('admin.carts', {
        url: '/carts',
        templateUrl: 'modules/users/client/views/admin/admin-view-carts.client.view.html',
        controller: 'CartController'
      });/*
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.View.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.View.get({
              userId: $stateParams.userId
            });
          }]
        }
      });*/
  }
]);

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push(['$q', '$location', 'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
              case 401:
                // Deauthenticate the global user
                Authentication.user = null;

                // Redirect to signin page
                $location.path('signin');
                break;
              case 403:
                // Add unauthorized behaviour
                break;
            }

            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

'use strict';

// Configuring the Articles module
angular.module('users').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Profile',
      state: 'profile',
      type: 'dropdown',
      roles: ['user','admin']
    });
    /*
    Menus.addSubMenuItem('topbar', 'profile', {
      title: 'View Profile',
      state: 'profile.view'
    });*/
    Menus.addSubMenuItem('topbar', 'profile', {
      title: 'Users Page',
      state: 'users'
    });
  }
]);

'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider
      .state('users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController'
      })
      .state('settings', {
        abstract: true,
        url: '/settings',
        templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('settings.profile', {
        url: '/profile',
        templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html'
      })
      .state('settings.password', {
        url: '/password',
        templateUrl: 'modules/users/client/views/settings/change-password.client.view.html'
      })
      .state('settings.picture', {
        url: '/picture',
        templateUrl: 'modules/users/client/views/settings/change-profile-picture.client.view.html'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'modules/users/client/views/authentication/signup.client.view.html'
      })
      .state('signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html'
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html'
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html'
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html'
      })
      .state('password.reset.form', {
        url: '/:token',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html'
      })
      .state('profile', {
        abstract: true,
        url: '/profile',
        template: '<ui-view/>'
      })
      .state('profile.view', {
        url: '/:userId',
        templateUrl: 'modules/users/client/views/profile/user-profile.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);

'use strict';

angular.module('users.admin').controller('AdminAuthController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'Admin',
  function ($scope, $state, $http, $location, $window, Authentication, Admin) {
    Admin.Check.query();
    $scope.authentication = Authentication;

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    var maleItems = ['Mr','Sir','Senior','Count'];
    var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

    $scope.gender = {};
      	  $scope.gender.names = [{'name': 'Male'  , 'value': 'male'},
      		     	                 {'name': 'Female', 'value': 'female'}];

    $scope.gender.salutations = maleItems;

    $scope.access = {};
    $scope.access.levels = [{'name': 'User'  , 'value': 'user'},
                           {'name': 'Admin', 'value': 'admin'}];

	  // Setting first option as selected in gender names and salutations
	  $scope.gender.name = $scope.gender.names[0].value;
    $scope.gender.salutation = $scope.gender.salutations[0];
    $scope.access.level = $scope.access.levels[0].value;

    // Update salutation combobox if gender.name scope variable changed
    $scope.$watch('gender.name', function (gender) {
      if(gender.toLowerCase() === 'male') {
        $scope.gender.salutations = maleItems;
      } else if(gender.toLowerCase() === 'female') {
        $scope.gender.salutations = femaleItems;
      }
      $scope.gender.salutation = $scope.gender.salutations[0];
    });

    var roles;
    $scope.$watch('access.level', function(access) {
      if($scope.access.level.toString() === 'admin') {
        roles = ['user', 'admin'];
      } else if($scope.access.level.toString() === 'user') {
        roles = ['user'];
      }
    });

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      $scope.credentials.gender = $scope.gender.name;
      $scope.credentials.salutation = $scope.gender.salutation;
      $scope.credentials.roles = roles;

      $http.post('/api/admin/signup', $scope.credentials).success(function (response) {
        // And redirect to the previous or home page
        //$state.go($state.previous.state.name || 'home', $state.previous.params);
        $state.go('admin.users');
      }).error(function (response) {
        $scope.error = response.message;
        if($scope.error.indexOf('authorized') >= 0)
          $window.location.reload();
      });
    };
  }
]);

'use strict';

angular.module('users.admin').controller('BackUpController', ['$scope', '$http', '$state', '$window', 'Authentication', 'Backup',
  function ($scope, $http, $state, $window, Authentication, Backup) {
    Backup.query(function(data){
    	$scope.backups = data;
    });

    $scope.authentication = Authentication;

    $scope.createBackup = function() {
    	$http.post('/api/admin/backup').success(function(data){
            $window.location.reload();
    	});
    };

    $scope.findBackups = function() {
        Backup.query(function(data){
            $scope.backups = data;
        });
    };

    $scope.downloadFile = function(file) {
    	console.log('Downloading file ' + file.name);
    	$http.get('/api/admin/download/' + file.name).success(function(data){
    		var element = angular.element('<a/>');
            element.attr({
                href: 'data:application/csv,' + encodeURIComponent(data),
                target: '_blank',
                download: file.name
            })[0].click();
    	});
    };
  }
]);

'use strict';

angular.module('users.admin').controller('UserListController', ['$scope', '$filter', 'Admin',
  function ($scope, $filter, Admin) {
    Admin.View.query(function(data) {
      $scope.users = data;
      $scope.buildPager();
    });

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.users, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

angular.module('users.admin').controller('UserController', ['$scope', '$state', 'Authentication', 'userResolve',
  function ($scope, $state, Authentication, userResolve) {
    $scope.authentication = Authentication;
    $scope.user = userResolve;

    $scope.remove = function (user) {
      if (confirm('Are you sure you want to delete this user?')) {
        if (user) {
          user.$remove();

          $scope.users.splice($scope.users.indexOf(user), 1);
        } else {
          $scope.user.$remove(function () {
            $state.go('admin.users');
          });
        }
      }
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = $scope.user;

      user.$update(function () {
        $state.go('admin.user', {
          userId: user._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication',
  function ($scope, $state, $http, $location, $window, Authentication) {
    $scope.authentication = Authentication;

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/messages/');
    }

    var maleItems = ['Mr','Sir','Senior','Count'];
    var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

    $scope.gender = {};
      	  $scope.gender.names = [{'name': 'Male'  , 'value': 'male'},
      		     	                 {'name': 'Female', 'value': 'female'}];

    $scope.gender.salutations = maleItems;

	  // Setting first option as selected in gender names and salutations
	  $scope.gender.name = $scope.gender.names[0].value;
    $scope.gender.salutation = $scope.gender.salutations[0];

    // Update salutation combobox if gender.name scope variable changed
    $scope.$watch('gender.name', function (gender) {
      if(gender.toLowerCase() === 'male') {
        $scope.gender.salutations = maleItems;
      } else if(gender.toLowerCase() === 'female') {
        $scope.gender.salutations = femaleItems;
      }
      $scope.gender.salutation = $scope.gender.salutations[0];
    });

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      $scope.credentials.gender = $scope.gender.name;
      $scope.credentials.salutation = $scope.gender.salutation;

      $http.post('/api/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        //$state.go($state.previous.state.name || 'home', $state.previous.params);
        console.log('redirected!');
        $location.path('/');
        //$state.go('messages.list');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        //$state.go($state.previous.state.name || 'messages.list', $state.previous.params);
        $state.go('messages.list');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);

angular.module('users').controller('DatePickerController', ['$scope',
	function($scope, $http, $location) {
    $scope.today = function() {
      $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function () {
      $scope.dt = null;
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function($event) {
      $scope.status.opened = true;
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'MM/dd/yyyy', 'shortDate'];
    $scope.format = $scope.formats[2];

    $scope.status = {
      opened: false
    };

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 2);
    $scope.events =
      [
        {
          date: tomorrow,
          status: 'full'
        },
        {
          date: afterTomorrow,
          status: 'partially'
        }
      ];

    $scope.getDayClass = function(date, mode) {
      if (mode === 'day') {
        var dayToCheck = new Date(date).setHours(0,0,0,0);

        for (var i=0;i<$scope.events.length;i++){
          var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

          if (dayToCheck === currentDay) {
            return $scope.events[i].status;
          }
        }
      }

      return '';
    };
	}
]);

'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
  function ($scope, $stateParams, $http, $location, Authentication) {
    $scope.authentication = Authentication;

    //If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    // Submit forgotten password account id
    $scope.askForPasswordReset = function () {
      $scope.success = $scope.error = null;

      $http.post('/api/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;

      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };

    // Change user password
    $scope.resetUserPassword = function () {
      $scope.success = $scope.error = null;

      $http.post('/api/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ProfileController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Profile',
  function ($scope, $stateParams, $location, $http, Authentication, Profile) {
    $scope.authentication = Authentication;

    $scope.findOne = function () {
      $scope.profile = Profile.get({
        userId: $stateParams.userId
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ChangePasswordController', ['$scope', '$http', 'Authentication',
  function ($scope, $http, Authentication) {
    $scope.user = Authentication.user;

    // Change user password
    $scope.changeUserPassword = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'passwordForm');

        return false;
      }

      $scope.passwordDetails.authUser = $scope.user;

      $http.post('/api/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.$broadcast('show-errors-reset', 'passwordForm');
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ChangeProfilePictureController', ['$scope', '$timeout', '$window', 'Authentication', 'FileUploader',
  function ($scope, $timeout, $window, Authentication, FileUploader) {
    $scope.user = Authentication.user;
    $scope.imageURL = $scope.user.profileImageURL;

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/users/picture'
    });

    // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    $scope.uploader.onBeforeUploadItem = function(item) {
      item.formData.push({displayedUserId: $scope.user._id});
    };

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the user has successfully uploaded a new picture
    $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      $scope.success = true;

      // Populate user object
      $scope.user = Authentication.user = response;

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();

      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.uploadProfilePicture = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
      $scope.imageURL = $scope.user.profileImageURL;
    };
  }
]);

'use strict';

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication', '$window',
  function ($scope, $http, $location, Users, Authentication, $window) {
    $scope.user = Authentication.user;

    var flag = true;

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    var maleItems = ['Mr','Sir','Senior','Count'];
    var femaleItems = ['Miss','Ms','Mrs','Madame','Majesty','Seniora'];

    $scope.gender = {};
    $scope.gender.names = [{'name': 'Male'  , 'value': 'male'},
      		     	           {'name': 'Female', 'value': 'female'}];
    $scope.gender.salutations = maleItems;

 	  // Setting first option as selected in gender names and salutations
 	  $scope.gender.name = $scope.user.gender;
    $scope.gender.salutation = $scope.user.salutation;

    $scope.user.birthDate = new Date($scope.user.birthDate);

     // Update salutation combobox if gender.name scope variable changed
    $scope.$watch('gender.name', function (gender) {
      if(gender.toLowerCase() === 'male') {
        $scope.gender.salutations = maleItems;
      } else if(gender.toLowerCase() === 'female') {
        $scope.gender.salutations = femaleItems;
      }
      if(!flag) {
        $scope.gender.salutation = $scope.gender.salutations[0];
      } else {
        flag = false;
      }
    });

    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      $scope.user.gender = $scope.gender.name;
      $scope.user.salutation = $scope.gender.salutation;

      var user = new Users($scope.user);
      user.birthDate = new Date($scope.user.birthDate);

      user.displayedUser = $scope.user;

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'userForm');

        $scope.success = true;
        //Authentication.user = response;
      }, function (response) {
        $scope.error = response.data.message;
        //$window.location.reload();
      });
    };
  }
]);

'use strict';

angular.module('users').controller('SocialAccountsController', ['$scope', '$http', 'Authentication',
  function ($scope, $http, Authentication) {
    $scope.user = Authentication.user;

    // Check if there are additional accounts
    $scope.hasConnectedAdditionalSocialAccounts = function (provider) {
      for (var i in $scope.user.additionalProvidersData) {
        return true;
      }

      return false;
    };

    // Check if provider is already in use with current user
    $scope.isConnectedSocialAccount = function (provider) {
      return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
    };

    // Remove a user social account
    $scope.removeUserSocialAccount = function (provider) {
      $scope.success = $scope.error = null;

      $http.delete('/api/users/accounts', {
        params: {
          provider: provider
        }
      }).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.user = Authentication.user = response;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('SettingsController', ['$scope', 'Authentication',
  function ($scope, Authentication) {
    $scope.user = Authentication.user;
  }
]);

'use strict';

// Users directive used to force lowercase input
angular.module('users').directive('lowercase', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function (input) {
        return input ? input.toLowerCase() : '';
      });
      element.css('text-transform', 'lowercase');
    }
  };
});

/*
angular.module('users').animation('.slide', [function() {
	return {
		enter: function(element, doneFn) {
			jQuery(element).fadeIn(1000, doneFn);
		},
		move: function(element, doneFn) {
			jQuery(element).fadeIn(1000, doneFn);
		},
		leave: function(element, doneFn) {
			jQuery(element).fadeOut(1000, doneFn);
		}
	}
}]);*/
'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window',
  function ($window) {
    var auth = {
      user: $window.user
    };

    return auth;
  }
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
  function ($resource) {
    return $resource('api/users', {}, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

angular.module('users').factory('Profile', ['$resource',
  function ($resource) {
    return $resource('api/profile/:userId', {
      userId: '@_id'
    });
  }
]);

//TODO this should be Users service
angular.module('users.admin').factory('Admin', ['$resource',
  function ($resource) {
    return {
      Check: $resource('api/admin/isadmin'),
      View: $resource('api/users/:userId', {
        userId: '@_id'
      }, {
        update: {
          method: 'PUT'
        }
      })
    };
  }
]);

angular.module('users.admin').factory('Backup', ['$resource',
  function ($resource) {
    return $resource('api/admin/backup');
  }
]);