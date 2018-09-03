app.controller('RatingCtrl', function ($scope, $rootScope, $cordovaDialogs, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $stateParams, PaypalService) {

  $scope.points = {};
  $scope.point = 0;
  $scope.rating = 0;
  $scope.rate = {};
  $scope.method = [];
  $scope.clientRequestDetail = {};
  
  $scope.$on('$ionicView.afterEnter', function () {
    $scope.getClientRequest($state.params.requestId);
  });
  $scope.getClientRequest = function (id) {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "clientrequestdetail";
    data.client_request_id = id;
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      if (data && data.code == 200) {
        $scope.clientRequestDetail = data.response.details;
      }
    }, function (error) {
      $ionicLoading.hide();
    });
  }
  if ($state.params.card != false) {
    $scope.method.push('Card');
  }
  if ($state.params.paypal != false) {
    $scope.method.push('Paypal');
  }


  $scope.ratingsObject = {
    iconOn: 'ion-ios-star',    //Optional
    iconOff: 'ion-ios-star-outline',   //Optional
    iconOnColor: 'rgb(200, 200, 100)',  //Optional
    iconOffColor: 'rgb(200, 100, 100)',    //Optional
    rating: 2, //Optional
    minRating: 1,    //Optional
    readOnly: true, //Optional
    callback: function (rating, index) {    //Mandatory
      $scope.ratingsCallback(rating, index);

    }
  };

  $scope.ratingsCallback = function (rating, index) {
    $scope.rating = rating;
  };
  $scope.$on('$ionicView.beforeEnter', function () {
    $scope.getPoints();
  });
  $scope.saveDetail = function () {
    $cordovaDialogs.alert('test', "Alert", "Ok");
  }
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
    }, null);
  }
  $scope.saveCreditCard = function () {
    $cordovaDialogs.alert('Credit Card Details Saved!', "Alert", "Close");
    $state.go('home');
  }
  $scope.getPaypalAuthentication = function () {

  }
  $scope.setCompletedStatus = function () {

    $ionicLoading.show();
    // $state.params.detail.clientRequestDetail.client_request.is_job_completed=1;
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "updaterequeststatus";
    data.client_request_id = $state.params.requestId;
    data.user_id = $state.params.userId;
    data.number = '8';
    data.washer_rating = $scope.rating;
    if($scope.rate.remarks != undefined){
      data.washer_comment = $scope.rate.remarks;  
    }
    else
    {
      data.washer_comment = "";
    }

    console.log("setCompletedStatus updaterequeststatus form data :"+JSON.stringify(data));

    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data){
      console.log("updaterequeststatus response :"+JSON.stringify(data));
      $ionicLoading.hide();
      $ionicLoading.show({
        template: 'Thanks for Rating!',
        duration: 2000
      });
      $state.go('home');
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "pushnotifications";
      data.user_id = $scope.clientRequestDetail.user.user_id;
      data.client_request_id = $scope.clientRequestDetail.client_request.client_request_id;
      data.message = 'Customer gave you rating of ' + $scope.rating;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        console.log("pushnotifications updaterequeststatus response :"+JSON.stringify(data));
        $ionicLoading.hide();
        $scope.$digest();
      }, function (error) {
        $ionicLoading.hide();
        console.log("pushnotifications updaterequeststatus error :"+JSON.stringify(error));
      });
    }, function (error){
      $ionicLoading.hide();
      console.log("updaterequeststatus error :"+JSON.stringify(error));
    });

  }
});
