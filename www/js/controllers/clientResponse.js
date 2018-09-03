app.controller('ClientResponseCtrl', function ($ionicPlatform, $scope, $rootScope, $http, PaypalService, apiUrl, $state, $ionicLoading, $cordovaDialogs, store, apiUsername, apiPassword, $stateParams) {

  $scope.clientRequestId = $stateParams.client_request_id;
  $scope.washerResponseId = $stateParams.washer_response_id;
  $scope.is_washer_accepted = $stateParams.is_washer_accepted;
  $scope.clientRequest = {};
  $scope.clientRequest.customer_rating = 0;

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

  $scope.$on('$ionicView.enter', function(){
    $scope.getClientRequest($scope.clientRequestId);
  });

  $scope.rateCustomer = function (requestId, userId) {
    $state.go('rating-washer', {
      requestId: requestId,
      userId: userId
    });
  }

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
      $ionicLoading.hide();
      if (data && data.code == 200) {
        $scope.ratingsObject = {
          iconOn: 'ion-ios-star',
          iconOff: 'ion-ios-star-outline',
          iconOnColor: 'rgb(200, 200, 100)',
          iconOffColor: 'rgb(200, 100, 100)',
          rating:  data.response.customer_rating,
          readOnly: true,
          callback: function (rating, index) { }
        };
        $scope.clientRequest = data.response;
        $scope.clientRequest.distance = Math.round($scope.distance(store.get('latitude'), store.get('longitude'), parseFloat($scope.clientRequest.latitude), parseFloat($scope.clientRequest.longitude)) * 100) / 100;
        console.log("getclientrequest Response : "+JSON.stringify($scope.clientRequest));
        $scope.$digest();
      }
    })
    
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

  $scope.submitResponse = function (val) {
    console.log("Value :"+val);
    if (val == 1) {
      var data = {};
      $ionicLoading.show();
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "updatewasherresponse";
      data.client_request_id = $scope.clientRequestId;
      data.washer_response_id = $scope.washerResponseId;
      data.user_id = store.get("userId");
      data.is_washer_accepted = val;

      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (d) {
        console.log("updatewasherresponse Response :"+JSON.stringify(d));
        $ionicLoading.hide();
        if (d && d.code == 200) {
          console.log("Test Test !!");
          $state.go("locate_washer", {
            "client_request_id": $scope.clientRequestId,
            "userType": "client",
            "washer_id": d.response.washer_id,
            "latitude": d.response.latitude,
            "longitude": d.response.longitude,
            "clientId": $scope.clientRequest.user_id
          });
          $scope.$digest();
        }
      }, function (error){
        console.log("updatewasherresponse Error :"+JSON.stringify(error));
        $rootScope.counter = $rootScope.counter + 1;
        $ionicLoading.hide();
      });
    }
    else if(val == 2) {
      console.log("Condition 2");
      var data = {};
      $ionicLoading.show();
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "updatewasherresponse";
      data.client_request_id = $scope.clientRequestId;
      data.washer_response_id = $scope.washerResponseId;
      data.user_id = store.get("userId");
      data.is_washer_accepted = val;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $ionicLoading.hide();
        console.log("updatewasherresponse Response :"+JSON.stringify(data));
        if (data && data.code == 200) {
          console.log("Test Test !!");
          // $ionicLoading.show({
          //   template: 'Your response submitted successfully',
          //   duration: 2000
          // });
          $state.go("washer-home");
        }
      }, function (error) {
        $ionicLoading.hide();
        console.log("updatewasherresponse Error :"+JSON.stringify(error));
      });
    }
  }
  $scope.setCompletedStatus = function (clientRequestId, clientUserId) {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "isjobcompleted";
    data.client_request_id = clientRequestId;
    data.user_id = clientUserId;
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      $scope.clientRequest.is_job_completed = 1;
      navigator.notification.alert('Job Completed');
    }, function (error) {
      $ionicLoading.hide();
    });
  }


});
