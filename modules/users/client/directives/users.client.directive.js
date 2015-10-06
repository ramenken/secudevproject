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