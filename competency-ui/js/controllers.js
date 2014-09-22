'use strict';

/* Controllers */

angular.module('CompetencyManager.controllers', []).
  controller('loginController', ['$scope', '$location', '$rootScope', 'appCache', function($scope, $location, $rootScope, appCache) {
    $scope.appCache = appCache;

    $scope.login = function(){
      $location.path("/home");
      $rootScope.username = $scope.username;
    };


  }]).
  controller('homeController', ['$scope', 'context', 'appCache', function($scope, context, appCache) {
    $scope.context = context;
    $scope.appCache = appCache;
  }]).

  controller('headerController', ['$scope', 'context', 'appCache', function($scope, context, appCache) {
    $scope.context = context;
    $scope.appCache = appCache;
  }]).



  controller('searchController', ['$scope', '$routeParams', '$location', 'search', 'appCache', 
    function($scope, $routeParams, $location, search, appCache) {
    $scope.search = search;
    $scope.appCache = appCache;

    if(appCache.context == "" || appCache.context == undefined){
      if($routeParams.context != undefined && $routeParams.context != "undefined" && $routeParams.context != ""){
        appCache.setContext($routeParams.context);
      }else{
        $scope.goHome();
      }
    }
    
  }]).



  controller('resultsController', ['$scope', '$routeParams', '$location', 'search', 'appCache', function($scope, $routeParams, $location, search, appCache) {
    $scope.search = search;
    $scope.appCache = appCache;   

    if(appCache.context == "" || appCache.context == undefined){
      if($routeParams.context != undefined && $routeParams.context != ""){
        appCache.context = $routeParams.context;  
      }else{
        $scope.goHome();
      }
    }

    if(search.query == undefined || search.query == ""){
      if($location.search().query == undefined){
        $scope.showSearch();
      }else{
        search.query = $location.search().query;  

      search.runSearch(appCache.context);
      }
      
    }else{
      if($location.search().query == undefined){
        $location.search('query', search.query);  

        search.runSearch(appCache.context);
      }else{
        search.query = $location.search().query;

        search.runSearch(appCache.context);
      }
      
    }

    $scope.$on('$destroy', function(){
      search.query = $location.$$search.query;
      $location.search('query', undefined)
      $location.$$search = {};
    })

    $scope.resultTemplate = function(){
      var templateUrl = "partials/search/"+appCache.context+"Result.html";

      return templateUrl;
    }

    $scope.resultPages = function(resultLength){
    return Math.ceil(resultLength / 10);
  }
  }]).



  controller('viewController', ['$scope', '$routeParams', '$location', 'search', 'appCache', 'modelItem', 'competencyItem', 'context', 
  function($scope, $routeParams, $location, search, appCache, modelItem, competencyItem, contexts) {
    $scope.appCache = appCache;
    $scope.search = search;

    $scope.relatedCompetencies = {}

    $scope.viewRecordStart = 0;
    $scope.viewRecordLength = 3;
    $scope.viewableRecords = [];
    $scope.allRecords = [];

    $scope.recordQuery = "";
    
    $scope.filterDescription = function(description){
      if(description.text != undefined){
        return true;
      }else{
        return false;
      }
    }

    appCache.setCurrentItem($routeParams.context, $routeParams.itemId, $routeParams.modelId).
    then(function(result){
      switch(appCache.context){
      case contexts.competency:
        var rels = appCache.currentItem.relationships;

        for(var type in rels){
          for(var id in rels[type]){
            competencyItem.getCompetency(rels[type][id], appCache.currentItem.modelId).
            then(function(result){
            	for(var compId in result){
                  $scope.relatedCompetencies[compId] = result[compId];
                }
            }, function(error){
              console.log(error);
            }, function(tempResult){
              for(var compId in tempResult){
              $scope.relatedCompetencies[compId] = tempResult[compId];
              }
            });
          }
        }
        break;
      case contexts.profile:
        if($scope.viewableRecords == undefined || $scope.viewableRecords.length != 0){
          $scope.viewableRecords = [];
        }
        if($scope.allRecords == undefined || $scope.allRecords.length != 0){
          $scope.allRecords = [];
        }
        var i = 0;
        for(var id in appCache.currentItem.records){
          if(i < $scope.viewRecordLength){
            $scope.viewableRecords.push(appCache.currentItem.records[id]) 
          }
          $scope.allRecords.push(appCache.currentItem.records[id]);
          i++;
        }
        break;
      }
    }, function(error){
      console.log(error);
    }, function(tempResult){
      switch(appCache.context){
      case contexts.competency:
        var rels = tempResult.relationships;

        for(var type in rels){
          for(var id in rels[type]){
            competencyItem.getCompetency(rels[type][id], appCache.currentItem.modelId).
            then(function(result){
              for(var compId in result){
                if(compId == rels[type][id]){
                  $scope.relatedCompetencies[compId] = result[compId];
                }
              }
            }, function(error){
              console.log(error);
            }, function(tempResult){
              for(var compId in tempResult){
                if(compId == rels[type][id]){
                  $scope.relatedCompetencies[compId] = tempResult[compId];
                }
              }
            });
          }
        }
        break;
      case contexts.profile:
        if($scope.viewableRecords == undefined || $scope.viewableRecords.length != 0){
          $scope.viewableRecords = [];
        }
        if($scope.allRecords == undefined || $scope.allRecords.length != 0){
          $scope.allRecords = [];
        }
        var i = 0;
        for(var id in appCache.currentItem.records){
          if(i < $scope.viewRecordLength){
            $scope.viewableRecords.push(appCache.currentItem.records[id]) 
          }
          $scope.allRecords.push(appCache.currentItem.records[id]);
          i++;
        }
        break;
      }
    });

  $scope.changeViewable = function(change){
    if($scope.viewRecordStart + change >= 0 && $scope.viewRecordStart + change <= $scope.allRecords.length){
      $scope.viewableRecords = [];

      $scope.viewRecordStart = $scope.viewRecordStart + change;
      var i = 0;
        for(var j in $scope.allRecords){
          if(i >= $scope.viewRecordStart && i < $scope.viewRecordStart + $scope.viewRecordLength){
            $scope.viewableRecords.push($scope.allRecords[j]) 
          }
          i++;
        }
    }
  }

  $scope.searchRecords = function(val){
    return true;
  }

    
  }]).



  controller('competencyEditController', ['$scope', '$routeParams', '$modal', 'appCache', 'search', 'context', 'competencyItem', 'modelItem', 'competencyRelationships',
  function($scope, $routeParams, $modal, appCache, search, context, competencyItem, modelItem, competencyRelationships) {
    $scope.appCache = appCache;
    $scope.competencyItem = competencyItem;
    $scope.competencyRelationships = competencyRelationships;

    $scope.relatedCompetencies = {};

  modelItem.getAllModels();

  $scope.levelOptions = {"TorF": "Binary (T/F)", "list": "Ordered List"};
  $scope.cachedLevels = [];

  $scope.levelType = "TorF";

  $scope.selectorHelper = {};
  
  $scope.typeaheadSearching = {};
  $scope.typeaheadDummy = {};

  for(var relationshipName in competencyRelationships){
    $scope.selectorHelper[relationshipName] = [];
    $scope.typeaheadSearching[relationshipName] = [];
    $scope.typeaheadDummy[relationshipName] = [];
  }

    var checkIfBinary = function(){
      if(Object.keys(appCache.editedItem.levels).length == 0 || 
          ($.inArray(':true', Object.keys(appCache.editedItem.levels)) != -1 && 
          $.inArray(':false', Object.keys(appCache.editedItem.levels)) != -1 && 
          Object.keys(appCache.editedItem.levels).length == 2)){
      $scope.levelType = "TorF";
    }else{
      $scope.levelType = "list";
    }
    }

    var setRelationshipVariables = function(result, rels, type, id){
      for(var type in rels){
        for(var i in rels[type]){
          for(var id in result){
            if(id == rels[type][i]){
              $scope.relatedCompetencies[id] = result[id];
            $scope.typeaheadDummy[type][i] = result[id].title;
            }
          }
        }
      }
    }


    if($routeParams.competencyId != undefined){
    appCache.startEdit(context.competency, $routeParams.competencyId, $routeParams.modelId).
    then(function(editedItem){
      var rels = appCache.editedItem.relationships;

      if(Object.keys(rels).length > 0){
        for(var name in rels){
          for(var i in rels[name]){
            $scope.selectorHelper[name][i] = name
          }
        }
      }

      for(var type in rels){
          for(var id in rels[type]){
            var locType = type;
            var locId = id;
            competencyItem.getCompetency(rels[type][id], appCache.currentItem.modelId).
            then(function(result){
              setRelationshipVariables(result, rels, locType, locId);
            }, function(error){
              console.log(error);
            }, function(tempResult){
              setRelationshipVariables(tempResult, rels, locType, locId);
            });
          }
        }
    }, function(error){
      console.log(error);
    }, function(tempItem){
      var rels = tempItem.relationships;

      if(Object.keys(rels).length > 0){
        $scope.new_name = Object.keys(rels)[0];
      }

      for(var type in rels){
          for(var id in rels[type]){
            var locType = type;
            var locId = id;
            competencyItem.getCompetency(rels[type][id], appCache.currentItem.modelId).
            then(function(result){
              setRelationshipVariables(result, rels, locType, locId);
            }, function(error){
              console.log(error);
            }, function(tempResult){
              setRelationshipVariables(tempResult, rels, locType, locId);
            });
          }
        }
    });
    $scope.create = false;
  }else{
    appCache.startCreate(context.competency);
    $scope.create = true;
    $scope.levelType = "TorF";
  }

    $scope.$watch('appCache.editedItem.levels', function(){
      if(appCache.editedItem.levels != undefined){
        checkIfBinary();  
      } 
    });

  $scope.addDescription = function(){
    if(appCache.editedItem.descriptions == undefined){
      appCache.editedItem.descriptions = [];
      
      appCache.editedItem.descriptions.push({text:""})
    }else{
      if(appCache.editedItem.descriptions.length == 0 || appCache.editedItem.descriptions[appCache.editedItem.descriptions.length -1].text != ""){
        appCache.editedItem.descriptions.push({text:""})
      }else{
        console.log('Need to enter a description before adding a new one');
      }
    }
  }

  $scope.removeField = function(field, idx){
    if(appCache.editedItem[field] != undefined && appCache.editedItem[field][idx] != undefined){
      appCache.editedItem[field].splice(idx, 1);
    }
  }

  $scope.addRelationship = function(){
    if(appCache.editedItem.relationships == undefined){
      appCache.editedItem.relationships = {};
    }

    var firstPossibleRelationship = Object.keys(competencyRelationships)[0];
    if(appCache.editedItem.relationships[firstPossibleRelationship] == undefined){
      appCache.editedItem.relationships[firstPossibleRelationship] = [""];
      $scope.selectorHelper[firstPossibleRelationship].push(firstPossibleRelationship);
    }else if(appCache.editedItem.relationships[firstPossibleRelationship][appCache.editedItem.relationships[firstPossibleRelationship].length - 1] != "") {
      appCache.editedItem.relationships[firstPossibleRelationship].push("");
      $scope.selectorHelper[firstPossibleRelationship].push(firstPossibleRelationship);
    }else{
      console.log("cannot add another relationship without completing the previous");
    }
  }

  $scope.moveRelationship = function(relationshipName, competencyId, newRelationshipName){
    console.log(relationshipName);
    console.log(newRelationshipName);
    console.log(competencyId);

    if(appCache.editedItem.relationships[newRelationshipName] == undefined){
      appCache.editedItem.relationships[newRelationshipName] = [];
    }
    appCache.editedItem.relationships[newRelationshipName].push(competencyId);
    
    if(competencyId != ""){
      $scope.typeaheadDummy[newRelationshipName].push($scope.relatedCompetencies[competencyId].title);
    }

    var index = appCache.editedItem.relationships[relationshipName].indexOf(competencyId)

    appCache.editedItem.relationships[relationshipName].splice(index, 1);
    $scope.typeaheadDummy[relationshipName].splice(index, 1);

    if(appCache.editedItem.relationships[relationshipName].length == 0){
      delete appCache.editedItem.relationships[relationshipName];
    }

    console.log(appCache.editedItem.relationships)
  }

  $scope.removeRelationship = function(relationshipName, competencyId){
    var index = appCache.editedItem.relationships[relationshipName].indexOf(competencyId)
    if(index != -1){
      appCache.editedItem.relationships[relationshipName].splice(index, 1); 

      if(appCache.editedItem.relationships[relationshipName].length == 0){
        delete appCache.editedItem.relationships[relationshipName];
      }
    }
  }

  $scope.relationshipCompetencySelected = function(item, model, label, name, pos){
    appCache.editedItem.relationships[name][pos] = item;

    $scope.relatedCompetencies[item.id] = item;
    console.log(item);
    console.log(model);
    console.log(label);
    console.log(name);
    console.log(pos);
  }

  $scope.showLevelOverlay = function(){
    if($scope.levelType == "list"){ 
      var levelModal = $modal.open({
        templateUrl: "partials/modals/levels.html",
        backdrop: "static",
        keyboard: "true",
        scope: $scope,
        controller: "levelModalController",
        resolve: {
          "cachedLevels": function(){ return $scope.cachedLevels }
        },
      })

      levelModal.result.then(function(cachedLevels){
        checkIfBinary();
      
        if($scope.create){
          $scope.cachedLevels = cachedLevels;
        }

      }, function(){
        appCache.editedItem.levels = appCache.currentItem.levels;
        checkIfBinary();
      })
    }else{

    }
  }

  $scope.updateDefaultLevels = function(){
    modelItem.getModel(appCache.editedItem.modelId).then(function(modelData){
      modelData.getLevels();

      appCache.editedItem.levels = modelData.levels;

      checkIfBinary();
    }, function(){
      alert('error');
    });
    
  }

  $scope.saveChanges = function(){
    if($scope.create){
      competencyItem.createCompetency(appCache.editedItem).then(function(data){
        var newComp = data[Object.keys(data)[0]];
        search.clearCache(context.competency);
        $scope.showView(context.competency, newComp.id, newComp.modelId);
      }, function(error){
        console.log(error);
      });
    }else{
      if($scope.levelType== "TorF"){
        appCache.editedItem.levels = {":true": appCache.levelCache[":true"], ":false": appCache.levelCache[":false"]};
      }

      competencyItem.editCompetency(appCache.currentItemId, appCache.editedItem).then(function(data){
        $scope.showView(context.competency, data.id, data.modelId);
      }, function(error){
        console.log(error);
      })
    }
  }

  }]).

  controller('modelEditController', ['$scope', '$routeParams', '$modal', '$q', 'appCache','search', 'context', 'defaultModelId', 'modelItem', 'levelItem',
  function($scope, $routeParams, $modal, $q, appCache,search, context, defaultModelId, modelItem, levelItem) {
    $scope.appCache = appCache;

    $scope.defaultLevels = "TorF";
    $scope.levelOptions = {"TorF": "Binary (T/F)", "list": "Ordered List"};

    $scope.$modal = $modal;

    $scope.cachedLevels = [];

    $scope.$watch('appCache.modelCache', function(newVal, oldVal){
      if(appCache.modelCache[$routeParams.modelId] != undefined){
        appCache.editedItem = appCache.modelCache[$routeParams.modelId];
      }
    });

    var checkIfBinary = function(){
      if(Object.keys(appCache.editedItem.levels).length == 0 || 
          ($.inArray(':true', Object.keys(appCache.editedItem.levels)) != -1 && 
          $.inArray(':false', Object.keys(appCache.editedItem.levels)) != -1 && 
          Object.keys(appCache.editedItem.levels).length == 2)){
       $scope.defaultLevels = "TorF";
      }else{
       $scope.defaultLevels = "list";
      }
    }

    $scope.$watch('appCache.editedItem.levels', function(newVal, oldVal){
      if(Object.keys(appCache.editedItem).length != 0){
        checkIfBinary();
      }
    });

    if($routeParams.modelId != undefined){
      if($routeParams.modelId == defaultModelId){
        alert("Cannot modify the default model!");
        $scope.goHome();
      }
      appCache.startEdit(context.model, $routeParams.modelId);
      
      $scope.modelId = $routeParams.modelId;
      $scope.create = false;
    }else{
      appCache.startCreate(context.model);
      $scope.create = true;
    }

  $scope.addDescription = function(){
    if(appCache.editedItem.description == undefined){
      appCache.editedItem.description = "";
    }else{
      alert('Only one Description can be added to a Model');
    }
  }

  $scope.removeDescription = function(){
    appCache.editedItem.description = undefined;
  }

  $scope.showLevelOverlay = function(val){
    if($scope.defaultLevels == "list"){ 
      var levelModal = $modal.open({
        templateUrl: "partials/modals/levels.html",
        backdrop: "static",
        keyboard: "true",
        scope: $scope,
        controller: "levelModalController",
        resolve: {
          "cachedLevels": function(){ return $scope.cachedLevels }
        },
      })

      levelModal.result.then(function(cachedLevels){
        checkIfBinary();
      
        if($scope.create){
          $scope.cachedLevels = cachedLevels;
        }

      }, function(){
        appCache.editedItem.levels = appCache.currentItem.levels;
        checkIfBinary();
      })
    }else{

    }
  }

  $scope.saveEdits = function(){
    if($scope.create){

      modelItem.createModel(appCache.editedItem).then(function(data){

        var ids = {};
        var deferred = $q.defer();

        var modelId = data.id;

        for(var i in $scope.cachedLevels){
          levelItem.createLevel(modelId, $scope.cachedLevels[i]).then(function(data){
            ids[$scope.cachedLevels[i].id] = data;

            if(Object.keys(ids).length == Object.keys($scope.cachedLevels).length){
              deferred.resolve(ids);
            }
          }); 
        }

        if(Object.keys($scope.cachedLevels).length == 0){
          deferred.reject(appCache.editedItem.levels);
        }


        deferred.promise.then(function(newIds){
          var modelObj = {};
          modelObj.id = modelId;

          modelObj.levels = [];

          for(var tempId in appCache.editedItem.levels){
            modelObj.levels[newIds[tempId].id] = newIds[tempId];
          }

          modelItem.editModel(modelObj);
        }, function(levelMap){
          if(Object.keys(levelMap).length != 0 && 
                !($.inArray(':true', Object.keys(levelMap)) != -1 && 
                $.inArray(':false', Object.keys(levelMap)) != -1 && 
                Object.keys(levelMap).length == 2)){

            
            var modelObj = {};
            modelObj.id = modelId;

            modelObj.levels = [];

            for(var levelId in levelMap){
              modelObj.levels[levelId] = levelMap[levelId];
            }
            
            modelItem.editModel(modelObj);
          }
        })
        
        search.clearCache(context.model);
        $scope.showView(context.model, modelId);
      })

    }else{
      if($scope.defaultLevels == "TorF"){
        appCache.editedItem.levels = {":true": appCache.levelCache[":true"], ":false": appCache.levelCache[":false"]};
      }
      modelItem.editModel(appCache.editedItem).then(function(data){
        $scope.showView(context.model, data.id);
      });
    }
  }
  }]).

  controller('profileEditController', ['$scope', '$routeParams', 'appCache', 'context', 'userItem',
  function($scope, $routeParams, appCache, context, userItem) {
    $scope.appCache = appCache;

    $scope.newPasswordCheck="";

    $scope.changePassword = false;

  if($routeParams.profileId != undefined){
    appCache.startEdit(context.profile, $routeParams.profileId);
    $scope.create = false;

    appCache.editedItem.password="alskdjfls";
      $scope.newPasswordCheck="asldfkjds";
  }else{

    appCache.startCreate(context.profile);
    $scope.create = true;
  }
    
  $scope.editPassword = function(){
    if($scope.changePassword){
      $scope.changePassword = false;
      
      appCache.editedItem.password="alskdjfls";
        $scope.newPasswordCheck="asldfkjds";
    }else{
      $scope.changePassword = true;

      $scope.newPasswordCheck = "";
      appCache.editedItem.password = "";
    }
  }

  $scope.saveEdits = function(){
    if($scope.create){
      if(appCache.editedItem.password == $scope.newPasswordCheck){
        userItem.createUser(appCache.editedItem).then(function(newUser){
          search.clearCache(context.profile);
          $scope.showView('profile', newUser.id);
        }, function(error){
          console.log(error);
        })  
      }else{
        console.log("Unmatched passwords!")
      }
    }else{
      if(appCache.editedItem.password != appCache.currentItem.password){

      }

      userItem.editUser(appCache.editedItem).then(function(updatedUser){
        $scope.showView('profile', updatedUser.id);
      }, function(error){
        console.log(error);
      })
    }
  }

  }]).

  controller('levelModalController', ['$scope', 'appCache', 'context', 'modelItem', 'levelItem', 'cachedLevels',
  function($scope, appCache, context, modelItem, levelItem, cachedLevels) {
    $scope.appCache = appCache;

    $scope.allLevels = {};
    $scope.cachedLevels = cachedLevels;

    $scope.selected="";
    $scope.available="";

    var findLowestRankId = function(){
      var lowestRankId = "";
      var lowestRank = 99999999;
      for(var id in appCache.editedItem.levels){
        if(appCache.editedItem.levels[id].rank < lowestRank){
          lowestRankId = id;
          lowestRank = appCache.editedItem.levels[id].rank;
        }
          
      }
      $scope.selected = lowestRankId;
      
      
      var availLevs = {};


      lowestRank = 99999999;
      for(var i in $scope.allLevels){
        if($scope.notContainsLevel($scope.allLevels[i])){
          availLevs[i] = $scope.allLevels[i];

          if(availLevs[i].rank < lowestRank){
            lowestRankId = i;
            lowestRank = availLevs[i].rank;
          }         
        }
      }

      $scope.available = lowestRankId;
    }

    findLowestRankId();

    switch(appCache.context){
      case context.competency:

        modelItem.getAllLevels(appCache.editedItem.modelId).
        then(function(levels){
          for(var i in levels){
          $scope.allLevels[levels[i].id] = levels[i];
        }

        findLowestRankId();   
        }, function(error){
          console.log(error);
        }, function(tempLevels){
          for(var i in tempLevels){
            $scope.allLevels[tempLevels[i].id] = tempLevels[i];
          }

        findLowestRankId();             
        })

        break;
      case context.model:
        if(!$scope.create){
          appCache.editedItem.getLevels();  
        }
        modelItem.getAllLevels(appCache.editedItem.id).
      then(function(levels){
        for(var i in levels){
          $scope.allLevels[levels[i].id] = levels[i];
        }

        findLowestRankId();   
      }, function(error){

      }, function(tempLevels){
        for(var i in tempLevels){
          $scope.allLevels[tempLevels[i].id] = tempLevels[i];
        }
      });
        break;
    }

    for(var i in $scope.cachedLevels){
    $scope.allLevels[$scope.cachedLevels[i].id] = $scope.cachedLevels[i];
  }

    $scope.notContainsLevel = function(levelObj){
      return appCache.editedItem.levels[levelObj.id] == undefined;
    }
  

    $scope.removeLevel = function(){
    if($scope.selected != undefined){
      delete(appCache.editedItem.levels[$scope.selected]);
      findLowestRankId();
    }
  }

  $scope.addLevel = function(){
    if($scope.available != undefined && $scope.available != ""){
      appCache.editedItem.levels[$scope.available] = $scope.allLevels[$scope.available];
      findLowestRankId();
    }
  }

    $scope.close = function(){
      if(Object.keys(appCache.editedItem.levels).length > 0){
        $scope.$close($scope.cachedLevels);
      }else{
        $scope.$dismiss();
      }
    }

    $scope.showCreateModal = function(){
      var create= $scope.$modal.open({
      templateUrl: "partials/modals/newLevel.html",
      backdrop: "static",
      keyboard: "true",
      controller: "createLevelModalController",
    })

    create.result.then(function(levelData){
      if($scope.$parent.create){
        switch(appCache.context){
          case context.competency:
            break;
          case context.model:
            break;
        }

        $scope.cachedLevels.push(levelData);
        
        $scope.allLevels[levelData.id] = levelData;

      }else{
        var modelId = "";
        switch(appCache.context){
          case context.competency:
            break;
          case context.model:
            modelId = appCache.currentItem.id;
            break;
        }

        levelItem.createLevel(modelId, levelData).then(function(levelObj){
          $scope.allLevels[levelObj.id] = levelObj;
        })
      }
    });
    }

  }]).

  controller('createLevelModalController', ['$scope', 'appCache', 'context',
  function($scope, appCache, context) {
    $scope.appCache = appCache;

    $scope.description="";
    $scope.name="";
    $scope.rank="";

    switch(appCache.context){
      case context.competency:
        break;
      case context.model:
        break;
    }

    $scope.create = function(){
      if($scope.name != "" && $scope.rank != ""){
        $scope.$close({
          name: $scope.name,
          description: $scope.description,
          rank: $scope.rank,
          id: $scope.name + "-" + $scope.rank + "-" + $scope.description,
      });
      }else{
        alert("A level is required to have a name and rank");
      }
    }

    $scope.cancel = function(){
      $scope.$dismiss();
    }

  }]).

  controller('recordEditController', ['$scope', '$routeParams', '$location', 'appCache', 'context', 'recordItem', 'competencyItem', 'newItem', 'evidenceValueType', 'validationItem', 'userItem',
  function($scope, $routeParams, $location, appCache, context, recordItem,competencyItem, newItem, evidenceValueType, validationItem, userItem) {
    $scope.appCache = appCache;
    $scope.competencyItem = competencyItem;

    $scope.evidenceValueTypes = evidenceValueType;

    $scope.competencyTitle = "";

    $scope.newValidation = undefined;
    $scope.oldValidations = [];

    $scope.newEvidence = undefined;

    $scope.editingValidation = undefined;
    $scope.viewingEvidence = undefined;
    $scope.editingEvidence = undefined;

    var createdValidationsCount = 0;

    var user = {};
    $scope.user = user;

    var getUser = function(userId){
      userItem.getUser(userId).then(function(result){
      for(var i in result){
        user[i] = result[i];
      }
    }, function(error){
      console.log("Error: "+ error);
    }, function(tempResult){
      for(var i in tempResult){
        user[i] = tempResult[i];
      }
    })
    }

    if($routeParams.recordId != undefined && $routeParams.userId != undefined){
    getUser($routeParams.userId);

    appCache.startEdit(context.record, $routeParams.recordId, $routeParams.userId).then(function(){
      $scope.competencyTitle = appCache.competencyCache[appCache.currentItem.competencyModelId][appCache.currentItem.competencyId].title;

      angular.element('#no_level_message').remove();        
    });
    $scope.create = false;
  }else{
    if($location.search().userId == undefined){
      console.log("Error: Cannot Create Record Unless userId parameter is set");
      $scope.goHome();
    }
    
    getUser($location.search().userId);

    appCache.startCreate(context.record);
    $scope.create = true;

    $scope.$on("$destroy", function(){
      $location.$$search = {};
    })
  }

  $scope.saveRecord = function(){
    if($scope.editingValidation == undefined && $scope.editingEvidence == undefined){
      if($scope.create){
      recordItem.createRecord(user.id, appCache.editedItem).then(function(newRecord){
        $location.$$search = {};
        $scope.showView('profile', user.id);
      }, function(error){
        console.log("Error: "+error);
      })
    }else{
      recordItem.editRecord(user.id, appCache.editedItem.id, appCache.editedItem).then(function(updatedRecord){
        $scope.showView('profile', user.id);
      }, function(error){
        console.log("Error: "+error);
      })
    }
    }else{
      console.log("Warning: Make sure you save your validations or evidence before saving the record");
    }
    
  }

  $scope.competencySelected = function(item, model, label){
    appCache.editedItem.competencyId = item.id;

    angular.element('#no_level_message').remove();  
    
    appCache.editedItem.levelId =appCache.competencyCache[appCache.editedItem.competencyModelId][appCache.editedItem.competencyId].levelIds[0];
  }

  $scope.addValidation = function(){
    if($scope.editingValidation != undefined){
      console.log("Error: Finish Editing before Creating a new Validation");
      return;
    }
    if($scope.newValidation == undefined){
      var d = new Date();
      var dateString = d.getFullYear()+"-"+(d.getMonth() + 1 < 10 ? "0"+(d.getMonth()+1) : d.getMonth()+1)+"-"+d.getDate();
      for(var id in appCache.editedItem.validations){
        var validation = appCache.editedItem.validations[id];

        if(validation.agentId == "user-"+appCache.currentUser.id 
          && validation.date.indexOf(dateString) != -1){
          console.log("error: you can only create one validation per day");
          return;
        }
      }

      $scope.newValidation = {};
      angular.extend($scope.newValidation, newItem.validation);
      
      var d = new Date();
      $scope.newValidation.date = d;

      $scope.newValidation.agentId = "user-"+appCache.currentUser.id;
    }
  }

  $scope.removeValidation = function(obj){
    if(obj == $scope.newValidation){
      $scope.newValidation = undefined;
    }else if(obj.agentId == "user-"+appCache.currentUser.id){
      if(appCache.editedItem.validations.indexOf(obj) != -1){
        $scope.oldValidations.push(obj);
        appCache.editedItem.validations.splice(appCache.editedItem.validations.indexOf(obj), 1)
      }
    }
  }

  $scope.editValidation = function(validationId){
    if($scope.newValidation != undefined){
      console.log("Error: Save new Validation before Editing another");
      return;
    }

    if($scope.editingValidation == undefined){
      $scope.editingValidation = validationId;  
    }else{
      console.log("error: save or cancel current edit");
    }
    
  }

  $scope.cancelEditValidation = function(){
    $scope.editingValidation = undefined;
    $scope.editingEvidence = undefined;
  }

  $scope.saveValidation = function(){
    if($scope.create){
      if($scope.editingValidation == undefined){
        appCache.editedItem.validations[createdValidationsCount++] = $scope.newValidation;

        $scope.newValidation = undefined;
      }else{
        $scope.editingValidation = undefined;
      }
    }else{
      if($scope.editingValidation == undefined){
        var newVal = $scope.newValidation;

        validationItem.createValidation(user.id, $routeParams.recordId, newVal.agentId, newVal.confidence, newVal.evidenceIds).then(function(newValidation){
          appCache.editedItem.validations[newValidation.id] = newValidation;

          $scope.newValidation = undefined;
        }, function(error){
          console.log("error: "+error);
        })
      }else{
        var val = appCache.editedItem.validations[$scope.editingValidation];
        validationItem.updateValidationConfidence(user.id, $routeParams.recordId, val.id, val.confidence).then(function(editedValidation){
          appCache.editedItem.validations[val.id] = editedValidation;

          $scope.editingValidation = undefined;
        }, function(error){
          console.log("error: "+error);
        })
      }
    }
  }

  $scope.startAddEvidence = function(){
    if($scope.newEvidence == undefined){
      $scope.newEvidence = {};
    }
  }

  $scope.addNewEvidence = function(validationId){
    angular.extend($scope.newEvidence, newItem.evidence);

    $scope.newEvidence.valueType = evidenceValueType.String;
  }

  $scope.addExistingEvidence = function(validationId){
    $scope.newEvidence.id = "";
  }

  $scope.cancelAddEvidence = function(){
    $scope.newEvidence = undefined;
  }

  $scope.saveAddEvidence = function(){
    var editingValidation = $scope.editingValidation;
    var newValidation = $scope.newValidation;

    // New Evidence
    if($scope.newEvidence.id == undefined){
      // New Validation
      if(editingValidation == undefined){
        validationItem.createUnattachedEvidence($scope.newEvidence, $scope.user.id).then(function(newEvidence){
        
          newValidation.evidenceIds.push(newEvidence.id);
          newValidation.evidences[newEvidence.id] = newEvidence;
          $scope.newEvidence = undefined;
        }, function(error){
          console.log("Error: "+error);
        });
      // Add to Existing Validation
      }else{
        validationItem.addEvidenceToValidation($scope.newEvidence, editingValidation, $scope.user.id).then(function(newEvidence){
          appCache.editedItem.validations[editingValidation].evidenceIds.push(newEvidence.id);
          appCache.editedItem.validations[editingValidation].evidences[newEvidence.id] = newEvidence;

          $scope.newEvidence = undefined;
        }, function(error){
          console.log("error: "+error);
        })
      }
    // Existing Evidence
    }else{
      // New Validation
      if(editingValidation == undefined){
        newValidation.evidenceIds.push($scope.newEvidence.id);
      // Add to Existing Validation
      }else{
        // TODO: Call AddExistingEvidenceToValidation
        appCache.editedItem.validations[editingValidation].evidenceIds.push($scope.newEvidence.id);
      }
    }
  }

  $scope.viewEvidence = function(validationId, evidenceId){
    if($scope.viewingEvidence == evidenceId){
      $scope.viewingEvidence = undefined;
      return;
    }
    $scope.viewingEvidence = evidenceId;

    var validObj;
    if(validationId != undefined){
      validObj = appCache.editedItem.validations[validationId];
    }else{
      validObj = $scope.newValidation;
    }

    if(validObj.evidences[evidenceId] == undefined){
      validationItem.getEvidence($scope.user.id, evidenceId).then(function(evidence){
        validObj.evidences[evidenceId] = evidence;
      }, function(error){
        console.log("error: "+error);
      }, function(tempEvidence){
        validObj.evidences[evidenceId] = tempEvidence;
      })
    }
  }

  $scope.editEvidence = function(validationId, evidenceId){
    $scope.editingEvidence = evidenceId;
    $scope.viewingEvidence = undefined;

    var validObj;
    if(validationId != undefined){
      validObj = appCache.editedItem.validations[validationId];
    }else{
      validObj = $scope.newValidation;
    }

    if(validObj.evidences[evidenceId] == undefined){
      validationItem.getEvidence($scope.user.id, evidenceId).then(function(evidence){
        validObj.evidences[evidenceId] = evidence;
      }, function(error){
        console.log("error: "+error);
      }, function(tempEvidence){
        validObj.evidences[evidenceId] = tempEvidence;
      })
    }
  }

  $scope.cancelEditEvidence = function(){
    $scope.editingEvidence = undefined;
  }

  $scope.saveEditEvidence = function(){
    // Call UpdateEvidence
    var editingValidation = $scope.editingValidation;
    var evidenceId = $scope.editingEvidence;

    validationItem.updateEvidence(appCache.editedItem.validations[editingValidation].evidences[evidenceId], user.id, evidenceId).then(function(evidence){
      appCache.editedItem.validations[editingValidation].evidences[evidenceId] = evidence;

      $scope.viewingEvidence = $scope.editingEvidence;
      $scope.editingEvidence = undefined;
    },function(error){
      console.log("error: "+error);
    });
  }

  }]);