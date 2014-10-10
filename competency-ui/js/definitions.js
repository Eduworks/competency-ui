angular.module('CompetencyManager.definitions', []).
  value('version', '0.2').
  value('dataObjectName', 'competency').
  value('apiURL', 'http://localhost:9722/api/custom/competency/').
  value('defaultModelId', 'model-default').
  value('errorCode', {
	  'emptyParam': 'empty',
	  'badValue': 'value',
	  'existence': 'exist',
	  'defaultObject': 'default',
	  'login': 'login',
	  'access': 'access',
	  'sessionExpired': 'expired',
  });