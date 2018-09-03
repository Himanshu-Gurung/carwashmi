angular.module('starter.services', [])

  .factory('Chats', function () {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var chats = [{
      id: 0,
      name: 'Ben Sparrow',
      lastText: 'You on your way?',
      face: 'img/ben.png'
    }, {
      id: 1,
      name: 'Max Lynx',
      lastText: 'Hey, it\'s me',
      face: 'img/max.png'
    }, {
      id: 2,
      name: 'Adam Bradleyson',
      lastText: 'I should buy a boat',
      face: 'img/adam.jpg'
    }, {
      id: 3,
      name: 'Perry Governor',
      lastText: 'Look at my mukluks!',
      face: 'img/perry.png'
    }, {
      id: 4,
      name: 'Mike Harrington',
      lastText: 'This is wicked good ice cream.',
      face: 'img/mike.png'
    }];

    return {
      all: function () {
        return chats;
      },
      remove: function (chat) {
        chats.splice(chats.indexOf(chat), 1);
      },
      get: function (chatId) {
        for (var i = 0; i < chats.length; i++) {
          if (chats[i].id === parseInt(chatId)) {
            return chats[i];
          }
        }
        return null;
      }
    };
  })
  .factory('PaypalService', ['$q', '$ionicPlatform', 'shopSettings', '$filter', '$timeout', function ($q, $ionicPlatform, shopSettings, $filter, $timeout) {
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
      var payment = new PayPalPayment("" + total, "USD", "" + name, "Sale");
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
    function makePayment(total, name, http, flag, load) {
      if (flag == 'A') {
        load.show();
        var defer = $q.defer();
        $ionicPlatform.ready().then(function () {
          PayPalMobile.renderFuturePaymentUI(function (result) {

            var link = 'http://codingshivaay.in/Paytm/storeRefreshToken.php';

            http.post(link, {
              code: result.response.code,
              emailid:
            }).then(function (res) {
              load.hide();
              if (res.data.success == true) {
                alert('Authentication Successful!');

              } else {
                alert('Authentication Failed!');
              }

            });
          }, function (error) {
            alert(error);
          });
        });
      } else {
        load.show();
        var defer = $q.defer();
        $ionicPlatform.ready().then(function () {
          PayPalMobile.clientMetadataID(function (result) {

            var link = 'http://codingshivaay.in/Paytm/makePayment.php';

            http.post(link, {
              code: result
            }).then(function (res) {
              load.hide();
              if (res.data.success == true) {
                alert('Payment Done');

              } else {
                alert('Payment Failed');
              }
            });

          });
        });
      }
      return defer.promise;
    }

    function doPayment(total, name, http) {
      var defer = $q.defer();
      $ionicPlatform.ready().then(function () {
        PayPalMobile.clientMetadataID(function (result) {

          var link = 'http://codingshivaay.in/Paytm/makePayment.php';

          http.post(link, {
            code: result.id
          }).then(function (res) {

            if (res.success == true) {
              alert('Authentication Successful!');

            } else {
              alert('Authentication Failed!');
            }
          });
          alert('herei amam');
        });
      });
      return defer.promise;
    }


    return service;
  }]);

