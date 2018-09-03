app.controller('MyCarsCtrl', function ($ionicPlatform, $scope, $cordovaCamera, $cordovaFile, $rootScope, $http, apiUrl, $state, $interval,
                                     $ionicLoading, store, $cordovaActionSheet, $cordovaDevice, $cordovaFileTransfer, $timeout,
                                     $ionicSideMenuDelegate, $cordovaLocalNotification, apiUsername, apiPassword,
                                     $cordovaPushV5, $cordovaDialogs, $cordovaGeolocation, $ionicPopup) {

  $scope.result=[];

  $scope.$on('$ionicView.enter', function(){
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>'
    });
    
    $scope.user_id = store.get('userId');

    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = 'my_car_list';
    data.user_id = store.get('userId');

    console.log("Form Data :"+JSON.stringify(data));
    
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function(data){
      $ionicLoading.hide();
      console.log("my_car_list Response :"+JSON.stringify(data));
      
      if(data.response.length > 0){
        $scope.result = data.response;
        $scope.display = true;
      }
      else
      {
        $scope.display = false;
      }
    },function(error){
      $ionicLoading.hide();
      $cordovaDialogs.alert("No Records !", "", "Close");
      console.log("my_car_list error :"+JSON.stringify(error));    
    });
  });

  $scope.delete_car = function(id){
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = 'delete_car_details';
    data.user_id = store.get('userId');
    data.car_id = id;

    console.log("Form Data :"+JSON.stringify(data));
    
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function(data){
      console.log("delete_car_details Response :"+JSON.stringify(data));
      $cordovaDialogs.alert(data.success, "", "Close");
      $state.go('home');
    },function(error){
      console.log("delete_car_details error :"+JSON.stringify(error));    
    });

  };
  
  /*
   * if given group is the selected group, deselect it
   * else, select the given group
   */
  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };

  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

  // Triggered on a button click, or some other target
  $scope.storeClientDetails = function() {
    $scope.data = {};
    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<input type="text" placeholder="Vehicle Name" ng-model="data.vehicle_name" ng-require="true"><input type="text" placeholder="Vehicle Make" ng-model="data.vehicle_make" ng-require="true"><input type="text" placeholder="Vehicle Model" ng-model="data.vehicle_model" ng-require="true"><input type="text" placeholder="Vehicle Manufacture Yr" ng-model="data.vehicle_year" ng-require="true"><input type="text" placeholder="Vehicle Color" ng-model="data.vehicle_color" ng-require="true">',
      title: 'Enter Vehicle Details',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e){
            if(Object.keys($scope.data).length > 4) {
              return $scope.data;
            }else{
              $cordovaDialogs.alert("Please Enter Complete Vehicle Details !", "Close");
              e.preventDefault();
            }
          }
        }
      ]
    });

    myPopup.then(function(res) {
      console.log('Tapped : '+JSON.stringify(res));
      var vec_data = {
        action : 'add_mycar_info',
        user_id : $scope.user_id,
        username : apiUsername,
        pwd : apiPassword,
        vehicle_name : res.vehicle_name,
        vehicle_make : res.vehicle_make,
        vehicle_model : res.vehicle_model,
        vehicle_year : res.vehicle_year,
        vehicle_color : res.vehicle_color
      };

      console.log("Form Data :"+JSON.stringify(vec_data));      
      
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: vec_data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function(data){
        console.log("add_mycar_info Response :"+JSON.stringify(data));
        $cordovaDialogs.alert(data.success, "", "Close");
        $state.go('home');
      },function(error){
        console.log("add_mycar_info error :"+JSON.stringify(error));    
      });

    });

  };

});
