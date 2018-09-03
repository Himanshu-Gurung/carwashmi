app.controller('LoginCtrl', function ($ionicPlatform, $scope, $cordovaCamera, $stateParams,
                                      $cordovaFile, $rootScope, $http, apiUrl, $state, $ionicLoading,
                                      store, $cordovaActionSheet, $cordovaDevice, $cordovaFileTransfer, $timeout,
                                      $ionicSideMenuDelegate, $cordovaLocalNotification, apiUsername, apiPassword) {
  $scope.loginInput = {};
  $scope.signupInput = {};
  $scope.forgotPwdInput = {};
  $scope.changePwdInput = {};
  $scope.comparePwd = false;

  var config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Access-Control-Allow-Origin': '*'
    }
  };

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
        console.log("Response login data :"+JSON.stringify(data));
        if (data && data.code && data.code == 200 && data.response.userinfo) {
          store.set('userType', data.response.userinfo.user_type);
          store.set('userEmail', data.response.userinfo.email);
          store.set('name', data.response.userinfo.first_name + ' ' + data.response.userinfo.last_name);
          store.set('userId', data.response.userinfo.user_id);
          store.set('profile_pic', data.response.userinfo.profile_pic);
          store.set('loginSuccess', true);
          store.set('firstLogin', data.response.userinfo.firstlogin);
          store.set('washerConfirmed', data.response.userinfo.verify_by_admin);
          store.set('current_service',data.response.userinfo.current_service);
          $rootScope.userType = store.get('userType');
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
      if ($scope.signupInput.password == $scope.signupInput.passwordCnf) {
        if ($scope.signupInput.email == $scope.signupInput.email2) {
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
              if ($stateParams.userType == "1") {
                $ionicLoading.show({
                  template: "Thank you for registering with us! Please login and verify your account!",
                  duration: 3000
                });
              } else {
                $ionicLoading.show({
                  template: "A verification email has been sent to you registered email",
                  duration: 3000
                });
              }
              $state.go('login');
            } else {
              $ionicLoading.show({
                template: response.error,
                duration: 2000
              });
            }
          }, function (error) {
            $ionicLoading.hide();
            console.log("Error validateSignupInput :"+JSON.stringify(error));
          });
        } else {
          $scope.compareemail = true;
        }
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
  
  // if (window.cordova && window.cordova.plugins) {
  //   cordova.plugins.locationAccuracy.canRequest(function (canRequest) {
  //     if (canRequest) {
  //       cordova.plugins.locationAccuracy.request(function () {
  //         console.log("Successfully made request to invoke native Location Services dialog");
  //       }, function () {
  //         console.error("Failed to invoke native Location Services dialog");
  //       });
  //     }
  //   });
  // }

});
