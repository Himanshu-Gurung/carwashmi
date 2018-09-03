var app = angular.module('starter.payPalService', [])


app.factory('PaypalService', ['$q', '$ionicPlatform', 'shopSettings', '$filter', '$timeout', '$state','store','$cordovaDialogs', function ($q, $ionicPlatform, shopSettings, $filter, $timeout, $state, store,$cordovaDialogs) {
  var init_defer;
  /**
   * Service object
   * @type object
   */
  var service = {
    initPaymentUI: initPaymentUI,
    createPayment: createPayment,
    configuration: configuration,
    onPayPalMobileInit: onPayPalMobileInit,
    makePayment: makePayment
  };

  /**
   * @ngdoc method
   * @name initPaymentUI
   * @methodOf app.PaypalService
   * @description
   * Inits the payapl ui with certain envs.
   *
   *
   * @returns {object} Promise paypal ui init done
   */
  function initPaymentUI() {
    init_defer = $q.defer();
    $ionicPlatform.ready().then(function () {
      var clientIDs = {
        "PayPalEnvironmentProduction": shopSettings.payPalProductionId,
        "PayPalEnvironmentSandbox": shopSettings.payPalSandboxId
      };
      PayPalMobile.init(clientIDs, onPayPalMobileInit);
    });
    return init_defer.promise;
  }

  /**
   * @ngdoc method
   * @name createPayment
   * @methodOf app.PaypalService
   * @param {string|number} total total sum. Pattern 12.23
   * @param {string} name name of the item in paypal
   * @description
   * Creates a paypal payment object
   *
   *
   * @returns {object} PayPalPaymentObject
   */
  function createPayment(total, name) {
    // "Sale == > immediate payment
    // "Auth" for payment authorization only, to be captured separately at a later time.
    // "Order" for taking an order, with authorization and capture to be done separately at a later time.
    var payment = new PayPalPayment("" + total, "USD", "" + name, "Add Credit");
    return payment;
  }

  /**
   * @ngdoc method
   * @name configuration
   * @methodOf app.PaypalService
   * @description
   * Helper to create a paypal configuration object
   *
   *
   * @returns {object} PayPal configuration
   */
  function configuration() {
    // for more options see `paypal-mobile-js-helper.js`
    var config = new PayPalConfiguration({
      merchantName: shopSettings.payPalShopName,
      merchantPrivacyPolicyURL: shopSettings.payPalMerchantPrivacyPolicyURL,
      merchantUserAgreementURL: shopSettings.payPalMerchantUserAgreementURL
    });
    return config;
  }

  function onPayPalMobileInit() {
    $ionicPlatform.ready().then(function () {
      // must be called
      // use PayPalEnvironmentNoNetwork mode to get look and feel of the flow
      PayPalMobile.prepareToRender(shopSettings.payPalEnv, configuration(), function () {
        $timeout(function () {
          init_defer.resolve();
        });
      });
    });
  }

  /**
   * @ngdoc method
   * @name makePayment
   * @methodOf app.PaypalService
   * @param {string|number} total total sum. Pattern 12.23
   * @param {string} name name of the item in paypal
   * @description
   * Performs a paypal single payment
   *
   *
   * @returns {object} Promise gets resolved on successful payment, rejected on error
   */
  function makePayment(total, name, http, flag, load, apiUsername, apiPassword, userId, apiUrl, requestId, state, caller,pushStatus) {
    console.log("Inside makePayment :"+flag+" && total :"+total+" && pushStatus :"+pushStatus+" && caller :"+caller);
    if (flag == 'A') {
      load.show();
      var defer = $q.defer();
      $ionicPlatform.ready().then(function () {
        PayPalMobile.renderFuturePaymentUI(function (result){

          var data = {};
          data.username = apiUsername;
          data.pwd = apiPassword;
          data.action = "userauthorization";
          data.user_id = userId;
          data.code = result.response.code;
          $.ajax({
            type: 'POST',
            url: apiUrl,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
          }).then(function (data) {
            console.log("userauthorization response :"+JSON.stringify(data));
            load.hide();
            if (data.success === true) {
              $cordovaDialogs.alert('Authentication Successful!', "Success", "Close");
              $state.go($state.current, {}, {reload: true});
            } else {
              $cordovaDialogs.alert('Authentication Failed!', "Error", "Close");
            }

          }, function (error) {
            // load.show({
            //     template: 'Unable to connect',
            //     duration: 2000
            // });
            console.log("userauthorization error :"+JSON.stringify(error));
          });
        }, function (error) {
          load.hide();
          $cordovaDialogs.alert(error, "Error", "Ok");
        });
      });
    } 
    else {
      console.log('Payment In Progress');
      load.show({
        template: 'Payment In Progress'
      });
      var defer = $q.defer();
      // $ionicPlatform.ready().then(function () {
        var price = store.get("netprice");
        console.log("Net Price :"+price);
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "makepayment";
        data.user_id = userId;
        data.amount = total;
        data.client_request_id = requestId;

        console.log("makepayment form data :"+JSON.stringify(data));

        $.ajax({
          type: 'POST',
          url: apiUrl,
          data: data,
          contentType: "application/x-www-form-urlencoded",
          crossDomain: true
        }).then(function (data) {
          console.log("makepayment response :"+JSON.stringify(data));
          load.hide();
          if (data.success === true) {
            $cordovaDialogs.alert('Payment Done', "Success", "Ok");

            var data1 = {};
            data1.username = apiUsername;
            data1.pwd = apiPassword;
            data1.action = "updaterequeststatus";
            data1.client_request_id = requestId;
            data1.user_id = userId;
            if(pushStatus != undefined){
              data1.number = pushStatus;
            }else{
              data1.number = '7';
            }
            
            $.ajax({
              type: 'POST',
              url: apiUrl,
              data: data1,
              contentType: "application/x-www-form-urlencoded",
              crossDomain: true
            }).then(function (data2) {
              console.log("updaterequeststatus response :"+JSON.stringify(data2));
              if(pushStatus != undefined){
                if (caller == 'Client') {
                  state.go("home");
                } else {
                  state.go("washer-home");
                }
              }
              $scope.$digest();
            }, function (error) {
              console.log("updaterequeststatus error :"+JSON.stringify(error));
              $rootScope.counter = $rootScope.counter + 1;
              load.hide();
              // load.show({
              //     template: 'Unable to connect',
              //     duration: 2000
              // });
            });

          } else {
            $cordovaDialogs.alert("Payment Failed and User Blocked!", "Failed", "Ok");
            var data1 = {};
            data1.username = apiUsername;
            data1.pwd = apiPassword;
            data1.action = "userblock";
            data1.user_id = $scope.clientRequestDetail.client_request.user_id;

            $.ajax({
              type: 'POST',
              url: apiUrl,
              data: data1,
              contentType: "application/x-www-form-urlencoded",
              crossDomain: true
            }).then(function (data2) {
              if (data2.success == true && data2.code == 200) {
                if (caller == 'Client') {
                  state.go("home");
                } else {
                  state.go("washer-home");
                }
              }
              $scope.$digest();
            }, function (error) {
              $rootScope.counter = $rootScope.counter + 1;
              load.hide();
              // load.show({
              //     template: 'Unable to connect',
              //     duration: 2000
              // });
            });

          }

        }, 
        function (error) {
          console.log("makepayment error :"+JSON.stringify(error));
          load.show({
            template: 'Payment Issues',
            duration: 2000
          });
          state.go("washer-home");
        });

    }
    return defer.promise;
  }

  return service;
}]);
