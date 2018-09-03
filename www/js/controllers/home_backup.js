app.controller('HomeCtrl', function ($ionicPlatform, $scope, $cordovaCamera, $cordovaFile, $rootScope, $http, apiUrl, $state, $interval,
                                     $ionicLoading, store, $cordovaActionSheet, $cordovaDevice, $cordovaFileTransfer, $timeout,
                                     $ionicSideMenuDelegate, $cordovaLocalNotification, apiUsername, apiPassword,
                                     $cordovaPushV5, $cordovaGeolocation, $cordovaDialogs) {
  $rootScope.washersList = [];
  $scope.clientInput = {};
  $scope.currentUser = null;
  $scope.name = store.get("name");
  $scope.lat = 0;
  $scope.lng = 0;
  $scope.map = null;
  $scope.latlngbounds = null;
  $scope.interval = null;

  setMap()

  if (window.FCMPlugin) {

    setTimeout(function () {
      FCMPlugin.getToken(function (token) {
        if (token) {
          store.set("gcm", token);
          $scope.updateDeviceToken(token);
        } else {
          $scope.updateDeviceToken();
        }
      });
    }, 4000);

    FCMPlugin.onNotification(function (data) {
      var alarmTime = new Date();
      alarmTime.setMinutes(alarmTime.getMinutes());
      $cordovaLocalNotification.add({
        id: "1234",
        date: alarmTime,
        message: data.message,
        title: "CarWashMi",
        sound: "default",
        vibrate: 1,
        content_available: 1
      }).then(function () {

      });

    });

    $rootScope.$on('$cordovaPushV5:notificationReceived', function (event, data) {
      var alarmTime = new Date();
      alarmTime.setMinutes(alarmTime.getMinutes());
      if ($cordovaLocalNotification) {
        $cordovaLocalNotification.add({
          id: "1234",
          date: alarmTime,
          message: data.message,
          title: "CarWashMi",
          sound: "default",
          vibrate: 1,
          content_available: 1
        }).then(function () {
        });
      }
    });

    $rootScope.$on('$cordovaPushV5:errorOcurred', function (event, e) {
      $cordovaDialogs.alert(JSON.stringify(e, null, 4), "Alert", "Close");
    });
  }
  
  function setMap() {
    var mapOptions = {
      maxZoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
  }

 function setLocation() {
   var latLng = new google.maps.LatLng($scope.lat, $scope.lng);
   $scope.latlngbounds = new google.maps.LatLngBounds();
   $scope.latlngbounds.extend(latLng);
   $scope.myMarker = new google.maps.Marker({
     map: $scope.map,
     position: latLng,
     icon: 'images/user.png'
   });
   getWashers();
 }
 
$scope.$on('$ionicView.beforeEnter', function () {
  $ionicPlatform.ready(function () {
    $rootScope.getProfilePicture(function (data) {
      $scope.profilePic = "http://www.carwashmi.com/uploadedImages/" + data.response;
    })
    $scope.interval = $interval(function () {
      updateCurrentLocation()
    }, 5000);
    updateCurrentLocation()
  });
});

  function updateCurrentLocation() {
    $rootScope.updateCurrentLocation(function (location) {
      if ($scope.lat == 0 && $scope.lng == 0) {
        $scope.lat = location.latitude;
        $scope.lng = location.longitude;
        setLocation();
      }
    })
  }

  $scope.$on('$ionicView.beforeLeave', function () {
    $interval.cancel($scope.interval);
  });


  var options = {
    android: {
      senderID: "288921546976",
      alert: "true",
      badge: "true",
      sound: "true"
    },
    ios: {
      alert: "true",
      badge: "true",
      sound: "true"
    },
    windows: {}
  };

  $scope.uploadImage = function () {
    // Destination URL
    if ($scope.image != undefined && $scope.image != "") {
      var url = "http://www.carwashmi.com/uploadedImages/upload.php";


      // File for Upload
      var targetPath = $scope.pathForImage($scope.image);
      var mechanic = store.get("userId") + '_Profile_' + $scope.image;
      // File name only
      var filename = $scope.image;
      ;

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
        $scope.profilePic = "http://www.carwashmi.com/uploadedImages/" + mechanic;
        store.set('profile_pic', mechanic);
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
          $ionicLoading.hide();
          $scope.profilePic = "http://www.carwashmi.com/uploadedImages/" + mechanic;
          store.set('profile_pic', mechanic);
        }, function (error) {

          $ionicLoading.hide();
        });
      });
    } else {
      $cordovaDialogs.alert("Please choose File first!", "Required", "Ok");
    }
  }
  $scope.pathForImage = function (image) {
    if (image === null) {
      return '';
    } else {
      return cordova.file.dataDirectory + image;
    }
  };
// Take image with the camera or from library and store it inside the app folder
// Image will not be saved to users Library.
  $scope.selectPicture = function (sourceType) {
    var options = {
      quality: 70,
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
// Destination URL
    var url = "http://www.carwashmi.com/uploadedImages/upload.php";

//File for Upload
    var targetPath = cordova.file.externalRootDirectory + "Download/images.jpg";

// File name only
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


  $scope.logout = function () {
    store.remove("userEmail");
    store.remove("loginSuccess");
    store.remove("userType");
    store.remove("firstLogin");
    store.remove("userId");
    store.remove("isProfileCompleted");
    store.remove("name");
    store.remove("gcm");
    $rootScope.removeDeviceToken();
    $state.go("login");
  }

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
    }).then(function (d) {

    }, null);
  }

  function getWashers() {

    var data = {};
    $rootScope.washersList = [];
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "getwashers";
    data.longitude = $scope.lng;
    data.latitude = $scope.lat;

    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true,
    }).then(function (data) {
      $ionicLoading.hide();
      if (data.code == 200) {
        if ($.isArray(data.response)) {

          for (var i = 0; i < data.response.length; i++) {
            var latLng = new google.maps.LatLng(data.response[i].latitude, data.response[i].longitude);
            $scope.latlngbounds.extend(latLng);
            if (data.response[i].rider_type == "0") {
              new google.maps.Marker({
                map: $scope.map,
                animation: google.maps.Animation.DROP,
                position: latLng,
                icon: 'images/bike_wash.png'
              });
            } else if (data.response[i].rider_type == "1") {
              new google.maps.Marker({
                map: $scope.map,
                animation: google.maps.Animation.DROP,
                position: latLng,
                icon: 'images/marker.png'
              });
            }
          }
          $scope.map.fitBounds($scope.latlngbounds);
          $rootScope.washersList = data.response;
          store.set("washerlist", $rootScope.washersList);
        }
      }
    }, function (error) {
      $ionicLoading.hide();
    });
  }

});