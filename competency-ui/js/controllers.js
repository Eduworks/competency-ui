'use strict';

/* Controllers */

angular.module('CompetencyManager.controllers', []).
controller('loginController', ['$scope', '$location', '$rootScope', 'session', 'search', 'appCache', 'modelItem',
                               function($scope, $location, $rootScope, session, search, appCache, modelItem) {
	$scope.session = session;
	search.clearAll();
	
	$scope.password = "";
	$scope.userId = "";

	if(session.currentUser.sessionId != undefined){
		$rootScope.goHome();
	}
	
	$scope.clearMessage = function(){
		session.loginMessage.msg = "";
	}

	$scope.login = function(){
		if($scope.userId != "" && $scope.password != ""){
			session.login($scope.userId, $scope.password).then(function(result){
				if(appCache.modelCache['model-default'] == undefined || appCache.modelCache['model-default'] == {}){
					 modelItem.getAllModels().then(function(data){
						 appCache.saveCaches();
					 });
				 }
				
				$rootScope.goHome();
			}, function(error){
				session.loginMessage = error;
			});
		}
	};

}]).
controller('homeController', ['$scope', 'context', 'appCache', 'session', function($scope, context, appCache, session) {
	$scope.context = context;
	$scope.appCache = appCache;

	if(session.currentUser.sessionId == undefined){
		$scope.goLogin();
		return;
	}

}]).

controller('headerController', ['$scope', 'context', 'appCache', 'session', function($scope, context, appCache, session) {
	$scope.context = context;
	$scope.appCache = appCache;
	$scope.session = session;
}]).

controller('alertController', ['$scope', 'appCache', 'alert', function($scope, appCache, alert) {
	$scope.alert = alert;
	
	$scope.closeWarning = function(){
		alert.warningMessage = "";
	}
	
	$scope.closeError = function(){
		alert.errorMessage = "";
	}
	
}]).

controller('searchController', ['$scope', '$routeParams', '$location', 'search', 'appCache', 'session', 'context',
                                function($scope, $routeParams, $location, search, appCache, session, context) {
	$scope.search = search;
	$scope.appCache = appCache;
	$scope.contexts = context;
	
	$scope.searchBarMessage = "Search";
	
	if(session.currentUser.sessionId == undefined){
		$scope.goLogin();
		return;
	}

	if(appCache.context == "" || appCache.context == undefined){
		if($routeParams.context != undefined && $routeParams.context != "undefined" && $routeParams.context != ""){
			appCache.setContext($routeParams.context);
		}else{
			$scope.goHome();
		}
	} 
	
	if(appCache.context == context.competency){
		$scope.searchBarMessage = "Leave Blank to View All Competencies in the Selected Model(s)"
	}

}]).


controller('resultsController', ['$scope', '$routeParams', '$location', 'search', 'appCache', 'session', 'context',
                                 function($scope, $routeParams, $location, search, appCache, session, contexts) {
	$scope.search = search;
	$scope.appCache = appCache;   
	$scope.contexts = contexts;
	
	$scope.$on('$locationChangeSuccess', function(){
		if(appCache.context == contexts.competency && (search.query != $location.search().query || search.model != $location.search().model)){
			search.query = $location.search().query;

			if($location.search().model instanceof Array){
				search.model = $location.search().model;
			}else{
				if($location.search().model == "all"){
					search.model = search.ALL_MODELS;
				}else{
					search.model = new Array($location.search().model);
				}
			}
			
			
			if(search.query != "" && search.query != undefined  && search.model != "" && search.model != undefined){
				search.runSearch(appCache.context);
			}
		}
	})
	
	if(session.currentUser.sessionId == undefined){
		$scope.goLogin();
		return;
	}

	if(appCache.context == "" || appCache.context == undefined){
		if($routeParams.context != undefined && $routeParams.context != ""){
			appCache.context = $routeParams.context;  
		}else{
			$scope.goHome();
		}
	}

	if(appCache.context == contexts.competency){
		if(search.model == undefined || search.model == ""){
			if($location.search().model != undefined){
				if($location.search().model == "all"){
					search.model = search.ALL_MODELS;
				}else{
					if($location.search().model instanceof Array){
						search.model = $location.search().model;
					}else{
						search.model = new Array($location.search().model);
					}
					
				}
			}else{
				search.model = search.ALL_MODELS;
				$location.search('model', search.model)
			}
		}else{
			$location.search('model', search.model);
		}
		
	}
	
	if(search.query == undefined || search.query == ""){
		
		if($location.search().query != undefined){
			search.query = $location.search().query;  

			search.runSearch(appCache.context);
		}else{
			if(appCache.context == contexts.model){
				if(search.model === search.ALL_MODELS){
					$location.search('model',search.ALL_MODELS);
					
					search.viewAllModels();
				}else if($location.search().model == search.ALL_MODELS){
					search.viewAllModels();
				}
			}else if(appCache.context == contexts.competency){
				search.runSearch(appCache.context);
			}else{
				$scope.showSearch();
			}
		}

	}else{
		if($location.search().query == undefined){
			$location.search('query', search.query);  		
		}
		
		if(appCache.context == contexts.competency){
			if($location.search().model == undefined){
				$location.search('model', search.model);  		
			}
		}
		
		search.runSearch(appCache.context);
	}

	$scope.$on('$destroy', function(){
		search.query = $location.$$search.query;
		search.model = $location.$$search.model instanceof Array ? $location.$$search.model : new Array($location.$$search.model);
		
		$location.search('query', undefined)
		$location.search('model', undefined)
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



controller('viewController', ['$scope', '$routeParams', '$location', 'search', 'appCache', 'modelItem', 'competencyItem', 'context', 'session', 'alert',
                              function($scope, $routeParams, $location, search, appCache, modelItem, competencyItem, contexts, session, alert) {
	$scope.appCache = appCache;
	$scope.search = search;
	$scope.contexts = contexts;

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

	if(session.currentUser.sessionId == undefined){
		$scope.goLogin();
		return;
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
						alert.setErrorMessage(error);
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
		if(error.code == undefined){
			console.log(error);
		}else{
			alert.setErrorMessage(error, {context: $routeParams.context, itemId: $routeParams.itemId, modelId: $routeParams.modelId});
		}
		
		
	}, function(tempResult){
		switch(appCache.context){
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
		if(appCache.competencyCache[val.competencyModelId][val.competencyId].title.indexOf($scope.recordQuery) != -1)
			return true;
		if(appCache.modelCache[val.competencyModelId].name.indexOf($scope.recordQuery) != -1)
			return true;
		if(appCache.modelCache[val.competencyModelId].id.indexOf($scope.recordQuery) != -1)
			return true;
		
		return false;
	}


}]).



controller('competencyEditController', ['$scope', '$routeParams', '$modal', 'appCache', 'session', 'search', 'alert', 'context', 'competencyItem', 'modelItem', 'competencyRelationships',
                                        function($scope, $routeParams, $modal, appCache, session, search, alert, context, competencyItem, modelItem, competencyRelationships) {
	$scope.appCache = appCache;
	$scope.competencyItem = competencyItem;
	$scope.competencyRelationships = competencyRelationships;

	$scope.relatedCompetencies = {};

	$scope.selectableModels = {};
	
	modelItem.getAllModels().then(function(allModels){
		for(var modelId in allModels){
			if(allModels[modelId] instanceof Object && allModels[modelId].name != ""){
				$scope.selectableModels[modelId] = allModels[modelId];
			}
		}
	});

	$scope.levelOptions = {"TorF": "Binary (T/F)", "list": "Ordered List"};
	$scope.cachedLevels = [];

	$scope.levelType = "TorF";

	$scope.selectorHelper = {};

	$scope.typeaheadSearching = {};
	$scope.typeaheadDummy = {};
	

	if(session.currentUser.sessionId == undefined){
		$scope.goLogin();
		return;
	}
	
	for(var relationshipName in competencyRelationships){
		$scope.selectorHelper[relationshipName] = [];
		$scope.typeaheadSearching[relationshipName] = [];
		$scope.typeaheadDummy[relationshipName] = [];
	}

	var checkIfBinary = function(){
		if(Object.keys(appCache.editedItem.levels).length == 0 || 
				($.inArray(':true', Object.keys(appCache.editedItem.levels)) != -1 && 
						$.inArray(':false', Object.keys(appCache.editedItem.levels)) != -1 && 
						Object.keys(appCache.editedItem.levels).length == 2)
		){
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
						alert.setErrorMessage(error);
					}, function(tempResult){
						setRelationshipVariables(tempResult, rels, locType, locId);
					});
				}
			}
		}, function(error){
			alert.setErrorMessage(error);
			$rootScope.goBack();
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
						alert.setWarningMessage(error);
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
				alert.setWarningMessage('Need to enter a description before adding a new one');
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
			alert.setWarningMessage("Cannot add another relationship without completing the previous");
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
		if(appCache.editedItem.modelId.valueOf() == "model-default".valueOf()){
			alert.setErrorMessage("Cannot Modify the Levels of a Competency in the Default Model");
			$scope.levelType = "TorF"
			return;
		}
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
		}
	}

	$scope.updateDefaultLevels = function(){
		modelItem.getModel(appCache.editedItem.modelId).then(function(modelData){
			modelData.getLevels();

			appCache.editedItem.levels = modelData.levels;

			checkIfBinary();
		}, function(error){
			alert.setWarningMessage(error)
		});

	}

	$scope.saveChanges = function(){
		if($scope.create){
			competencyItem.createCompetency(appCache.editedItem).then(function(data){
				var newComp = data[Object.keys(data)[0]];
				search.clearResults(context.competency);
				$scope.showView(context.competency, newComp.id, newComp.modelId);
			}, function(error){
				alert.setErrorMessage(error);
			});
		}else{
			if($scope.levelType== "TorF"){
				appCache.editedItem.levels = {":true": appCache.levelCache[":true"], ":false": appCache.levelCache[":false"]};
			}

			competencyItem.editCompetency(appCache.currentItemId, appCache.editedItem).then(function(data){
				$scope.showView(context.competency, data.id, data.modelId);
			}, function(error){
				alert.setErrorMessage(error);
			})
		}
	}

}]).

controller('modelEditController', ['$scope', '$routeParams', '$modal', '$q', 'appCache', 'session', 'alert', 'search', 'context', 'defaultModelId', 'modelItem', 'levelItem',
                                   function($scope, $routeParams, $modal, $q, appCache, session, alert, search, context, defaultModelId, modelItem, levelItem) {
	$scope.appCache = appCache;

	$scope.defaultLevels = "TorF";
	$scope.levelOptions = {"TorF": "Binary (T/F)", "list": "Ordered List"};

	$scope.$modal = $modal;

	$scope.cachedLevels = [];

	$scope.selectedPermission = {admin:"", user:"", agent:""};
	$scope.selectedPermissionType = "admin";
	
	if(session.currentUser.sessionId == undefined){
		$scope.goLogin();
		return;
	}
	
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
		appCache.startEdit(context.model, $routeParams.modelId).then(function(){
			$scope.selectedPermission.admin = appCache.currentItem.accessControl.admin.length > 0 ? appCache.currentItem.accessControl.admin[0] : "";
			$scope.selectedPermission.user = appCache.currentItem.accessControl.user.length > 0 ? appCache.currentItem.accessControl.user[0] : "";
			$scope.selectedPermission.agent = appCache.currentItem.accessControl.agent.length > 0 ? appCache.currentItem.accessControl.agent[0] : "";
		});

		$scope.modelId = $routeParams.modelId;
		$scope.create = false;
	}else{
		appCache.startCreate(context.model);
		appCache.currentItem.accessControl.admin.push(session.currentUser.id);
		$scope.selectedPermission.admin = appCache.currentItem.accessControl.admin[0];
		
		$scope.create = true;
	}

	$scope.addDescription = function(){
		if(appCache.editedItem.description == undefined){
			appCache.editedItem.description = "";
		}else{
			alert.setErrorMessage('Only One Description can be added to a Model');
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
		}
	}
	
	$scope.startAddPermission = function(){
		var addPermissionModal = $modal.open({
			templateUrl: "partials/modals/addPermission.html",
			backdrop: "static",
			keyboard: "true",
			scope: $scope,
			controller: "permissionModalController",
			resolve:{
				'selectedRole': function(){ return $scope.selectedPermissionType; }
			}
		});
		
		addPermissionModal.result.then(function(permissionObj){
			if(permissionObj.role == "admin"){
				if(appCache.editedItem.accessControl.admin.indexOf(permissionObj.id) == -1){
					var userIdx = appCache.editedItem.accessControl.user.indexOf(permissionObj.id);
					if(userIdx != -1){
						appCache.editedItem.accessControl.user.splice(userIdx, 1);
					}
					
					appCache.editedItem.accessControl.admin.push(permissionObj.id)  
				}
			}
			
			if(permissionObj.role == "user"){
				var adminIdx = appCache.editedItem.accessControl.admin.indexOf(permissionObj.id);
				if(adminIdx != -1){
					alert.setWarningMessage("Moving User from Admin Permission Group to User Permission Group");
					appCache.editedItem.accessControl.admin.splice(adminIdx, 1);
				}
				
				if(appCache.editedItem.accessControl.user.indexOf(permissionObj.id) == -1){
					appCache.editedItem.accessControl.user.push(permissionObj.id)
				}
			}
			
			if(permissionObj.role == "agent"){
				if(appCache.editedItem.accessControl.agent.indexOf(permissionObj.id) == -1){
					appCache.editedItem.accessControl.agent.push(permissionObj.id)
				}
			}
			
			$scope.selectedPermission.admin = appCache.editedItem.accessControl.admin[0];
			$scope.selectedPermission.user = appCache.editedItem.accessControl.user[0];
			$scope.selectedPermission.agent = appCache.editedItem.accessControl.agent[0]
		})
	}
	
	$scope.removePermission = function(){
		if($scope.selectedPermissionType != ""){
			if(!$scope.create || $scope.selectedPermission[$scope.selectedPermissionType] != session.currentUser.id){
				var idx = appCache.editedItem.accessControl[$scope.selectedPermissionType].indexOf($scope.selectedPermission[$scope.selectedPermissionType]);
				if(idx != -1){
					appCache.editedItem.accessControl[$scope.selectedPermissionType].splice(idx, 1);
					
					$scope.selectedPermission[$scope.selectedPermissionType] = appCache.editedItem.accessControl[$scope.selectedPermissionType][0];
				}
			}else{
				alert.setErrorMessage('Cannot Remove Yourself When Creating a Model')
			}
		}
		
	}
	
	$scope.changedSelectedPermissionType = function(type){
		$scope.selectedPermissionType = type;
	}

	$scope.saveEdits = function(){
		if(appCache.editedItem.name == ""){
			alert.setErrorMessage("Model Title is required to be set");
			return;
		}
		
		if(appCache.editedItem.accessControl.admin.length == 0){
			alert.setErrorMessage("Cannot Leave Model Admin Permission Group Empty");
			return;
		}
		
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

				search.clearResults(context.model);
				$scope.showView(context.model, modelId);
			}, function(error){
				alert.setErrorMessage(error);
			})

		}else{
			if($scope.defaultLevels == "TorF"){
				appCache.editedItem.levels = {":true": appCache.levelCache[":true"], ":false": appCache.levelCache[":false"]};
			}
			
			modelItem.editModel(appCache.editedItem).then(function(data){
				$scope.showView(context.model, data.id);
			}, function(error){
				alert.setErrorMessage(error);
			});
			
		}
	}
}]).

controller('permissionModalController', ['$scope', 'appCache', 'alert', 'selectedRole', 'userItem', 'recordItem',
                                         function($scope, appCache, alert, selectedRole, userItem, recordItem){
	
	$scope.permission = {id:"", role: selectedRole};
	
	$scope.cancel = function(){
		$scope.$dismiss();
	}
	
	$scope.add = function(){
		$scope.$close($scope.permission);
	}
}]).

controller('profileEditController', ['$scope', '$routeParams', 'appCache', 'session', 'search', 'context', 'userItem', 'alert',
                                     function($scope, $routeParams, appCache, session, search, context, userItem, alert) {
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
	
	if(session.currentUser.sessionId == undefined && !$scope.create){
		$scope.goLogin();
		return;
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
		if(appCache.editedItem.firstName == undefined || appCache.editedItem.firstName == ""){
			alert.setErrorMessage("User's First Name is Required");
			return;
		}
		
		if(appCache.editedItem.email == undefined || appCache.editedItem.email == ""){
			alert.setErrorMessage("Users's Email is Required");
			return;
		}
		
		if($scope.create){
			if(appCache.editedItem.password == $scope.newPasswordCheck){
				userItem.createUser(appCache.editedItem).then(function(newUser){
					search.clearResults(context.profile);
					
					if(session.currentUser.sessionId == undefined){
						session.login(appCache.editedItem.id, appCache.editedItem.password).then(function(){
							$scope.showView('profile', newUser.id);
						}, function(error){
							alert.setErrorMessage(error);
							$scope.goLogin();
						})
					}
				}, function(error){
					alert.setErrorMessage(error);
				})  
			}else{
				alert.setErrorMessage("Password's do not match!")
			}
		}else{
			userItem.editUser(appCache.editedItem).then(function(updatedUser){
				$scope.showView('profile', updatedUser.id);
			}, function(error){
				alert.setErrorMessage(error);
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
					findLowestRankId();
				})
			}
		});
	}

}]).

controller('createLevelModalController', ['$scope', 'appCache', 'context', 'alert',
                                          function($scope, appCache, context, alert) {
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
			alert.setErrorMessage("A level is required to have a name and rank");
		}
	}

	$scope.cancel = function(){
		$scope.$dismiss();
	}

}]).

controller('recordEditController', ['$scope', '$routeParams', '$location', '$q', 'appCache', 'session', 'alert', 'context', 'recordItem', 'competencyItem', 'newItem', 'evidenceValueType', 'validationItem', 'userItem',
                                    function($scope, $routeParams, $location, $q, appCache, session, alert, context, recordItem,competencyItem, newItem, evidenceValueType, validationItem, userItem) {
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
			alert.setErrorMessage(error);
		}, function(tempResult){
			for(var i in tempResult){
				user[i] = tempResult[i];
			}
		})
	}
	
	if(session.currentUser.sessionId == undefined){
		$scope.goLogin();
		return;
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
			$scope.goHome();
			alert.setErrorMessage("Error: Cannot Create Record Unless userId parameter is set");
		}

		getUser($location.search().userId);

		appCache.startCreate(context.record);
		$scope.create = true;

		$scope.$on("$destroy", function(){
			$location.$$search = {};
		})
	}

	$scope.saveRecord = function(){
		var saveRecord = function(){
			if($scope.create){
				recordItem.createRecord(user.id, appCache.editedItem).then(function(newRecord){
					$location.$$search = {};
					$scope.showView('profile', user.id);
				}, function(error){
					alert.setErrorMessage(error)
				})
			}else{
				recordItem.editRecord(user.id, appCache.editedItem.id, appCache.editedItem).then(function(updatedRecord){
					$scope.showView('profile', user.id);
				}, function(error){
					alert.setErrorMessage(error)
				})
			}
		}
		
		if($scope.editingValidation == undefined && $scope.editingEvidence == undefined && $scope.newValidation == undefined){
			saveRecord();
		}else{
			$scope.saveValidation(true).then(function(){
				saveRecord();
			}, function(error){
				alert.setErrorMessage(error)
			});
		}

	}

	$scope.competencySelected = function(item, model, label){
		appCache.editedItem.competencyId = item.id;

		angular.element('#no_level_message').remove();  

		appCache.editedItem.levelId =appCache.competencyCache[appCache.editedItem.competencyModelId][appCache.editedItem.competencyId].levelIds[0];
	}

	$scope.addValidation = function(){
		if($scope.editingValidation != undefined){
			alert.setErrorMessage("Finish Editing the current Validation before Creating a new Validation");
			return;
		}
		if($scope.newValidation == undefined){
			var d = new Date();
			var dateString = d.getFullYear()+"-"+(d.getMonth() + 1 < 10 ? "0"+(d.getMonth()+1) : d.getMonth()+1)+"-"+d.getDate();
			for(var id in appCache.editedItem.validations){
				var validation = appCache.editedItem.validations[id];

				if(validation.agentId == "user-"+session.currentUser.id 
						&& validation.date.indexOf(dateString) != -1){
					alert.setErrorMessage("You can only create one validation per day");
					return;
				}
			}

			$scope.newValidation = {};
			angular.extend($scope.newValidation, newItem.validation);

			var d = new Date();
			$scope.newValidation.date = d;

			$scope.newValidation.agentId = "user-"+session.currentUser.id;
		}
	}

	$scope.removeValidation = function(obj){
		if(obj == $scope.newValidation){
			$scope.newValidation = undefined;
		}else if(obj.agentId == "user-"+session.currentUser.id){
			if(appCache.editedItem.validations.indexOf(obj) != -1){
				$scope.oldValidations.push(obj);
				appCache.editedItem.validations.splice(appCache.editedItem.validations.indexOf(obj), 1)
			}
		}
	}

	$scope.editValidation = function(validationId){
		if($scope.newValidation != undefined){
			alert.setErrorMessage("Save new Validation before Editing another");
			return;
		}

		if($scope.editingValidation == undefined){
			$scope.editingValidation = validationId;  
		}else{
			alert.saveErrorMessage("Save or cancel current edit before editing another");
		}

	}

	$scope.cancelEditValidation = function(){
		$scope.editingValidation = undefined;
		$scope.editingEvidence = undefined;
		$scope.newEvidence = undefined;
	}

	$scope.saveValidation = function(defer){
		var deferred;
		if(defer){
			deferred = $q.defer();
		}
		
		if($scope.create){
			if($scope.editingValidation == undefined){
				var addValidation = function(){
					appCache.editedItem.validations[createdValidationsCount++] = $scope.newValidation;

					$scope.newValidation = undefined;
				}
				
				if($scope.newEvidence != undefined){
					$scope.saveAddEvidence(true).then(function(){
						addValidation();
					});
				}else{
					addValidation();
				}
				
				
			}else{
				$scope.editingValidation = undefined;
			}
			
			if(defer){
				setTimeout(function(){
					deferred.resolve()
				}, 10)
			}
		}else{
			var saveValidation = function(){
				if($scope.editingValidation == undefined){
					var newVal = $scope.newValidation;

					validationItem.createValidation(user.id, $routeParams.recordId, newVal.agentId, newVal.confidence, newVal.evidenceIds).then(function(newValidation){
						appCache.editedItem.validations[newValidation.id] = newValidation;

						$scope.newValidation = undefined;
						
						if(defer)
							deferred.resolve();
					}, function(error){
						alert.setErrorMessage(error);
						
						if(defer)
							deferred.reject();
					})
				}else{
					var val = appCache.editedItem.validations[$scope.editingValidation];
					validationItem.updateValidationConfidence(user.id, $routeParams.recordId, val.id, val.confidence).then(function(editedValidation){
						appCache.editedItem.validations[val.id] = editedValidation;

						$scope.editingValidation = undefined;
						
						if(defer)
							deferred.resolve();
					}, function(error){
						alert.setErrorMessage(error);
						
						if(defer)
							deferred.rekect();
					})
				}
			}
			
			if($scope.newEvidence != undefined){
				$scope.saveAddEvidence(true).then(function(){
					saveValidation();
				})
			}else if($scope.editingEvidence != undefined){
				$scope.saveEditEvidence(true).then(function(){
					saveValidation();
				});
			}else{
				saveValidation();
			}
			
			
		}
		
		if(defer)
			return deferred.promise;
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

	$scope.saveAddEvidence = function(defer){
		var deferred;
		if(defer){
			deferred = $q.defer();
		}
		
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
					
					if(defer)
						deferred.resolve();
				}, function(error){
					alert.setErrorMessage(error);
					
					if(defer)
						deferred.reject();
				});
				// Add to Existing Validation
			}else{
				validationItem.addEvidenceToValidation($scope.newEvidence, editingValidation, $scope.user.id).then(function(newEvidence){
					appCache.editedItem.validations[editingValidation].evidenceIds.push(newEvidence.id);
					appCache.editedItem.validations[editingValidation].evidences[newEvidence.id] = newEvidence;

					$scope.newEvidence = undefined;
					
					if(defer)
						deferred.resolve();
				}, function(error){
					alert.setErrorMessage(error);
					
					if(defer)
						deferred.reject();
				})
			}
		
		}// Existing Evidence
		else{
			// New Validation
			if(editingValidation == undefined){
				newValidation.evidenceIds.push($scope.newEvidence.id);
				// Add to Existing Validation
			}else{
				// TODO: Call AddExistingEvidenceToValidation
				appCache.editedItem.validations[editingValidation].evidenceIds.push($scope.newEvidence.id);
			}
			
			if(defer){
				setTimeout(function(){
					deferred.resolve();
				}, 10);
			}
		}
		
		if(defer)
			return deferred.promise;
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
				alert.setErrorMessage(error);
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
				alert.setErrorMessage(error);
			}, function(tempEvidence){
				validObj.evidences[evidenceId] = tempEvidence;
			})
		}
	}

	$scope.cancelEditEvidence = function(){
		$scope.editingEvidence = undefined;
	}

	$scope.saveEditEvidence = function(defer){
		var deferred;
		if(defer != undefined && defer == true){
			deferred = $q.defer();
		}
		
		// Call UpdateEvidence
		var editingValidation = $scope.editingValidation;
		var evidenceId = $scope.editingEvidence;

		validationItem.updateEvidence(appCache.editedItem.validations[editingValidation].evidences[evidenceId], user.id, evidenceId).then(function(evidence){
			appCache.editedItem.validations[editingValidation].evidences[evidenceId] = evidence;

			$scope.viewingEvidence = $scope.editingEvidence;
			$scope.editingEvidence = undefined;
			
			if(defer)
				deferred.resolve();
		},function(error){
			alert.setErrorMessage(error);
			
			if(defer)
				deferred.reject();
		});
		
		if(defer)
			return deferred.promise;
	}

	$scope.showView = function(context, id){
		$scope.editingValidation = undefined;
		$scope.editingEvidence = undefined;
		
		$scope.newValidation = undefined;
		$scope.newEvidence = undefined;
		
		$scope.$parent.showView(context, id);
	}
	
}]);