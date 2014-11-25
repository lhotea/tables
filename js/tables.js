
function onBackKeyPress(e) {
		alert("Wanna go back (1)?");
		e.preventDefault();
	    e.stopPropagation();
        return false;
}

var app = angular.module('tables', ['ionic']);


app.run(
function($ionicPlatform) {
  $ionicPlatform.ready( function() {
   alert("Hello Antoine");
   //$ionicPlatform.registerBackButtonAction(onBackKeyPress,1000);
   //$ionicPlatform.on("backbutton", onBackKeyPress);
   $ionicPlatform.onHardwareBackButton(function (e) {
		alert("Wanna go back (1)?");
		e.preventDefault();
	    e.stopPropagation();
        return false;
    });  
  });
  /*$ionicPlatform.registerBackButtonAction(onBackKeyPress,1000);
  $ionicPlatform.on("backbutton", onBackKeyPress);
  $ionicPlatform.onHardwareBackButton(onBackKeyPress);
*/
});	
 
app.config(function($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise('/');
			$stateProvider
				.state('list', {
					url: '/',
					templateUrl: 'partials/list.html',
					controller: 'listController',
					resolve: {
						tables: function(listService) {
							return listService.getList();
						}
					}

				})
				.state('game', {
					url: '/game',
					templateUrl: 'partials/game.html',
					controller: 'gameController',
					resolve: {
						tables: function(listService) {
							return listService.getList();
						}
					}
				})

			;
			

		});

		/* services to share data between views */

		app.service('listService', function($q) {
			return {
				list: [],
				getList: function() {
					return this.list;
				}
			};
		});
		/* controllers */
		app.controller('gameController', function($scope, $ionicPopup, $state, $ionicPlatform, tables) {
		    $scope.score = 0;
			$scope.target = 20;
			$scope.correct = 0;
			$scope.wrong = 0;
			
			var numResults = 5;
			var maxMultiple = 12;
			var getUniquePossibleResult = function (arr, tables, max) {
				var val = 0;
				do {
			     val = tables[Math.floor(Math.random() * (tables.length) )] * Math.floor(Math.random() * max);
				}
				while ( jQuery.inArray(val ,arr) > -1);
			    return val;		
			};
			
			var generateRiddle = function (tables) {

				var riddle = { table: tables[Math.floor(Math.random() * (tables.length) )],
							   times: Math.floor(Math.random() * 11),
							 };
                var answers = [riddle.table * riddle.times];
				while ( answers.push(getUniquePossibleResult(answers,tables,maxMultiple)) < numResults );
				answers.sort( function(a, b) {
                  return a - b;
                });
				riddle.answers = [];
				jQuery.each( answers, function (index,value) {
 				 riddle.answers.push( {index: index, value: value} ); 
				});
				
				return riddle;
	  	    };

			$scope.riddle = generateRiddle(tables);
						 
			$scope.check = function (event,answer) {
				if (answer == $scope.riddle.table * $scope.riddle.times ) {
				if (ionic.Platform.isAndroid())									
					navigator.vibrate([100,100,100]);
					                $scope.score++;
									$scope.correct++;
 									$scope.riddle = generateRiddle(tables);
					
			    } 
				else {
				if (ionic.Platform.isAndroid())									
					navigator.vibrate([500]);
  				    jQuery(event.target).addClass("wrong");
					$scope.wrong++;
					if ($scope.score > 0) 
						$scope.score--;
					
				}
				if ( $scope.score == $scope.target ) {
				  var bravo = $ionicPopup.alert({
                   title: 'Bravo!',
                   template: 'Du hast es geschafft mit ' + $scope.wrong + ' Fehler.'
                  });
				  bravo.then(function() { $state.go('list'); });
				}			
			};
			
			

});

		app.controller('listController', function($scope,$state,$ionicPlatform,tables) {

			$scope.tableList = [
    { text: "1", checked: true },
    { text: "2", checked: false },
    { text: "3", checked: false },
    { text: "4", checked: false },
    { text: "5", checked: false },
    { text: "6", checked: false },
    { text: "7", checked: false },
    { text: "8", checked: false },
    { text: "9", checked: false },
    { text: "10", checked: false },
    { text: "11", checked: false },
				{text: "12", checked: false }
			
			
				
  ];
			
			$scope.startGame = function () {
				
				tables.length = 0;
				$scope.tableList.forEach ( function (elem) { if (elem.checked)
					tables.push(elem.text); });
				$state.go('game');
				};
		});
