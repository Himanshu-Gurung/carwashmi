app.controller('washerOnGoingJobCtrl', function ($scope, $rootScope, $http, apiUrl, apiPassword, apiUsername, $stateParams, $state, $ionicLoading, store, $timeout, $ionicSideMenuDelegate, $interval, $cordovaPushV5, PaypalService, $cordovaDialogs) {

  $scope.clientRequestId = $stateParams.client_request_id;
  $scope.clientRequest = {};

  $scope.$on('$ionicView.afterEnter', function () {
    $scope.getClientRequest($scope.clientRequestId);

    var w_lat = localStorage.getItem("washer_lat");
    var w_lng = localStorage.getItem("washer_long");
    var c_lat = localStorage.getItem("c_lat");
    var c_lng = localStorage.getItem("c_lng");
    console.log("w_lat: "+w_lat+" & w_lng: "+w_lng+" && c_lat: "+c_lat+" & c_lng :"+c_lng);

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
    }).then(function (data) {
      console.log("getdistancenow Response :"+ JSON.stringify(data));
      $scope.distance = data.response.rows[0].elements[0].distance.text;
    }, function (error) {
      console.log("getdistancenow Error :"+JSON.stringify(error));
    });

  });

  var ongoingRef = firebase.database().ref('ongoing/' + $scope.clientRequestId)
  var jobStartedRef = firebase.database().ref('jobstarted/' + $scope.clientRequestId)

  ongoingRef.on('value', function (snap) {
    var val = snap.val();
    if (val && val == 1) {
      if (store.get("userType") == "0") {

      } else if (store.get("userType") == "1") {
        console.log("clientRequest :"+JSON.stringify($scope.clientRequest));
        $state.go("rating-washer", {
          "requestId": $scope.clientRequest.client_request_id,
          "userId": $scope.clientRequest.user_id,
        });
      }
    }
  })

  $scope.getClientRequest = function (id) {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "getclientrequest";
    data.client_request_id = id;
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      console.log("getclientrequest response :"+JSON.stringify(data));
      $ionicLoading.hide();
      if (data && data.code == 200) {
        $scope.clientRequest = data.response;
      }
      $scope.$digest();
    }, null);
  }

  $scope.distance = function (lat1, lon1, lat2, lon2) {
    var radlat1 = Math.PI * lat1 / 180
    var radlat2 = Math.PI * lat2 / 180
    var theta = lon1 - lon2
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    return dist
  };

  $scope.setJobDone = function () {
    $ionicLoading.show();
    var data1 = {};
    data1.username = apiUsername;
    data1.pwd = apiPassword;
    data1.action = "updaterequeststatus";
    data1.client_request_id = $scope.clientRequest.client_request_id;
    data1.user_id = $scope.clientRequest.user_id;
    data1.number = '6';

    console.log("updaterequeststatus Form Data :"+JSON.stringify(data1));
    
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data1,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data2){
      console.log("updaterequeststatus response :"+JSON.stringify(data2));
      if (data2.success == true && data2.code == 200) {
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "pushnotifications";
        data.user_id = $scope.clientRequest.user_id;
        data.client_request_id = $scope.clientRequest.client_request_id;
        data.message = 'Job Completed Successfully!';
        $.ajax({
          type: 'POST',
          url: apiUrl,
          data: data,
          contentType: "application/x-www-form-urlencoded",
          crossDomain: true
        }).then(function (data) {
          $ionicLoading.hide();
          jobStartedRef.set(1);
          if (data && data.code == 200) {
            $ionicLoading.show({
                template: 'Job Completed Successfully!',
                duration: 2000
            });
          }
          $scope.$digest();
        }, null);

        console.log("Default :"+$scope.clientRequest.default_method);
        $ionicLoading.show();
        if ($scope.clientRequest.default_method == "paypal") {
          ongoingRef.set(1)
          var total = $scope.clientRequest.points;
          PaypalService.initPaymentUI().then(function () {
            PaypalService.makePayment(total, "Total Amount", $http, 'b', $ionicLoading, apiUsername, apiPassword, $scope.clientRequest.user_id, apiUrl, $scope.clientRequest.client_request_id, $state).then(function (response) {
              $ionicLoading.hide();
              $cordovaDialogs.alert("get refresh token", "Alert", "Close");
              console.log("setJobDone makePayment :"+JSON.stringify(response));
            }, function (error) {
              $cordovaDialogs.alert("Transaction Canceled", "Alert", "Close");
            });
          });

        } else {
          var total = $scope.clientRequest.points;
          var data1 = {};
          data1.username = apiUsername;
          data1.pwd = apiPassword;
          data1.action = "cardpayment";
          data1.client_request_id = $scope.clientRequest.client_request_id;
          data1.user_id = $scope.clientRequest.user_id;
          data1.amount = total;

          console.log("cardpayment form data :"+JSON.stringify(data1));

          $.ajax({
            type: 'POST',
            url: apiUrl,
            data: data1,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
          }).then(function (data) {
            console.log("cardpayment response :"+JSON.stringify(data));
            $ionicLoading.hide();
            ongoingRef.set(1)
            if (data.success == "success") {
              $cordovaDialogs.alert("Payment Done!", "Success", "Ok");
              var data1 = {};
              data1.username = apiUsername;
              data1.pwd = apiPassword;
              data1.action = "updaterequeststatus";
              data1.client_request_id = $scope.clientRequest.client_request_id;
              data1.user_id = $scope.clientRequest.user_id;
              data1.number = '7';

              console.log("updaterequeststatus form data :"+JSON.stringify(data1));

              $.ajax({
                type: 'POST',
                url: apiUrl,
                data: data1,
                contentType: "application/x-www-form-urlencoded",
                crossDomain: true
              }).then(function (data2) {
                console.log("updaterequeststatus response :"+JSON.stringify(data1));
                $scope.$digest();
              }, function (error) {
                console.log("updaterequeststatus error :"+JSON.stringify(data1));
                $rootScope.counter = $rootScope.counter + 1;
                $ionicLoading.hide();
              });


            } else {
              $cordovaDialogs.alert("Payment Failed!", "Error", "Close");
              var data1 = {};
              data1.username = apiUsername;
              data1.pwd = apiPassword;
              data1.action = "userblock";
              data1.user_id = $scope.clientRequest.user_id;

              $.ajax({
                type: 'POST',
                url: apiUrl,
                data: data1,
                contentType: "application/x-www-form-urlencoded",
                crossDomain: true
              }).then(function (data2) {
                $scope.$digest();
              }, function (error) {
                $rootScope.counter = $rootScope.counter + 1;
                $ionicLoading.hide();
              });

            }
          }, function (error) {
            console.log("cardpayment error :"+JSON.stringify(error));
            $ionicLoading.hide();
          });
        }
      }
      $scope.$digest();
    }, function (error) {
      console.log("updaterequeststatus error :"+JSON.stringify(error));
      $rootScope.counter = $rootScope.counter + 1;
      $ionicLoading.hide();
    });
  }

  $scope.cancelRequest = function (){
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "cancelrequest";
    data.cancelby = 'washer';
    data.client_request_id = $scope.clientRequest.client_request_id;

    console.log("cancelrequest form data :"+JSON.stringify(data));

    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function(data){
      $ionicLoading.hide();
      console.log('cancelrequest response:'+JSON.stringify(data));
      if (data && data.code == 200){
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "pushnotifications";
        data.user_id = $scope.clientRequest.user_id;
        data.client_request_id = $scope.clientRequest.client_request_id;
        data.message = 'Washer has cancelled request for washing, please create a new request to found another washer.';
        $.ajax({
          type: 'POST',
          url: apiUrl,
          data: data,
          contentType: "application/x-www-form-urlencoded",
          crossDomain: true
        }).then(function(data) {
          $scope.$digest();
          $state.go('washer-home');
        }, null);
      }
    }, function (error) {
      $ionicLoading.hide();
      console.log("cancelrequest Error :"+JSON.stringify(error));
    });
  };
  
});
