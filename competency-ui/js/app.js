'use strict';


// Declare app level module which depends on filters, and services
angular.module('CompetencyManager', [
  'ngRoute',
  'ui.bootstrap.modal',
  'ui.bootstrap.typeahead',
  'CompetencyManager.filters',
  'CompetencyManager.services',
  'CompetencyManager.directives',
  'CompetencyManager.controllers',
  'CompetencyManager.definitions',
]).
config(['$routeProvider', function($routeProvider) {
  $(document).foundation();

  $routeProvider.when('/login', 
    {
      templateUrl: 'partials/login.html', 
      controller: 'loginController'
    }
  );
  
  $routeProvider.when('/home', 
    {
      templateUrl: 'partials/home.html', 
      controller: 'homeController'
    }
  );


  $routeProvider.when('/search/:context', 
    {
      templateUrl: 'partials/search/search.html', 
      controller: 'searchController'
    }
  );

  $routeProvider.when('/results/:context', 
    {
      templateUrl: 'partials/search/results.html', 
      controller: 'resultsController',
    }
  );


  $routeProvider.when('/view/:context/:modelId/:itemId', 
    {
      templateUrl: 'partials/view/viewCompetency.html', 
      controller: 'viewController'
    }
  );
  $routeProvider.when('/view/:context/:itemId', 
    {
      templateUrl: function(routeParams){
        switch(routeParams.context){
        case 'profile':
          return 'partials/view/viewProfile.html';
        case 'model':
          return 'partials/view/viewModel.html';
        default:
          return 'partials/view/viewCompetency.html';
        }
      }, 
      controller: 'viewController'
    }
  );


  $routeProvider.when('/edit/profile/:profileId', 
    {
      templateUrl: 'partials/edit/editProfile.html', 
      controller: 'profileEditController'
    }
  );
  $routeProvider.when('/edit/competency/:modelId/:competencyId', 
    {
      templateUrl: 'partials/edit/editCompetency.html', 
      controller: 'competencyEditController'
    }
  );
  $routeProvider.when('/edit/model/:modelId', 
    {
      templateUrl: 'partials/edit/editModel.html', 
      controller: 'modelEditController'
    }
  );
  $routeProvider.when('/edit/record/:userId/:recordId', 
    {
      templateUrl: 'partials/edit/editRecord.html', 
      controller: 'recordEditController'
    }
  );

  $routeProvider.when('/create/profile', 
    {
      templateUrl: 'partials/edit/editProfile.html', 
      controller: 'profileEditController'
    }
  );
  $routeProvider.when('/create/competency', 
    {
      templateUrl: 'partials/edit/editCompetency.html', 
      controller: 'competencyEditController'
    }
  );
  $routeProvider.when('/create/model/', 
    {
      templateUrl: 'partials/edit/editModel.html', 
      controller: 'modelEditController'
    }
  );
  $routeProvider.when('/create/record', 
    {
      templateUrl: 'partials/edit/editRecord.html', 
      controller: 'recordEditController'
    }
  );
  
  $routeProvider.otherwise({redirectTo: '/login'});

}]).run(['$rootScope', '$location', '$window', 'appCache', 'search',
      'context', '$routeParams', 'modelItem',
function($rootScope, $location, $window, appCache, search, contexts, $routeParams, modelItem){
  appCache.loadCaches();


  if(appCache.modelCache['model-default'] == undefined){
    modelItem.getAllModels();
  }


  $rootScope.goHome = function(){
    $location.path("/home");
  }

  $rootScope.showSearch = function(context){
    appCache.saveCaches();

    appCache.pushPrevLoc($location.path());

    if(appCache.context != context){
      search.query = "";
    }

    appCache.setContext(context);
    $location.path("/search/"+appCache.context);
  }

  $rootScope.showResults = function(context){
    appCache.saveCaches();

    appCache.pushPrevLoc($location.path());

    appCache.setContext(context);
    
    switch(context){
    case contexts.competency:
      //search.results = appCache.competencyCache;
      break;
    case contexts.model:
      //search.results = appCache.modelCache;
      break;
    case contexts.profile:
      //search.results = appCache.profileCache;
      break;
    }
    if($location.path() != "/results/"+appCache.context){
      $location.path("/results/"+appCache.context);
    }
  }

  $rootScope.showCreate = function(context){
    appCache.saveCaches();

    appCache.pushPrevLoc($location.path());

    // Save User Id if Creating Record
    var id;
    if(appCache.context == contexts.profile){
      id = appCache.currentItem.id;
    }else{
      id = "";
    }

    appCache.setNewItem(context);

    $location.path("/create/"+appCache.context);

    // Set User ID in Search Parameters if Creating a Record
    if(context == contexts.record && appCache.prevContext == contexts.profile){
      $location.search({'userId': id}) ;
    }
  }

  $rootScope.showEdit = function(context, itemId, modelId){
    appCache.saveCaches();

    appCache.pushPrevLoc($location.path());
    
    var location = "/edit/"+context;

    switch(context){
      case contexts.competency:
      location += "/"+modelId+"/"+itemId;
      break;
      case contexts.model:
        if(itemId == "model-default"){
          alert("Cannot edit default model!");
          return false;
        }

      case contexts.profile:
        location += "/"+itemId;
        break;
      case contexts.record:
        location += "/"+modelId+"/"+itemId;
        break;
      default:
      break;
    }

    $location.path(location);
  }

  $rootScope.showView = function(context, itemId, modelId){
    appCache.saveCaches();

    appCache.pushPrevLoc($location.path());

    appCache.setCurrentItem(context, itemId, modelId);

    var location = "/view/"+context;

    switch(context){
    case contexts.competency:
      location += "/"+modelId+"/"+itemId;
      break;
    case contexts.model:
    case contexts.profile:      
      location += "/"+itemId;
      break;
    default:
      break;
    }

    $location.path(location);
  }

  $rootScope.logout = function(){
    $location.path("/login");
  }

  $rootScope.goBack = function(){
    appCache.saveCaches();

    var prevLoc = appCache.popPrevLoc();

    if(prevLoc == undefined){
      $rootScope.goHome();
    }else{
      appCache.setContext(appCache.prevContext);

      if(prevLoc.indexOf("edit") == -1 && prevLoc.indexOf("create") == -1 && prevLoc.indexOf("results") == -1){
        $window.history.back();  
      }else{
        if($location.path().indexOf("search") != -1){
          this.goHome();
        }else{
          this.showResults();  
        }
      }
    }
  }

  $rootScope.objectLength = function(obj){
    if(obj instanceof Object){
      return Object.keys(obj).length;  
    }else{
      return 0;
    }
  }

  $rootScope.objectKeys = function(obj){
    if(obj instanceof Object){
      return Object.keys(obj);
    }else{
      return 0;
    }
  }

  $rootScope.mathCeil = function(num){
    return Math.ceil(num);
  }
}]);
