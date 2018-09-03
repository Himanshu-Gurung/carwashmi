app.controller('LandingCtrl', function ($ionicPlatform, $scope, $ionicSlideBoxDelegate, $cordovaCamera, $cordovaFile, $rootScope, $http, apiUrl, $state, $ionicLoading, store, $cordovaActionSheet, $cordovaDevice, $cordovaFileTransfer, $timeout, $ionicSideMenuDelegate, $cordovaLocalNotification, apiUsername, apiPassword, $cordovaPushV5) {
  $scope.loginInput = {};
  $scope.signupInput = {};
  $scope.forgotPwdInput = {};
  $scope.changePwdInput = {};
  $scope.comparePwd = false;

  // intro sliding functions
  $scope.startApp = function() {
    $state.go('intro-legal');
  };

  $scope.accept_legal = function() {
    $state.go('landing');
  };

  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
  //end intro sliding functions

  var config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Access-Control-Allow-Origin': '*'
    }
  };
  $scope.$on('$ionicView.afterEnter', function () {
    $ionicPlatform.ready(function () {
      $scope.skipAction();
    });
  });
  $scope.validateLoginInput = function (loginForm) {
    if (loginForm.$valid) {
      $ionicLoading.show();
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = 'login';
      data.email = $scope.loginInput.email;
      data.password = $scope.loginInput.password;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $ionicLoading.hide();
        if (data && data.code && data.code == 200 && data.response.userinfo) {
          store.set('userType', data.response.userinfo.user_type);
          store.set('userEmail', data.response.userinfo.email);
          store.set('name', data.response.userinfo.first_name + ' ' + data.response.userinfo.last_name);
          store.set('userId', data.response.userinfo.user_id);
          store.set('loginSuccess', true);

          store.set('firstLogin', data.response.userinfo.firstlogin);
          if (data.response.userinfo.firstlogin == "0") {
            if (data.response.userinfo.user_type == "0") {
              $state.go("client-profile");
            } else {
              $state.go("washer-profile");
            }
          } else {
            store.set("isProfileCompleted", true);
            if (data.response.userinfo.user_type == "0") {
              $state.go("home");
            } else {
              $state.go("washer-home");
            }
          }
        } else {
          $ionicLoading.show({
            template: data.error,
            duration: 2000
          });
        }
      }, function (error) {
        $ionicLoading.hide();
      });
    }
  }

  $scope.validateSignupInput = function (signupForm) {
    if (signupForm.$valid) {
      if (($scope.signupInput.password == $scope.signupInput.passwordCnf) && ($scope.signupInput.email2 == $scope.signupInput.email)) {
        $ionicLoading.show();
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = 'signup';
        data.email = $scope.signupInput.email;
        data.password = $scope.signupInput.password;
        data.user_type = $stateParams.userType;
        $.ajax({
          type: 'POST',
          url: apiUrl,
          data: data,
          contentType: "application/x-www-form-urlencoded",
          crossDomain: true
        }).then(function (response) {
          $ionicLoading.hide();
          if (response && response.code && response.code == 200) {
            $ionicLoading.show({
              template: "Password has been sent to you registered email id",
              duration: 3000
            });
            $state.go('login');
          } else {
            $ionicLoading.show({
              template: response.error,
              duration: 2000
            });
          }
        }, function (error) {
          $ionicLoading.hide();
        });
      } else {
        $scope.comparePwd = true;
      }
    }
  }

  $scope.validateForgotPwdInput = function (forgotPwdForm) {
    if (forgotPwdForm.$valid) {
      $ionicLoading.show();
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = 'forgotpass';
      data.email = $scope.forgotPwdInput.email;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (response) {
        $ionicLoading.hide();
        if (response && response.code && response.code == 200) {
          $ionicLoading.show({
            template: "Password has been sent to you registered email id",
            duration: 3000
          });
          $state.go('login');
        } else {
          $ionicLoading.show({
            template: response.error,
            duration: 2000
          });
        }
      }, function (error) {
        $ionicLoading.hide();
      });
    }
  }

  $scope.validateChangePwdInput = function (changePwdForm) {
    if (changePwdForm.$valid) {
      if ($scope.changePwdInput.password == $scope.changePwdInput.passwordCnf) {
        $scope.comparePwd = false;
        $ionicLoading.show();
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = 'changepass';
        data.email = store.get("userEmail");
        data.new_password = $scope.changePwdInput.password;
        $.ajax({
          type: 'POST',
          url: apiUrl,
          data: data,
          contentType: "application/x-www-form-urlencoded",
          crossDomain: true
        }).then(function (response) {
          $ionicLoading.hide();
          if (response && response.code && response.code == 200) {
            $ionicLoading.show({
              template: "Password changed successfully",
              duration: 2000
            });
            if (store.get("userType") == "0") {
              $state.go('home');
            } else {
              $state.go('washer-home');
            }
          } else {
            $ionicLoading.show({
              template: response.error,
              duration: 2000
            });
          }
        }, function (error) {
          $ionicLoading.hide();
        });
      } else {
        $scope.comparePwd = true;
      }
    }
  }

  $scope.skipAction = function () {
    if (store.get("userType") == "0") {
      $state.go('home');
    } else if (store.get("userType") == "1") {
      $state.go('washer-home');
    }
  }
});
