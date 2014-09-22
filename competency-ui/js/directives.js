'use strict';

/* Directives */


angular.module('CompetencyManager.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('ngEnter', function() {
    return function(scope, elm, attrs) {
      elm.bind("keydown keypress", function(event){
        if(event.which === 13){
          scope.$apply(function(){
            scope.$eval(attrs.ngEnter, {'event': event});
          });

          event.preventDefault();
        }  
      });
    };
  }).
  directive('ngEscape', function() {
    return function(scope, elm, attrs) {
      elm.bind("keydown keypress", function(event){
        if(event.which === 27){
          scope.$apply(function(){
            scope.$eval(attrs.ngEscape, {'event': event});
          });

          event.preventDefault();
        }  
      });
    };
  });

