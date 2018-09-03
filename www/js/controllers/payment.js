app.controller('PaymentCtrl', function ($scope, $rootScope, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $stateParams) {
  $scope.clientRequestId = $stateParams.client_request_id;
  $scope.washerResponseId = $stateParams.washer_response_id;
  $scope.status = $stateParams.status;
  $scope.userId = $stateParams.user_id;
  $scope.payment = {};
  $scope.payment.card_number = 5105105105105100;
  $scope.payment.expiry_month = 03;
  $scope.payment.expiry_year = 2021;
  $scope.payment.cvv = 324;
  $scope.payment.card_name = "Chetan Sharma";
  $scope.payment.amount = 10;
  $scope.paymentStatus = {};

  $scope.validatePaymentInput = function (paymentInput) {
    if (paymentInput.$valid) {
      $ionicLoading.show();
      var data = {};
      data = $scope.payment;
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.user_id = $scope.userId;
      data.client_request_id = $scope.clientRequestId;
      data.washer_response_id = $scope.washerResponseId;
      data.action = "payment";
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $ionicLoading.hide();
        if (data && data.code == 200 && data.response) {
          $scope.paymentStatus = data.response;
          $state.go("payment-success", { "status": 1 });
        } else {
          $state.go("payment-success", { "status": 0 });
        }
      }, null);
    }
  }

});
