app.controller('WasherCtrl', function ($scope, $state, $cordovaCamera, $cordovaFile, $rootScope, $cordovaActionSheet, $cordovaDevice, $cordovaFileTransfer, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $timeout, $filter, $cordovaDialogs, $ionicPopup) {

    $scope.washerType = 0;
    $scope.place = {};
    $scope.user = {};
    $scope.car = false;
    $scope.image = null;
    $scope.bike = true;
    $scope.placeSelected = false;
    $scope.firstLogin = store.get("isProfileCompleted") ? true : false;
    $scope.uploadImage = function () {
        // Destination URL
        if ($scope.image != undefined && $scope.image != "") {
            // var url = "http://www.carwashmi.com/uploadedImages/upload.php";
            var url = "http://172.104.174.8/carwashmi/uploadedImages/upload.php";

            // File for Upload
            var targetPath = $scope.pathForImage($scope.image);
            var mechanic = $scope.user.user_id + '_' + $scope.image;
            // File name only
            var filename = $scope.image;

            var options = {
                fileKey: "file",
                fileName: mechanic,
                chunkedMode: false,
                mimeType: "multipart/form-data",
                params: {'fileName': mechanic}
            };

            $ionicLoading.show({
                template: 'Upload in Progress'
            });

            $cordovaFileTransfer.upload(url, targetPath, options).then(function (result) {
                console.log("Image Uploader :"+JSON.stringify(result));
                $ionicLoading.hide();
                $scope.profilePic = "http://172.104.174.8/carwashmi/uploadedImages/" + mechanic;
                // $cordovaDialogs.alert('Upload finished.', "Success", "Close");
                store.set('profile_pic', mechanic);
                $cordovaDialogs.alert('Upload finished.', "Success", "Ok");
            });
        } else {
            $cordovaDialogs.alert("Please choose File first!", "Error", "Close");
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
        document.addEventListener("deviceready", function () {
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
        }, false);
    };
    
    $scope.testFileUpload = function () {
// Destination URL 
        var url = "http://172.104.174.8/carwashmi/uploadedImages/upload.php";

//File for Upload
        var targetPath = cordova.file.externalRootDirectory + "Download/images.jpg";

// File name only
        var filename = targetPath.split("/").pop();

        var options = {
            fileKey: "file",
            fileName: filename,
            chunkedMode: false,
            mimeType: "image/jpg",
            params: {'directory': 'uploadedImages', 'fileName': filename} // directory represents remote directory,  fileName represents final remote file name
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
    $scope.disableForm = function () {
        if (!$scope.firstLogin) {
            $scope.firstLoginVal = 0;
            $("#washerForm :input").attr("disabled", false);
            $("#washerForm :radio").attr("disabled", false);
            $("#washerForm :checkbox").attr("disabled", false);
        } else {
            $scope.firstLoginVal = 1;
            $("#washerForm :input").attr("disabled", true);
            $("#washerForm :radio").attr("disabled", true);
            if ($state.current.name == 'washer-service') {
                $timeout(function () {
                    $("#washerForm :checkbox").attr("disabled", true);
                }, 1000);
            }
        }
    }

    $scope.disableForm();
    var options = {
        date: new Date(),
        mode: 'date'
    };

    function onSuccess(date) {
        $scope.user.dob = $filter('date')(date, "dd-MM-yyyy");
    }

    function onError(error) {

    }

    $scope.showDate = function () {
        if ($scope.firstLoginVal == '0') {
            datePicker.show(options, onSuccess, onError);
        }
    }

    if (store.get("isProfileCompleted")) {
        $scope.profileCompleted = true;
    }
    if (!$scope.user.first_name) {
        $scope.user.is_elite_service = true;
    }

    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.getWasherProfile()
    });

    $scope.enableEdit = function (val, index) {
        $scope.firstLoginVal = val;
        if (index == 1) {
            $("#washerForm :input").attr("disabled", false);
            $("#washerForm :radio").attr("disabled", false);
        } else {
            $("#washerForm :checkbox").attr("disabled", false);
        }
    }

    $scope.changeServiceType = function (val) {
        console.log("Value :"+val);
        if ($scope.firstLoginVal == '0') {
            if (val == 0) {
                if (!$scope.user.is_elite_service) {
                    $scope.user.is_elite_service = true;
                } else {
                    $scope.user.is_elite_service = false;
                }
            } else if (val == 1) {
                if (!$scope.user.is_standard_service) {
                    $scope.user.is_standard_service = true;
                } else {
                    $scope.user.is_standard_service = false;
                }
            }
            else if (val == 3) {
                if (!$scope.user.is_fast_service) {
                    $scope.user.is_fast_service = true;
                } else {
                    $scope.user.is_fast_service = false;
                }
            } else {
                if (!$scope.user.is_premium_service) {
                    $scope.user.is_premium_service = true;
                } else {
                    $scope.user.is_premium_service = false;
                }
            }
        }
    }

    $scope.getWasherProfile = function () {
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "getprofile";
        data.user_id = store.get("userId");
        $.ajax({
            type: 'POST',
            url: apiUrl,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
        }).then(function (data) {
            if (data && data.code == 200 && data.response) {
                if (data.response.mobile_number) {
                    data.response.mobile_number = parseInt(data.response.mobile_number);
                }
                $scope.place = data.response.location;
                $scope.placeSelected = true;
                $scope.user = data.response;
                if (data.response.rider_type) {
                    $scope.user.rider_type = data.response.rider_type;
                    if ($scope.user.rider_type == "1") {
                        $("#driver").prop("checked", "checked");
                    }
                }
            }
            $scope.$digest();
        }, function (error) {
            /*$ionicLoading.show({
                template: 'Unable to connect',
                duration: 2000
            });*/
        });
    }

    $scope.changeUserType = function (val) {
        if ($scope.firstLoginVal == '0') {
            if (val == 0) {
                $("#biker").prop("checked", "checked");
            } else {
                $("#driver").prop("checked", "checked");
            }
            $scope.user.rider_type = val;
        }
    }

    $scope.getGoogleLocation = function (location) {
        if (location && location.place_id != undefined) {
            $scope.placeSelected = true;
            $scope.user.location = location.name;
            $scope.user.longitude = location.geometry.viewport.b.b;
            $scope.user.latitude = location.geometry.viewport.f.b;
            $scope.user.place_id = location.place_id;

        } else {
            $scope.placeSelected = false;
        }
    }

    $scope.next = function(){
        $state.go('washer-service');
    }

    $scope.goBack = function(){
        $state.go('washer-profile');
    }

    $scope.back = function(){
        $state.go('washer-home');
    }

    $scope.validateWasherInput = function (washerInput, val) {
        // $ionicLoading.show();
        var data = {};
        $scope.user.washer_type = $scope.washer_type;
        data = $scope.user;
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "updateprofile";

        console.log("Form Data Entered :"+JSON.stringify($scope.user));

        $.ajax({
            type: 'POST',
            url: apiUrl,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
        }).then(function (data) {
            $ionicLoading.hide();
            if (data && data.code == 200) {
                if (val == 1) {
                    $ionicLoading.show({
                        template: 'Profile Updated',
                        duration: 3000
                    }).then(function () {
                        store.set("isProfileCompleted", true);
                        store.set('name', $scope.user.first_name + " " + $scope.user.last_name);
                        $state.go("washer-home");
                    });
                } else {
                    $ionicLoading.show({
                        template: 'Profile Updated',
                        duration: 3000
                    }).then(function () {
                        $state.go("washer-service");
                    });
                }
            }
        }, null);
    }

    $scope.update_service = function(){
        // $ionicLoading.show();
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "update_service_type";
        data.service_type = $scope.data;
        data.washer_id = store.get("userId");
        
        console.log("Form Data :"+JSON.stringify(data));

        $.ajax({    
            type: 'POST',
            url: apiUrl,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
        }).then(function (data){
            $ionicLoading.hide();
            console.log("Response Data :"+JSON.stringify(data));
            if(data.code == 200){
                var content = "<p class='showPop'>Washer Service Updated.</p>";
                store.set('current_service',data.response.current_service);
                var res = store.get("current_service");
                $scope.data = data.response.current_service;
                console.log("current_service :"+JSON.stringify(res));

                var myPopup = $ionicPopup.show({
                    template: content,
                    title: 'Success',
                    buttons: [
                      { text: 'Close' }
                    ]
                });
                $state.go("washer-home");
            }
        }, function(error){
            console.log("Response Error :"+JSON.stringify(error));
        });
    };

    // $scope.data = {
    //     "is_fast_service": true,
    //     "is_standard_service" : false,
    //     "is_elite_service" : true,
    //     "is_premium_service" : false
    // };
    
    $scope.data = store.get("current_service");

    if($scope.data.is_fast_service == 1){
       $scope.data.is_fast_service = true; 
    }
    else if($scope.data.is_fast_service == 0){
       $scope.data.is_fast_service = false; 
    }
    if($scope.data.is_standard_service == 1){
       $scope.data.is_standard_service = true; 
    }
    else if($scope.data.is_standard_service == 0){
       $scope.data.is_standard_service = false; 
    }
    if($scope.data.is_elite_service == 1){
       $scope.data.is_elite_service = true; 
    }
    else if($scope.data.is_elite_service == 0){
       $scope.data.is_elite_service = false; 
    }
    if($scope.data.is_premium_service == 1){
       $scope.data.is_premium_service = true; 
    }
    else if($scope.data.is_premium_service == 0){
       $scope.data.is_premium_service = false; 
    }



    $scope.changeService = function (val) {
        console.log("Value :"+val);
        if ($scope.firstLoginVal == '0') {
            if (val == 0) {
                if (!$scope.data.is_elite_service) {
                    $scope.data.is_elite_service = true;
                } else {
                    $scope.data.is_elite_service = false;
                }
            } else if (val == 1) {
                if (!$scope.data.is_standard_service) {
                    $scope.data.is_standard_service = true;
                } else {
                    $scope.data.is_standard_service = false;
                }
            }
            else if (val == 3) {
                if (!$scope.data.is_fast_service) {
                    $scope.data.is_fast_service = true;
                } else {
                    $scope.data.is_fast_service = false;
                }
            } else {
                if (!$scope.data.is_premium_service) {
                    $scope.data.is_premium_service = true;
                } else {
                    $scope.data.is_premium_service = false;
                }
            }
        }
    }
    
    // Triggered on a button click, or some other target
    $scope.showPopup = function() {
      var content = "<p class='showPop'>Washer is expected to have the supplies needed for every service type they chose to .By checking the box below you hereby acknowledge that you have read and understood the different service types and responsible to effectively provide the service types of your choosing.</p>";
      // An elaborate, custom popup
      var myPopup = $ionicPopup.show({
        template: content,
        title: 'Terms & Conditions',
        scope: $scope,
        buttons: [
          { text: 'I Agree' }
        ]
      });
    };

});
