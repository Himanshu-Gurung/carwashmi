app.controller('ScheduleRequestCtrl', function ($scope, $rootScope, $http, apiUrl, apiPassword, apiUsername, $state, $ionicLoading, store, $timeout, $ionicSideMenuDelegate, $interval) {

  $scope.notificationList = [];

  $scope.$on('$ionicView.afterEnter', function () {
    $scope.getScheduleRequest();
  });

  $scope.$on('$ionicView.beforeLeave', function () {
    $scope.scheduleList = [];
  });

  $scope.getScheduleRequest = function () {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "my_schedule_job";
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      console.log("getScheduleRequest response :"+JSON.stringify(data));
      $ionicLoading.hide();
      if (data && data.response) {
        $scope.scheduleList = data.response;
        $scope.$digest();
      }
    }, function (error) {
      $ionicLoading.hide();
      console.log("getScheduleRequest error :"+JSON.stringify(error));
    });
  }

  $scope.delete_request = function(item){
    console.log("Delete Request Item :"+JSON.stringify(item));

    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "delete_schedule_job";
    data.user_id = store.get("userId");
    data.client_request_id = item.client_request_id;

    console.log("Form Data delete_request :"+JSON.stringify(data));
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      console.log("delete_schedule_job response :"+JSON.stringify(data));
      $scope.getScheduleRequest();
    }, function (error) {
      $ionicLoading.hide();
      console.log("delete_schedule_job error :"+JSON.stringify(error));
    });
  }

});