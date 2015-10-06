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
