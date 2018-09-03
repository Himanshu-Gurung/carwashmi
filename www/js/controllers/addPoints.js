angular.module('carwashmi.controllers', ['starter.payPalService'])

  // .constant('shopSettings', {
  //   payPalSandboxId: 'AbcHTHa-EN_3a0b6L_5KD9VUJgu5c9oZnd9GRzTZPB1HRpl1vxrfFl4dYye263X9qywmOAIsOtFrBBFV',
  //   payPalProductionId: 'carwashmi22-facilitator@gmail.com',
  //   payPalEnv: 'PayPalEnvironmentSandbox', // for testing production for production
  //   payPalShopName: 'carwashmi',
  //   payPalMerchantPrivacyPolicyURL: 'http://localhost:8383/carwashmi/index.html#/payment',
  //   payPalMerchantUserAgreementURL: 'http://localhost:8383/carwashmi/index.html#/payment'
  // })

  .constant('shopSettings', {
    payPalSandboxId: 'ARD4nYKFdo0p667pnwp3aRoTPvCVH0AUndiN7eGTBTFhbMMZJabEbk2CMwVYAyBXZdHnsNUsKhaqXlKQ',
    payPalProductionId: 'monu_kanyal-facilitator@esferasoft.com',
    payPalEnv: 'PayPalEnvironmentSandbox', // for testing production for production
    payPalShopName: 'carwashtest',
    payPalMerchantPrivacyPolicyURL: 'http://localhost:8383/carwashmi/index.html#/payment',
    payPalMerchantUserAgreementURL: 'http://localhost:8383/carwashmi/index.html#/payment'
  })

  .controller('AddPointsCtrl', function ($scope, PaypalService, $rootScope, $cordovaDialogs, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $stateParams, PaypalService) {

    $scope.points = {};
    $scope.displayPoint = null;
    $scope.point = null;
    $scope.flag = '0';
    $scope.paypal = null;
    $scope.default1 = null;
    $scope.default = null;
    $scope.card_type = null;
    $scope.card_id = null;
    $scope.button = null;

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
      $ionicLoading.show({
        template: '<ion-spinner icon="ios"></ion-spinner>'
      });

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
        $ionicLoading.hide();
        $cordovaDialogs.alert(JSON.stringify(data, null, 4), "Success", "Ok");
        if (status == 1) {
          $scope.point = points;
        }
        $scope.$digest();
      }, function (error) {
        $ionicLoading.hide();
        $cordovaDialogs.alert(JSON.stringify(error, null, 4), "Error", "Close");
        // $ionicLoading.show({
        //     template: 'Unable to connect',
        //     duration: 2000
        // });
      });
    }

    $scope.getPoints = function () {
      $scope.displayPoint = "none";
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "getcarddata";
      data.user_id = store.get("userId");
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        console.log('list card===>');
        console.log(JSON.stringify(data));
        if (data && data.response != null) {
          $scope.displayPoint = "block";
          $scope.point = data.response.card_number;

          $scope.paypal = data.response.payerinfo;
          $scope.default = data.response.default_method;
          if (($scope.paypal == null && $scope.point != null) || ($scope.paypal != null && $scope.point == null)
            || ($scope.paypal == null && $scope.point == null)
            || ($scope.paypal == 'NULL' || $scope.point == 'NULL')
          ) {
            $scope.flag = '1';
          } else {
            $scope.flag = '0';
          }
          if ($scope.default == 'card') {
            $scope.point = $scope.point + '- Default';
            $scope.button = 'Change Default to Paypal';
            $scope.default1 = 'paypal';
            $scope.card_type = data.response.card_type;
            $scope.card_id = data.response.card_id;
          } else if ($scope.default == 'paypal') {
            $scope.paypal = $scope.paypal + ' Default';
            $scope.button = 'Change Default to Card';
            $scope.default1 = 'card';
          }
        }
        $scope.$digest();
      }, function (error) {
        console.log("getcarddata Error :"+JSON.stringify(error));
      });
    }
    $scope.deleteCard = function (card_id) {
      $ionicLoading.show({
        template: '<ion-spinner icon="ios"></ion-spinner>'
      });
      // console.log("Card Id :"+card_id);

      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "deletecard";
      data.delete_type = 'card';
      data.card_id = card_id;
      data.user_id = store.get("userId");

      console.log("Delete Card Data :"+JSON.stringify(data));
      
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $ionicLoading.hide();
        console.log("Delete Card Response :"+JSON.stringify(data));
        if (data && data.response) {
          $scope.point = null;
          $scope.getPoints();
        }
        $scope.$digest();
      }, function (error) {
        $ionicLoading.hide();
        console.log("Delete Card Error :"+JSON.stringify(error));
      });
    }

    $scope.deletePaypal = function (type,card_type) {
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "deletepaypal";
      data.delete_type = 'paypal';
      data.card_type = card_type;
      data.user_id = store.get("userId");

      console.log("Delete Paypal Data :"+JSON.stringify(data));
      
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        if (data && data.response) {
          console.log("deletecard response :"+JSON.stringify(data));
          if (type == 'card') {
            $scope.point = null;
          }
          else {
            $scope.paypal = null;
            $state.go($state.current, {}, {reload: true});
          }
          $scope.getPoints();
        }
        $scope.$digest();
      }, function (error) {
        console.log("deletecard error :"+JSON.stringify(error));
      });
    }

    $scope.defaultCard = function (type) {
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "defaultcard";
      data.default_type = type;
      data.user_id = store.get("userId");
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $scope.getPoints();
        if (data && data.response) {
          $scope.point = "";
        }
        $scope.$digest();
      }, function (error) {

      });
    }
    $scope.getCreditCard = function () {

      $state.go('save_card');

    }
    $scope.getPaypalAuthentication = function () {
      PaypalService.initPaymentUI().then(function () {
        PaypalService.makePayment(1, "Total Amount", $http, 'A', $ionicLoading, apiUsername, apiPassword, store.get("userId"), apiUrl).then(function (response) {
          $ionicLoading.hide();
          $cordovaDialogs.alert('get refresh token', "Success", "Ok");
        }, function (error) {
          $ionicLoading.hide();
          $cordovaDialogs.alert("Transaction Canceled", "Error", "Close");
        });
      });
    }

  });
