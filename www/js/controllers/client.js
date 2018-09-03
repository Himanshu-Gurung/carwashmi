app.controller('ClientCtrl', function ($scope, $rootScope, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $filter) {
    $scope.user = {};
    $scope.place = {};
    $scope.placeSelected = false;
    $scope.firstLogin = store.get("isProfileCompleted") ? true : false;
    $scope.back = function(){
        $state.go('legal');
    }

    $scope.disableForm = function (){
        if (!$scope.firstLogin) {
            $scope.firstLoginVal = 0;
            $("#clientForm :input").removeAttr("disabled");
            var a = document.getElementById("userMobileNumber");
            a.disabled = false;
        } else {
            $scope.firstLoginVal = 1;
            $("#clientForm :input").attr("disabled", true);
        }
    }

    $scope.enableEdit = function (val, index){
        $scope.firstLoginVal = val;
        $("#clientForm :input").attr("disabled", false);
    }

    $scope.disableForm();
    var options = {
        date: new Date(),
        mode: 'date'
    };

    function onSuccess(date) {
        $scope.user.dob = $filter('date')(date, "dd-MM-yyyy");
        $scope.$digest();
    }

    function onError(error) {
    }

    $scope.showDate = function () {
        if ($scope.firstLoginVal == '0') {
            datePicker.show(options, onSuccess, onError);
        }
    }

    if ($scope.firstLogin) {
        $("#clientForm :input").attr("disabled", true);
    }

    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.getClientProfile()
    });

    $scope.getClientProfile = function () {
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
            console.log("Get Profile Resp :"+JSON.stringify(data));
            $scope.place = data.response.location;
            $scope.placeSelected = true;
            data.response.mobile_number = parseInt(data.response.mobile_number);
            $scope.user = data.response;
            $scope.$digest();
        }, null);
    }

    $scope.validateClientInput = function (clientInput) {
        console.log("Test");
        if (clientInput.$valid && $scope.placeSelected) {
            $ionicLoading.show();
            var data = {};
            data = $scope.user;
            data.username = apiUsername;
            data.pwd = apiPassword;
            data.action = "updateprofile";
            data.is_fast_service=false;
            console.log(data);
            $.ajax({
                type: 'POST',
                url: apiUrl,
                data: data,
                contentType: "application/x-www-form-urlencoded",
                crossDomain: true
            }).then(function (response) {
                console.log("validateClientInput response :"+JSON.stringify(response));
                $ionicLoading.hide();
                if (response.code == 200) {
                  $ionicLoading.show({
                    template: 'Profile Updated',
                    duration: 3000
                  }).then(function () {
                    store.set("isProfileCompleted", true);
                    store.set('name', $scope.user.first_name + ' ' + $scope.user.last_name);
                    $state.go("home");
                  });

                } else {
                    $ionicLoading.show({
                        template: 'Profile Updation failed',
                        duration: 2000
                    });
                }
            }, function (error){
                $ionicLoading.hide();
                // $ionicLoading.show({
                //     template: 'Unable to connect',
                //     duration: 2000
                // });
            });
        }
    }

    $scope.getGoogleLocation = function (location) {
        console.log("getGoogleLocation :"+JSON.stringify(location));
        if (location && location.place_id != undefined) {
            $scope.placeSelected = true;
            $scope.user.location = location.formatted_address;
            $scope.user.longitude = location.geometry.viewport.b.b;
            $scope.user.latitude = location.geometry.viewport.f.b;
            $scope.user.place_id = location.place_id;

        } else {
            $scope.placeSelected = false;
        }
    }

});
