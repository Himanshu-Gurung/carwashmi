if ($scope.clientRequest.default_method == "paypal") {
  var total = $scope.clientRequest.points;
  PaypalService.initPaymentUI().then(function () {
    PaypalService.makePayment(total, "Total Amount", $http, 'b', $ionicLoading, apiUsername, apiPassword, $scope.clientRequest.user_id, apiUrl, $scope.clientRequestId, $state, $cordovaDialogs).then(function (response) {
      $cordovaDialogs.alert('get refresh token', "Success", "Ok");
    }, function (error) {
      $cordovaDialogs.alert("Transaction Canceled", "Error", "Close");
    });
  });

} else {

  var total = $scope.clientRequest.points;
  var data1 = {};
  data1.username = apiUsername;
  data1.pwd = apiPassword;
  data1.action = "cardpayment";
  data1.client_request_id = $scope.clientRequestId;
  data1.user_id = $scope.clientRequest.user_id;
  data1.amount = total;
  $.ajax({
    type: 'POST',
    url: apiUrl,
    data: data1,
    contentType: "application/x-www-form-urlencoded",
    crossDomain: true
  }).then(function (data) {
    $ionicLoading.hide();
    if (data.success = "success") {
      $cordovaDialogs.alert("Payment Done!", "Success", "Ok");

      var data1 = {};
      data1.username = apiUsername;
      data1.pwd = apiPassword;
      data1.action = "cutomerdetails";
      data1.client_request_id = $scope.clientRequestId;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data1,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data2) {


        if (data2.response.washer_id && data2.code == 200) {
          $ionicLoading.hide();
          $state.go("locate_washer", {
            "client_request_id": $scope.clientRequestId,
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
        // $ionicLoading.show({
        //     template: 'Unable to connect',
        //     duration: 2000
        // });
      });
    } else {
      $cordovaDialogs.alert == ("Payment Failed!", "Error", "Close");

    }
  }, function (error) {
    $ionicLoading.hide();
    // $ionicLoading.show({
    //     template: 'Unable to connect',
    //     duration: 2000
    // });
  });
}