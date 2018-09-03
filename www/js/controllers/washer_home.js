app.controller('WasherHomeCtrl', function ( $ionicPlatform, $scope, $cordovaCamera, $cordovaFile, $rootScope, $http, apiUrl,
                                           $cordovaLocalNotification, apiPassword, apiUsername, $state, $ionicLoading,
                                           $cordovaActionSheet, $cordovaGeolocation, $cordovaDevice, $cordovaFileTransfer, store, $timeout, $ionicSideMenuDelegate, $interval, $cordovaDialogs, $cordovaGeolocation) {
  var web = false;
  $scope.counter = {};
  $scope.interval = null;
  $scope.notificationList = [];
  $scope.washerConfirmed = store.get("washerConfirmed");
  $scope.image = null;
  $scope.name = store.get("name");

  var lat, long;

  setInterval(function(){
    currentLocation();
  }, 10000);
  
  //storing current latlng into db
  function currentLocation(){
    var posOptions = {timeout: 10000, enableHighAccuracy: true};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        lat  = position.coords.latitude;
        long = position.coords.longitude;
        localStorage.setItem("washer_lat", lat);
        localStorage.setItem("washer_long", long);
        console.log("Washer- latitude: "+lat+" longitude: "+long);
        //alert("latitude: "+lat+" longitude: "+long);
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        // data.action = "update_washer_location";
        data.action = "saveLocationHistory";
        data.user_id = store.get("userId");
        data.latitude = lat;
        data.longitude = long;
          $.ajax({
            type: 'POST',
            url: apiUrl,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
          }).then(function (data) {
            console.log("saveLocationHistory Response :"+JSON.stringify(data));
          }, function (error) {
            console.log(error)
          });
      }, function(err) {
        console.log("error: "+err);
        //alert("error: "+err);
      });
  }
  //storing current latlng into db end

  $scope.$on('$ionicView.beforeEnter', function () {
    $ionicPlatform.ready(function() {
      $rootScope.getProfilePicture(function (data) {
        console.log("getProfilePicture :"+JSON.stringify(data));
        $scope.profilePic = "http://172.104.174.8/carwashmi/uploadedImages/" + data.response;
      });
      $scope.interval = $interval(function () {
        updateList();
      }, 3000);
      $scope.getWasherCounter();
    });
  });

  

  $scope.$on('$ionicView.beforeLeave', function () {
    $interval.cancel($scope.interval);
  });

  function updateList() {
    $scope.getWasherServiceList();
    $rootScope.updateCurrentLocation(function (location) {
    });
  }

  $scope.uploadImage = function () {
    if ($scope.image != undefined && $scope.image != "") {
      var url = "http://172.104.174.8/carwashmi/uploadedImages/upload.php";
      var targetPath = $scope.pathForImage($scope.image);
      var mechanic = store.get("userId") + '_Profile_' + $scope.image;
      var filename = $scope.image;
      var options = {
        fileKey: "file",
        fileName: mechanic,
        chunkedMode: false,
        mimeType: "multipart/form-data",
        params: { 'fileName': mechanic }
      };
      $ionicLoading.show({
        template: 'Upload in Progress'
      });
      $cordovaFileTransfer.upload(url, targetPath, options).then(function (result) {
        $ionicLoading.hide();
        $cordovaDialogs.alert('Upload finished.', "Success", "Ok");
        $scope.profilePic = "http://172.104.174.8/carwashmi/uploadedImages/" + mechanic;
        var data = {};

        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "profileimage";
        data.user_id = store.get("userId");
        data.img = mechanic;
        $.ajax({
          type: 'POST',
          url: apiUrl,
          data: data,
          contentType: "application/x-www-form-urlencoded",
          crossDomain: true
        }).then(function (response) {
          $scope.profilePic = "http://172.104.174.8/carwashmi/uploadedImages/" + mechanic;
          store.set('profile_pic', mechanic);
        }, function (error) {
        });
      });
    } else {
      $cordovaDialogs.alert("Please choose File first!", "Required", "Close");
    }
  }
  $scope.pathForImage = function (image) {
    if (image === null) {
      return '';
    } else {
      return cordova.file.dataDirectory + image;
    }
  };

  $scope.selectPicture = function (sourceType) {
    var options = {
      quality: 100,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: sourceType,
      saveToPhotoAlbum: false
    };

    $cordovaCamera.getPicture(options).then(function (imagePath) {
        // Grab the file name of the photo in the temporary directory
        var currentName = imagePath.replace(/^.*[\\\/]/, '');

        //Create a new name for the photo
        var d = new Date(),
          n = d.getTime(),
          newFileName = n + ".jpg";

        // If you are trying to load image from the gallery on Android we need special treatment!
        if ($cordovaDevice.getPlatform() == 'Android' && sourceType === Camera.PictureSourceType.PHOTOLIBRARY) {
          window.FilePath.resolveNativePath(imagePath, function (entry) {
              window.resolveLocalFileSystemURL(entry, success, fail);

              function fail(e) {

              }

              function success(fileEntry) {
                var namePath = fileEntry.nativeURL.substr(0, fileEntry.nativeURL.lastIndexOf('/') + 1);
                // Only copy because of access rights
                $cordovaFile.copyFile(namePath, fileEntry.name, cordova.file.dataDirectory, newFileName).then(function (success) {
                  $scope.image = newFileName;
                  $scope.uploadImage();
                }, function (error) {
                  $scope.showAlert('Error', error.exception);
                });
              };
            }
          );
        } else {
          var namePath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
          // Move the file to permanent storage
          $cordovaFile.moveFile(namePath, currentName, cordova.file.dataDirectory, newFileName).then(function (success) {
            $scope.image = newFileName;
            $scope.uploadImage();
          }, function (error) {
            $scope.showAlert('Error', error.exception);
          });
        }
      },
      function (err) {
        // Not always an error, maybe cancel was pressed...
      })
  };
  $scope.loadImage = function () {
    var options = {
      title: 'Select Image Source',
      buttonLabels: ['Load from Library', 'Use Camera'],
      addCancelButtonWithLabel: 'Cancel',
      androidEnableCancelButton: true,
    };
    $cordovaActionSheet.show(options).then(function (btnIndex) {
      var type = null;
      if (btnIndex === 1) {
        type = Camera.PictureSourceType.PHOTOLIBRARY;
      } else if (btnIndex === 2) {
        type = Camera.PictureSourceType.CAMERA;
      }
      if (type !== null) {
        $scope.selectPicture(type);
      }
    });
  };
  $scope.testFileUpload = function () {

    var url = "http://172.104.174.8/carwashmi/uploadedImages/upload.php";
    var targetPath = cordova.file.externalRootDirectory + "Download/images.jpg";
    var filename = targetPath.split("/").pop();

    var options = {
      fileKey: "file",
      fileName: filename,
      chunkedMode: false,
      mimeType: "image/jpg",
      params: { 'directory': 'uploadedImages', 'fileName': filename } // directory represents remote directory,  fileName represents final remote file name
    };
    var permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.READ_EXTERNAL_STORAGE, checkPermissionCallback, checkPermissionError);

    function checkPermissionCallback(status) {
      if (!status.hasPermission) {
        var errorCallback = function () {
          console.warn('Storage permission is not turned on');
        }
        permissions.requestPermission(
          permissions.READ_EXTERNAL_STORAGE,
          function (status) {
            if (!status.hasPermission) {
              errorCallback();
            } else {
              $cordovaFileTransfer.upload(url, targetPath, options).then(function (result) {

              }, function (err) {
                
              }, function (progress) {
                // PROGRESS HANDLING GOES HERE
              });
            }
          },
          errorCallback);
      }
    }

    function checkPermissionError(status) {

    }
  }

  $scope.toggleLeft = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  var options = {
    android: {
      senderID: "288921546976"
    },
    ios: {
      senderID: "288921546976",
      gcmSandbox: "development",
      alert: 'true',
      badge: 'true',
      sound: 'true'
    },
    windows: {}
  };

  if (window.FCMPlugin) {
    setTimeout(function () {
      FCMPlugin.getToken(function (token) {
        if (token) {
          console.log("Device Token :"+token);
          store.set("gcm", token);
          $scope.updateDeviceToken(token);
        } else {
          $scope.updateDeviceToken();
        }

      });
    }, 4000);

//    FCMPlugin.onNotification(function (data) {
//      console.log("onNotification Response :"+JSON.stringify(data));
//      var alarmTime = new Date();
//      alarmTime.setMinutes(alarmTime.getMinutes());
//      $cordovaLocalNotification.add({
//        id: "1234",
//        date: alarmTime,
//        message: data.message,
//        title: "CarWashMi"
//      }).then(function () {
//      });
//    });
               
    FCMPlugin.onNotification(function(data){
      console.log("onNotification Response :"+JSON.stringify(data));
      if(data.wasTapped){
        //Notification was received on device tray and tapped by the user.
        alert(data.message);
      }else{
        //Notification was received in foreground. Maybe the user needs to be notified.
        alert(data.message);
      }
    });
  }
  
  $rootScope.$on('$cordovaPushV5:notificationReceived', function (event, data) {
    var alarmTime = new Date();
    alarmTime.setMinutes(alarmTime.getMinutes());
    if ($cordovaLocalNotification) {
      $cordovaLocalNotification.add({
        id: "1234",
        date: alarmTime,
        message: data.message,
        title: "CarWashMi"
      }).then(function () {
      });
    }
  });

  $rootScope.$on('$cordovaPushV5:errorOcurred', function (event, e) {
    alert(JSON.stringify(e, null, 4));
  });

  $scope.updateDeviceToken = function (gcm) {
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "updatedevicetokan";
    data.user_id = store.get("userId");
    data.device_type = ionic.Platform.isAndroid() ? 0 : 1;
    data.device_token = gcm ? gcm : store.get("gcm");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
    }, null);
  }

  $scope.logout = function () {
    //setting latlng to zero before logout
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "update_washer_location";
    data.user_id = store.get("userId");
    data.latitude = 0;
    data.longitude = 0;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        console.log("Zero Inserted successfully."+JSON.stringify(data));
      }, function (error) {
        console.log(error)
      });
      //end setting latlng to zero before logout
    store.remove("userEmail");
    store.remove("loginSuccess");
    store.remove("userType");
    store.remove("firstLogin");
    store.remove("userId");
    store.remove("isProfileCompleted");
    store.remove("name");
    store.remove("gcm");
    store.remove("washerConfirmed");
    $rootScope.removeDeviceToken();
    
    // $interval.cancel($rootScope.washerInterval);
    $rootScope.secondForm = true;
    $state.go("login");
  }


  $scope.getWasherCounter = function () {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "totalwash";
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      console.log("getWasherCounter: "+JSON.stringify(data));
      $scope.counter = data.response.totalwash;
    }, function (error) {
    });
  }
  
  $scope.getWasherServiceList = function () {
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "washernotification";
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      //console.log("getWasherServiceList: "+JSON.stringify(data));
      if (data && data.response) {
        $scope.notificationList = data.response;
        $scope.$digest();
      } else {
        $scope.notificationList = [];
      }
    }, null);

  }

  $scope.gotoResponse = function (notification) {
    $state.go("washer-response", {
      'client_request_id': notification.client_request_id,
      'washer_response_id': notification.washer_response_id,
      'is_washer_accepted': notification.is_washer_accepted
    });
  }

});
