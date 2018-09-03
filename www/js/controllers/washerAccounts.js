app.controller('WasherAccountsCtrl', function ($scope, $rootScope, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $stateParams) {

  $scope.user = {};
  $scope.totalamount = 0;

  $scope.$on('$ionicView.beforeEnter', function () {
    //$scope.getUserAccounts();
    $scope.getUserDetails();
  });

  $scope.getUserAccounts = function () {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "getuseraccounts";
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentTypse: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
    }, function (error) {
      $ionicLoading.hide();
    });
  }

  $scope.getUserDetails = function () {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "getprofile";
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
        $scope.user = data.response;
        $scope.totalamount = $scope.user.totalamount;
      }
    }, function (error) {
      $ionicLoading.hide();
    });
  }

  $scope.validatePointsInput = function (pointsForm) {

    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "paymentrequest";
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data1) {
      $ionicLoading.hide();
      $ionicLoading.show({
        template: 'Request placed successfully for ' + data1.response.requested_amount,
        duration: 2000
      });
    }, function (error) {
      $ionicLoading.hide();
    });
  }

});
