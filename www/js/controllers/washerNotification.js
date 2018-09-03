app.controller('WasherNotificationCtrl', function ($ionicPlatform, $scope, $rootScope, $http, apiUrl, apiPassword, apiUsername, $state, $ionicLoading, store, $timeout, $ionicSideMenuDelegate, $interval) {
  $scope.response = true;
  $scope.notificationList = [];

  $scope.$on('$ionicView.afterEnter', function(){

    $scope.getWasherHistory()
  });

  $scope.$on('$ionicView.beforeLeave', function () {
    $scope.notificationList = [];
  });

$scope.getWasherHistory = function () {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "washerhistory";
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      if (data && data.response) {
        $scope.notificationList = data.response;
        $scope.$digest();
      }
    }, function (error) {
      $ionicLoading.hide();
    });
  }

  $scope.gotoResponse = function (notification){
    console.log("gotoResponse notification :"+JSON.stringify(notification));
    if(notification.is_request_open == "5"){
      var data1 = {};
      data1.username = apiUsername;
      data1.pwd = apiPassword;
      data1.action = "cutomerdetails";
      data1.client_request_id = notification.client_request_id;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data1,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data2) {
        $ionicLoading.hide();
        if (data2 && data2.code == 200) {
          console.log("client latitude :"+data2.response.latitude);
          $state.go("washerOnGoingJob", { "client_request_id": notification.client_request_id });
        }
        $scope.$digest();
      }, function (error) {
        $rootScope.counter = $rootScope.counter + 1;
        $ionicLoading.hide();
      });
    }
    else if (notification.is_request_open != "3" && notification.is_request_open != "4" && notification.is_request_open != "10" && notification.is_request_open != "1") {
      $state.go("washer-response", {
        'client_request_id': notification.client_request_id,
        'washer_response_id': notification.washer_response_id,
        'is_washer_accepted': notification.is_washer_accepted
      });
    }
  }

  $scope.goToLocation = function (notification) {
    var data1 = {};
    data1.username = apiUsername;
    data1.pwd = apiPassword;
    data1.action = "cutomerdetails";
    data1.client_request_id = notification.client_request_id;
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data1,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data2) {
      $ionicLoading.hide();
      if (data2 && data2.code == 200) {
        console.log("client latitude :"+data2.response.latitude);
        $state.go("locate_washer", {
          "client_request_id": notification.client_request_id,
          "userType": "washer",
          "washer_id": data2.response.washer_id,
          "latitude": data2.response.latitude,
          "longitude": data2.response.longitude
        });
      }
      $scope.$digest();
    }, function (error) {
      $rootScope.counter = $rootScope.counter + 1;
      $ionicLoading.hide();
    });
  }
});
