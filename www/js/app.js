app = angular.module('carwashmi', ['ionic', 'angular-storage', 'google.places', 'carwashmi.controllers', 'ngCordova', 'ionic-ratings','ionic-datepicker','ionic-timepicker'])
  .constant("apiUrl", 'http://172.104.174.8/carwashmi/swebi')
  .constant("apiUsername", 'iphone')
  .constant("apiPassword", 'washmi@0987')
  .run(function ($ionicPlatform, $rootScope, $state, $location, $interval, $ionicLoading, $ionicHistory, $timeout, store, $window, $ionicPopup, $cordovaGeolocation, apiPassword, apiUrl, apiUsername, $cordovaDialogs, $cordovaLocalNotification) {
 
    var login_test = store.get("userId");
    console.log("Login Test :"+login_test);
    
    if (store.get("loginSuccess")) {
      if (store.get("userType") == "0") {
        $state.go('client-profile');
      } else {
        // $state.go('washer-home');
        $state.go('washer-service');
      }
    }
    $.ajaxSetup({
      url: apiUrl,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true,
      cache: false,
      global: true,
      timeout: 35000
    });

    $rootScope.getProfilePicture = function (data) {
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: {
          username: apiUsername,
          pwd: apiPassword,
          action: "getprofileimg",
          user_id: store.get("userId"),
        },
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(data, null);
    }

    $rootScope.getDistanceTime = function (data,w_lat,w_lng,c_lat,c_lng){
      console.log("Test");
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: {
          username: apiUsername,
          pwd: apiPassword,
          action: "getdistancenow",
          w_lat: w_lat,
          w_lng: w_lng,
          c_lat: c_lat,
          c_lng: c_lng
        },
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(data, null);
    }

    $rootScope.updateCurrentLocation = function(callback){
      $cordovaGeolocation.getCurrentPosition({
        timeout: 15000,
        enableHighAccuracy: true,
        maximumAge: 5000
      }).then(function (p){
        console.log("response getCurrentPosition latitude :"+p.coords.latitude);
        if (store.get("userId") != null) {
          callback (p.coords);
          firebase.database().ref('locations/user_' + store.get("userId")).set({
            latitude: p.coords.latitude,
            longitude: p.coords.longitude
          });
        }
      });

      var watch = $cordovaGeolocation.watchPosition(watchOptions);
      watch.then(
        null,
        function(err) {
          // error
        },
        function(position) {
          console.log("response watchPosition latitude :"+position.coords.latitude);
          if (store.get("userId") != null) {
            firebase.database().ref('locations/user_' + store.get("userId")).set({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        });
    }

    $rootScope.removeDeviceToken = function (){
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "updatedevicetokan";
      data.user_id = store.get("userId");
      data.device_type = 0;
      data.device_token = "";
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      });
    }

    $rootScope.userType = store.get('userType');
    console.log("userType :"+$rootScope.userType);
    
    $ionicPlatform.ready(function () {
      console.log("navigator.geolocation works well");
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false); 

      if(ionic.Platform.isAndroid() && (typeof cordova.plugins.permissions !== 'undefined')) {
        var permissions = cordova.plugins.permissions;
        var list = [
          permissions.ACCESS_FINE_LOCATION,
          permissions.ACCESS_LOCATION_EXTRA_COMMANDS,
          permissions.ACCESS_COARSE_LOCATION,
          permissions.CAMERA,
          permissions.CALL_PHONE,
          permissions.BROADCAST_SMS,
          permissions.SEND_SMS,
          permissions.PHONE,
          permissions.ACCESS_NETWORK_STATE,
          permissions.ACCESS_WIFI_STATE,
          permissions.WRITE_EXTERNAL_STORAGE,
          permissions.READ_PHONE_STATE,
          permissions.READ_EXTERNAL_STORAGE,
          permissions.NETWORK_ACCESS
        ];

        permissions.requestPermissions(list, null, null);
      }

      if(ionic.Platform.isIOS()) {
          window.plugin.notification.local.promptForPermission();
      }

      $rootScope.washerInterval;
      $rootScope.washersList = [];
      $rootScope.physicalScreenHeight = window.screen.height;
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(false);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
      
      $rootScope.goBack = function () {
        $interval.cancel($rootScope.requestStatus);
        $interval.cancel($rootScope.washerLocation);
        if ($window.location.hash == '#/home' || $window.location.hash == '#/washerHome') {
          $rootScope.showConfirm();
        } else {
          $window.history.back();
        }
      }

      $ionicPlatform.registerBackButtonAction(function(e) {
        e.preventDefault();
        // $rootScope.goBack();
      }, 100);

      $rootScope.showConfirm = function () {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Exit',
          cssClass: 'my-custom-popup',
          template: 'Are you sure you want to Exit?'
        });
        confirmPopup.then(function (res) {
          if (res) {
            store.remove("userEmail");
            store.remove("loginSuccess");
            store.remove("userType");
            store.remove("firstLogin");
            store.remove("userId");
            store.remove("isProfileCompleted");
            store.remove("name");
            store.remove("gcm");
            ionic.Platform.exitApp();
          }
        });
      }

    });
  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider){
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $stateProvider.state('/', {
      url: '/',
      templateUrl: 'templates/intro.html',
      controller: 'LandingCtrl'
    }).state('landing', {
      url: 'landing',
      templateUrl: 'templates/landing.html',
      controller: 'LandingCtrl'
    }).state('home', {
      url: '/home',
      templateUrl: 'templates/home.html',
      cache: false,
      controller: 'HomeCtrl'
    }).state('washer-home', {
      url: '/washerHome',
      cache: false,
      templateUrl: 'templates/washer_home.html',
      controller: 'WasherHomeCtrl'
    }).state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    }).state('choose-user', {
      url: '/choose-user',
      templateUrl: 'templates/choose_user.html',
    }).state('signup', {
      url: '/signup/:userType',
      templateUrl: 'templates/signup.html',
      controller: 'LoginCtrl'
    }).state('forgot-password', {
      url: '/forgot-password',
      templateUrl: 'templates/forgot_password.html',
      controller: 'LoginCtrl'
    }).state('change-password', {
      url: '/change-password',
      templateUrl: 'templates/change_password.html',
      controller: 'LoginCtrl'
    }).state('changepasswordwasher', {
      url: '/changepasswordwasher',
      templateUrl: 'templates/changepasswordwasher.html',
      controller: 'LoginCtrl'
    }).state('washer-profile', {
      url: '/washer-profile',
      templateUrl: 'templates/washer_profile.html',
      controller: 'WasherCtrl',
      cache: false
    }).state('washer-service', {
      url: '/washer-service',
      templateUrl: 'templates/washer_service.html',
      controller: 'WasherCtrl',
      cache: false
    }).state('update-washer-service', {
      url: '/update-washer-service',
      templateUrl: 'templates/update-washer-service.html',
      controller: 'WasherCtrl',
      cache: false
    }).state('client-profile', {
      url: '/client-profile',
      templateUrl: 'templates/client_profile.html',
      controller: 'ClientCtrl',
      cache: false
    }).state('payment', {
      url: '/payment/:user_id/:client_request_id/:washer_response_id',
      templateUrl: 'templates/payment.html',
      controller: 'PaymentCtrl'
    })
      .state('  ', {
        url: '/splash',
        templateUrl: 'templates/splash.html'
        //controller: 'PaymentCtrl'
      }).state('payment-success', {
      url: '/payment-success/:status',
      templateUrl: 'templates/payment_status.html',
      controller: 'PaymentCtrl'
    }).state('washerOnGoingJob', {
      url: '/washerOnGoingJob',
      params: {
        'client_request_id': ''
      },
      templateUrl: 'templates/washerOnGoingJob.html',
      controller: 'washerOnGoingJobCtrl'
    }).state('history', {
      url: '/history',
      templateUrl: 'templates/history.html',
      controller: 'ClientHistoryCtrl'
    }).state('schedule-request', {
      url: '/schedule-request',
      templateUrl: 'templates/schedule-request.html',
      controller: 'ScheduleRequestCtrl'
    })
    .state('rating', {
      url: '/rating',
      params: {
        'requestId': '',
        'userId': '',
        'card': '',
        'paypal': ''
      },
      templateUrl: 'templates/rating.html',
      controller: 'RatingCtrl'
    }).state('rating-washer', {
      url: '/rating-washer',
      params: {
        'requestId': '',
        'userId': ''
      },
      templateUrl: 'templates/ratingCustomer.html',
      controller: 'RatingWasherCtrl'
    }).state('washer-notification', {
      url: '/washer-notification',
      templateUrl: 'templates/washer_notification.html',
      controller: 'WasherNotificationCtrl'
    }).state('my-wallet', {
      url: '/my-wallet',
      templateUrl: 'templates/my-wallet.html',
      controller: 'MyWalletCtrl'
    }).state('client-notification', {
      url: '/client-notification',
      templateUrl: 'templates/client_notification.html'
    }).state('my-cars', {
      url: '/my-cars',
      templateUrl: 'templates/my_cars.html',
      controller: 'MyCarsCtrl'
    }).state('washer-response', {
      url: '/washer-response/:client_request_id/:washer_response_id/:is_washer_accepted',
      templateUrl: 'templates/washer_response.html',
      controller: 'ClientResponseCtrl'
    }).state('client-request', {
      url: '/client-request',
      templateUrl: 'templates/client_request.html',
      controller: 'ClientRequestCtrl'
    }).state('schedule', {
      url: '/schedule',
      templateUrl: 'templates/schedule.html',
      controller: 'ClientRequestCtrl'
    }).state('client-request-detail', {
      url: '/client-request-detail/:client_request_id',
      templateUrl: 'templates/client_request_detail.html',
      controller: 'ClientRequestDetailCtrl'
    }).state('paid_details', {
      url: '/paid_details/:client_request_id',
      templateUrl: 'templates/paid_details.html',
      controller: 'ClientRequestDetailCtrl'
    }).state('request_send_list', {
      url: '/request_send_list/:count',
      templateUrl: 'templates/request_send_list.html',
      controller: 'ClientRequestCtrl'
    }).state('add_points', {
      url: '/add_points',
      templateUrl: 'templates/add_points.html',
      controller: 'AddPointsCtrl'
    }).state('save_card', {
      url: '/save_card',
      templateUrl: 'templates/save-card.html',
      controller: 'saveCreditCard'
    }).state('locate_washer', {
      url: '/locate_washer/:client_request_id/:userType/:washer_id/:latitude/:longitude/:clientId',
      templateUrl: 'templates/locate_washer.html',
      cache: false,
      controller: 'LocateWasherCtrl'
    }).state('locate_client', {
      url: '/locate_washer/:client_request_id/:userType/:washer_id/:latitude/:longitude/:clientId',
      templateUrl: 'templates/locate_client.html',
      cache: false,
      controller: 'LocateClientCtrl'
    }).state('washer-accounts', {
      url: '/washer-accounts',
      templateUrl: 'templates/washer_accounts.html',
      controller: 'WasherAccountsCtrl'
    }).state('nearby-washers', {
      url: '/nearby-washers',
      templateUrl: 'templates/nearby_washers.html',
      controller: 'HomeCtrl'
    })
    // YRT code
      .state('contact-us', {
        url: '/contact-us',
        templateUrl: 'templates/contact-us.html'
        //	controller: 'ContactUsCtrl'
      }).state('contact', {
        url: '/contact',
        templateUrl: 'templates/contact-n.html'
      }).state('refund_policy', {
        url: '/refund_policy',
        templateUrl: 'templates/refund_policy-n.html'
      }).state('pricing_of_services', {
        url: '/pricing_of_services',
        templateUrl: 'templates/pricing_of_services-n.html'
      }).state('privacy_policy', {
        url: '/privacy_policy',
        templateUrl: 'templates/privacy_policy-n.html'
      }).state('legal-n', {
        url: '/legal-n',
        templateUrl: 'templates/legal-n.html'
      }).state('contact_uswasher', {
      url: '/contact_uswasher',
      templateUrl: 'templates/contact-us.html'
      //controller: 'LoginCtrl'
    }).state('legal', {
      url: '/legal',
      templateUrl: 'templates/legal.html'
      //	controller: 'LegalCtrl'
    }).state('legalwasher', {
      url: '/legalwasher',
      templateUrl: 'templates/legal.html'
      //controller: 'LoginCtrl'
    }).state('info', {
        url: '/info',
        templateUrl: 'templates/info.html'
        //   controller: 'ClientCtrl'
    }).state('legal2', {
        url: '/legal2',
        templateUrl: 'templates/legal2.html'
        //	 controller: 'ClientCtrl'
      })
      .state('intro-legal', {
        url: '/intro-legal',
        templateUrl: 'templates/intro-legal.html',
        controller: 'LandingCtrl'
      }).state('legalwasher2', {
      url: '/legalwasher2',
      templateUrl: 'templates/legalwasher2.html'
      //	 controller: 'ClientCtrl'
    }).state('refund-policy', {
      url: '/refund-policy',
      templateUrl: 'templates/refundp.html'
      //	controller: 'ClientCtrl'
    }).state('refund-policywasher', {
        url: '/refund-policywasher',
        templateUrl: 'templates/refundpwasher.html'
        //	controller: 'ClientCtrl'
      }).state('pricing-of-services', {
      url: '/pricing-of-services',
      templateUrl: 'templates/p-services.html'
      //  controller: 'ClientCtrl'
    }).state('pricing-of-serviceswasher', {
        url: '/pricing-of-serviceswasher',
        templateUrl: 'templates/p-serviceswasher.html'
        //  controller: 'ClientCtrl'
    }).state('privacy-policywasher', {
      url: '/privacy-policywasher',
      templateUrl: 'templates/privacy-policywasher.html'
      //  controller: 'ClientCtrl'
    }).state('privacy-policy', {
      url: '/privacy-policy',
      templateUrl: 'templates/privacy-policy.html'
      //  controller: 'ClientCtrl'
    });

    $urlRouterProvider.otherwise('/splash');
    
  });
