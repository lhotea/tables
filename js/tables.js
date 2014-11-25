
function onBackKeyPress(e) {
		alert("Wanna go back (1)?");
		e.preventDefault();
	    e.stopPropagation();
        return false;
}

var app = angular.module('tables', ['ionic']);
app.run(
function($ionicPlatform) {
  $ionicPlatform.ready(function() {
  document.addEventListener("backbutton", onBackKeyPress, true);
	  
});
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
		app.controller('gameController', function($scope, $ionicPopup, $state, tables) {
		    $scope.score = 0;
			var generateRiddle = function (tables) {
				var riddle = { table: tables[Math.floor(Math.random() * (tables.length) )],
							   times: Math.floor(Math.random() * 11),
							 };
				riddle.answers = [ {index:1, value:riddle.table * riddle.times} , 
								{index:2, value:tables[Math.floor(Math.random() * (tables.length) )] * Math.floor(Math.random() * 11)}, 
								{index:3, value:tables[Math.floor(Math.random() * (tables.length) )] * Math.floor(Math.random() * 11)},
								{index:4, value:tables[Math.floor(Math.random() * (tables.length) )] * Math.floor(Math.random() * 11)},
								{index:5, value:tables[Math.floor(Math.random() * (tables.length) )] * Math.floor(Math.random() * 11)}
							   ];
				riddle.answers.sort(function(a, b) {
  return a.value - b.value;
});
				return riddle;
	  	    };

			$scope.riddle = generateRiddle(tables);
						 
			$scope.check = function (answer) { 
				if (answer == $scope.riddle.table * $scope.riddle.times ) {
					                $scope.score++; 
 									$scope.riddle = generateRiddle(tables);
					
			    } 
				else {
					if ($scope.score > 0)
						$scope.score--;
				}
				if ( $scope.score == 20 ) {
				  var bravo = $ionicPopup.alert({
                   title: 'Bravo!',
                   template: 'Du hast es geschafft'
                  });
				  bravo.then(function() { $state.go('list'); });
				}			
			};
			
			

});

		app.controller('listController', function($scope,$state,tables) {
			
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
