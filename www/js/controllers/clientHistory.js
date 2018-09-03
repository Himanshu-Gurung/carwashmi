app.controller('ClientHistoryCtrl', function ($scope, $rootScope, $http, apiUrl, apiPassword, apiUsername, $state, $ionicLoading, store, $timeout, $ionicSideMenuDelegate, $interval) {

  $scope.notificationList = [];

  $scope.$on('$ionicView.afterEnter', function () {
    $scope.getWasherHistory();
  });

  $scope.$on('$ionicView.beforeLeave', function () {
    $scope.notificationList = [];
  });

  $scope.getWasherHistory = function () {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "allclientrequest";
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

  $scope.payToWasher = function (notification) {
    console.log("payToWasher notification : "+JSON.stringify(notification));
    if(notification.is_request_open == "3" || notification.is_request_open == "4" || notification.is_request_open == "10" || notification.is_request_open == "1"){
      return;
    }
    else if(notification.is_request_open == "5"){
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "washerdetails";
      data.client_request_id = notification.client_request_id;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function(data){
        $ionicLoading.hide();
        console.log("washer latitude :"+data.response.latitude);
          console.log("washer latitude :"+data.response.latitude);
        if (data && data.code == 200) {
          console.log("n client id "+notification.client_request_id);
          $state.go("locate_client", {
            "client_request_id": notification.client_request_id,
            "userType": "washer",
            "washer_id": data.response.washer_id,
            "latitude": data.response.latitude,
            "longitude": data.response.longitude
          });
        }
        $scope.$digest();
      }, function(error){
        $ionicLoading.hide();
      });
    }
    else if(notification.is_request_open == "7"){
      $state.go("paid_details", { 'client_request_id': notification.client_request_id });
    }
    else if(notification.is_request_open != "0"){
      $state.go("client-request-detail", { 'client_request_id': notification.client_request_id });
    }
    else{
      $ionicLoading.show({
        template: 'No Washer has Accepted this request.',
        duration: 2000
      });
    }
  }

  $scope.goToLocation = function (notification) {
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "washerdetails";
    data.client_request_id = notification.client_request_id;
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      console.log("washer latitude :"+data.response.latitude);
        console.log("washer latitude :"+data.response.latitude);
      if (data && data.code == 200) {
        console.log("n client id "+notification.client_request_id);
        $state.go("locate_client", {
          "client_request_id": notification.client_request_id,
          "userType": "washer",
          "washer_id": data.response.washer_id,
          "latitude": data.response.latitude,
          "longitude": data.response.longitude
        });
      }
      $scope.$digest();
    }, function (error) {
      $ionicLoading.hide();
    });

  }

});