app.controller('saveCreditCard', function ($scope, $rootScope, $cordovaDialogs, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $stateParams, PaypalService) {

  $scope.points = {};
  $scope.point = 0
  $scope.card = {};
  $scope.$on('$ionicView.beforeEnter', function () {
    $scope.getPoints();
  });

  $scope.validatePointsInput = function () {
    if ($scope.points.point > 0) {
      PaypalService.initPaymentUI().then(function () {

        PaypalService.makePayment($scope.points.point, "Total Amount").then(function (data) {
          $scope.addPoints(data.response.id, $scope.points.point, 1);
        }, function (error) {
          $scope.addPoints("N/A", $scope.points.point, 2);
          $ionicLoading.show({
            template: "Transaction was cancelled.",
            duration: 3000
          });
        });
      });
    } else {
      $ionicLoading.show({
        template: "Enter Valid Points",
        duration: 3000
      });
    }
  }

  $scope.addPoints = function (id, points, status) {
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "addpoints";
    data.user_id = store.get("userId");
    data.points = points;
    data.transaction_status = status;
    data.transaction_id = id;
    data.environment = "Sandbox";
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $cordovaDialogs.alert(JSON.stringify(data, null, 4), "Success", "Ok");
      if (status == 1) {
        $scope.point = points;
      }
      $scope.$digest();
    }, function (error) {
      $cordovaDialogs.alert(JSON.stringify(error, null, 4), "Error", "Close");
      /*$ionicLoading.show({
          template: 'Unable to connect',
          duration: 2000
      });*/
    });
  }

  $scope.getPoints = function () {
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
      if (data && data.response) {
        $scope.point = data.response.points;
      }
      $scope.$digest();
    }, function (error) {
      /*$ionicLoading.show({
          template: 'Unable to connect',
          duration: 2000
      });*/
    });
  }
  $scope.saveCreditCard = function () {
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>'
    });

    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "addpaymentmethod";
    data.user_id = store.get("userId");
    data.cardnumber = parseInt($scope.card.cardnumber);
    data.xpirymonth = parseInt($scope.card.xpirymonth);
    data.year = parseInt($scope.card.year);
    data.cvv = parseInt($scope.card.cvv);
    data.type = $scope.card.cardClass;
    data.card_name = $scope.card.card_name;
    data.card_type = $scope.card.card_type;
    data.country = $scope.card.country;

    console.log("Form Data :"+JSON.stringify(data));

    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      console.log("Response addpaymentmethod :"+JSON.stringify(data));
      if (data.code == 200) {
        $cordovaDialogs.alert(data.success, "Success", "Ok");
        $state.go('add_points', {reload: true});
      } else {
        $cordovaDialogs.alert(data.error, "Error", "Close");
      }
    }, function (error) {
      $ionicLoading.hide();
      console.log("Error addpaymentmethod :"+JSON.stringify(error));
    });

  }
  $scope.getPaypalAuthentication = function () {

  }

});
