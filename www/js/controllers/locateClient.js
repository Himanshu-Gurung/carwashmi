app.controller('LocateClientCtrl', function ($ionicPlatform, $scope, $rootScope, $cordovaDialogs, $window, $http, apiUrl, $state, $ionicLoading, store, $timeout, $ionicSideMenuDelegate, apiUsername, apiPassword, $stateParams, $interval, $cordovaSms, $cordovaGeolocation, PaypalService) {
  $scope.map = null;
  $scope.clientDetails = {
    marker: null,
    latLng: null,
    markerIcon: "images/user.png"
  };

  $scope.washerDetails = {
    marker: null,
    latLng: null,
    markerIcon: "images/car_marker_backup.png"
  };

  showMap();

  $scope.interval = null;
  $scope.latLang;
  $scope.minutes = 0;
  $scope.visible = 'none';
  $scope.showLabel = false;
  $scope.value;
  $scope.phone;
  $scope.clientRequestDetail = {};
  var notificationSent = false;

  var clientId, washerId;

  if ($stateParams.userType == "client") {
    clientId = $stateParams.clientId;
    washerId = store.get("userId");
  } else {
    clientId = store.get("userId");
    washerId = $stateParams.washer_id;
  }
  
  $scope.$on('$ionicView.beforeEnter', function(){
    $ionicPlatform.ready(function(){
      $scope.interval = $interval(function(){
        console.log("job_cancel_status :"+$scope.job_cancel_status+" && client_request_id:"+$stateParams.client_request_id);
        job_cancel_status($stateParams.client_request_id);
      }, 5000);
      $scope.getClientRequest($stateParams.client_request_id);
    });
  });

  $scope.$on('$ionicView.beforeLeave',function(){
    $interval.cancel($scope.interval);
  });

  function job_cancel_status(client_request_id){
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "job_cancel_status";
    data.client_request_id = client_request_id;

    console.log("job_cancel_status form data :"+JSON.stringify(data));
    
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      console.log("job_cancel_status response :"+JSON.stringify(data));
      if(data.response.job_cancel_status == true){
        $state.go("home");
      }
    }, function (error) {
      $ionicLoading.hide();
      console.log("job_cancel_status error :"+JSON.stringify(error));
    });
  }

  function updateCurrentLocation() {
    $rootScope.updateCurrentLocation(function (location) {
      $scope.latLang = new google.maps.LatLng(location.latitude, location.longitude);
        $scope.getwasherLocation();
    })
  }

  var jobStartedRef = firebase.database().ref('jobstarted/' + $stateParams.client_request_id)

  var washerRef = firebase.database().ref("locations/user_" + washerId),
    clientRef = firebase.database().ref("locations/user_" + clientId)

  var reached = false;
  var ongoingRef = firebase.database().ref('ongoing/' + $stateParams.client_request_id)
  jobStartedRef.on('value', function (snapshot) {
    var val = snapshot.val();
    if (val && val == 1 && $stateParams.userType == "client") {
      $state.go("washerOnGoingJob", { "client_request_id": $stateParams.client_request_id });
    } else {
      ongoingRef.on('value', function (snap) {
        var val = snap.val();
        if (val && val == 1) {
          if ($stateParams.userType == "washer") {
            $state.go("rating", {
              "requestId": $stateParams.client_request_id,
              "userId": store.get("userId")
              // "card": $scope.clientRequest.default_method != "paypal",
              // "paypal": $scope.clientRequest.default_method == "paypal"
            });
          }
        }
      })
    }
  })

  // $interval(updateMarkers, 5000);
  
  var rad = function (x) {
    return x * Math.PI / 180;
  };

  $scope.getDistance = function (p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
  };

  function distanceBetween(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  }

  function updateMarkers() {
    if ($scope.washerDetails.marker != null && $scope.clientDetails.marker != null) {
      var latlngbounds = new google.maps.LatLngBounds();
      var washerLatLng = $scope.washerDetails.latLng,
        clientLatLng = $scope.clientDetails.latLng;

      if ($scope.washerDetails.marker != null) {
        $scope.washerDetails.marker.setPosition(washerLatLng)
        latlngbounds.extend(washerLatLng);
      }

      if ($scope.clientDetails.marker != null) {
        $scope.clientDetails.marker.setPosition(clientLatLng)
        latlngbounds.extend(clientLatLng);
      }

      console.log("washer latlng  :"+JSON.stringify($scope.w_latlng));
      console.log("client latlng  :"+JSON.stringify($scope.c_latlng));

      var w_lat = $scope.w_latlng.latitude, w_lng = $scope.w_latlng.longitude;
      var c_lat = $scope.c_latlng.latitude, c_lng = $scope.c_latlng.longitude;
      localStorage.setItem("w_lat", w_lat);
      localStorage.setItem("w_lng", w_lng);
      localStorage.setItem("c_lat", c_lat);
      localStorage.setItem("c_lng", c_lng);   

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
        $scope.time = data.response.rows[0].elements[0].duration.text;
      }, function (error) {
        console.log("getdistancenow Error :"+JSON.stringify(error));
      });

      $scope.map.fitBounds(latlngbounds);
      var distanceCalculated = distanceBetween(washerLatLng.lat(), washerLatLng.lng(), clientLatLng.lat(), clientLatLng.lng())
      $scope.distanceInMeters = Math.round(distanceCalculated * 1000)
      //console.log($scope.distanceInMeters)
      $scope.showLabel = true;
      reached = $scope.distanceInMeters < 350;

      if (!notificationSent && reached) {
        notificationSent = true;
        if ($stateParams.userType == "washer") {
          var data = {};
          data.username = apiUsername;
          data.pwd = apiPassword;
          data.action = "pushnotifications";
          data.user_id = $scope.clientRequestDetail.client_request.user_id;
          data.client_request_id = $scope.clientRequestDetail.client_request.client_request_id;
          data.message = 'Washer has arrived at your destination';
          $.ajax({
            type: 'POST',
            url: apiUrl,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
          }).then(function (data) {
            $ionicLoading.hide();
            $scope.$digest();
          }, function (error) {
            $ionicLoading.hide();
          });


        } else {
          $scope.visible = true;
          var data = {};
          data.username = apiUsername;
          data.pwd = apiPassword;
          data.action = "pushnotifications";
          data.user_id = $stateParams.washer_id;
          data.message = 'You have arrived clients destination';
          $.ajax({
            type: 'POST',
            url: apiUrl,
            data: data,
            contentType: "application/x-www-form-urlencoded",
            crossDomain: true
          }).then(function (data) {
            $ionicLoading.hide();
            $scope.$digest();
          }, function (error) {
            $ionicLoading.hide();
          });
        }
      }
    }
  }

  $scope.goToWasherOngoingJob = function () {
    var data1 = {};
    data1.username = apiUsername;
    data1.pwd = apiPassword;
    data1.action = "updaterequeststatus";
    data1.client_request_id = $stateParams.client_request_id;
    data1.user_id = clientId;
    data1.number = '5';
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data1,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data2) {
      console.log("updaterequeststatus response :"+JSON.stringify(data2));
      if (data2.success == true && data2.code == 200) {
        var data = {};
        data.username = apiUsername;
        data.pwd = apiPassword;
        data.action = "jobstarted";
        data.client_request_id = $stateParams.client_request_id;

        $.ajax({
          type: 'POST',
          url: apiUrl,
          data: data,
          contentType: "application/x-www-form-urlencoded",
          crossDomain: true
        }).then(function (data) {
          $ionicLoading.hide();
          jobStartedRef.set(1);
        }, function (error) {
          $ionicLoading.hide();
        });
        $scope.$digest();
      }
    }, function (error) {
      console.log("updaterequeststatus error :"+JSON.stringify(error));
      $rootScope.counter = $rootScope.counter + 1;
      $ionicLoading.hide();
    });

  }

  $scope.goBackWasher = function () {
    $state.go('washer-home');
  }

  $scope.goBackClient = function () {
    $state.go('home');
  }

  function showMap() {
    // Instantiate a directions service.
    var directionsService = new google.maps.DirectionsService;
    var mapOptions = {
      maxZoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      zoomControl: false,
      streetViewControl: false
    };
    $scope.map = new google.maps.Map(document.getElementById("mapLocate"), mapOptions);

    // Create a renderer for directions and bind it to the map.
    var directionsDisplay = new google.maps.DirectionsRenderer({map: $scope.map});

    // Display the route between the initial start and end selections.
    calculateAndDisplayRoute(
        directionsDisplay, directionsService, $scope.map);
  }


  function calculateAndDisplayRoute(directionsDisplay, directionsService, map) {
    var a = localStorage.getItem('w_lat');
    var b = localStorage.getItem('w_lng');
    var c = localStorage.getItem('c_lat');
    var d = localStorage.getItem('c_lng');
    directionsService.route({
      origin: a+','+b, 
      destination: c+','+d,
      travelMode: 'DRIVING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        console.log('Directions request failed due to ' + status);
      }
    });
  }

  $scope.degreesToRadians = function (degrees) {
    return degrees * Math.PI / 180;
  }

  $scope.distanceInKmBetweenEarthCoordinates = function (lat1, lon1, lat2, lon2) {
    var earthRadiusKm = 6371;

    var dLat = $scope.degreesToRadians(lat2 - lat1);
    var dLon = $scope.degreesToRadians(lon2 - lon1);

    lat1 = $scope.degreesToRadians(lat1);
    lat2 = $scope.degreesToRadians(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  $scope.getwasherLocation = function () {

    washerRef.on('value', function (snapshot) {
       var latLng = snapshot.val();
       $scope.w_latlng = latLng;
       console.log("washer latLng : "+JSON.stringify(latLng));
        if (latLng) {
          $scope.washerDetails.latLng = new google.maps.LatLng(latLng.latitude, latLng.longitude);

          if ($scope.washerDetails.marker == null) {

            $scope.washerDetails.marker = new google.maps.Marker({
              map: $scope.map,
              animation: google.maps.Animation.DROP,
              position: $scope.washerDetails.latLng,
              icon: $scope.washerDetails.markerIcon
            });
          }
          updateMarkers();
        }
    })

    clientRef.on('value', function (snapshot) {
        var latLng = snapshot.val();
        $scope.c_latlng = latLng;
        //console.log("client: "+JSON.stringify(latLng));
        if (latLng) {
          $scope.clientDetails.latLng = new google.maps.LatLng(latLng.latitude, latLng.longitude);
          if ($scope.clientDetails.marker == null) {
            $scope.clientDetails.marker = new google.maps.Marker({
              map: $scope.map,
              animation: google.maps.Animation.DROP,
              position: $scope.clientDetails.latLng,
              icon: $scope.clientDetails.markerIcon
            });
          }
            updateMarkers();
        }
    })
  }

  $scope.getClientRequest = function (id) {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "clientrequestdetail";
    data.client_request_id = id;
    data.user_id = clientId;

    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      console.log("clientrequestdetail response :"+JSON.stringify(data));
      $ionicLoading.hide();
      if (data && data.code == 200) {
        data.response.timeAgo = $scope.timeAgo(data.response.washerdetail.washer_response_date);
        $scope.phone = data.response.user.mobile_number;
        $scope.clientRequestDetail = data.response;
        $scope.latLang = new google.maps.LatLng($stateParams.latitude, $stateParams.longitude);
        $scope.getwasherLocation();
      }
    }, function (error) {
      $ionicLoading.hide();
      console.log("clientrequestdetail error :"+JSON.stringify(error));
    });
  }

  $scope.distance = function (lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1 / 180
    var radlat2 = Math.PI * lat2 / 180
    var theta = lon1 - lon2
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") {
      dist = dist * 1.609344
    }
    if (unit == "N") {
      dist = dist * 0.8684
    }
    if (unit == "M") {
      dist = dist * 1609.344
    }
    return dist
  }

  $scope.calling = function () {
    if ($scope.phone.length = 10) {
      window.plugins.CallNumber.callNumber(null, null, $scope.phone, false);
    }
  }

  var options = {
    replaceLineBreaks: false,
    android: {
      intent: 'INTENT'
    }
  }

  $scope.gotoMessage = function () {
    $cordovaSms
      .send($scope.phone, ' ', options)
      .then(function () {
        // Success! SMS was sent
      }, function (error) {
        // An error occurred
      });
  }

  $scope.timeAgo = function (objectDate){
    console.log("washer details "+JSON.stringify($scope.clientDetails));
    console.log("client details "+JSON.stringify($scope.washerDetails));
    var value = null;
    var todaysDate = new Date(new Date().toLocaleString('en-US', {
      timeZone: 'America/Phoenix'
    }));
    var msecPerMinute = 1000 * 60;
    var msecPerHour = msecPerMinute * 60;
    var msecPerDay = msecPerHour * 24;
    var msecPerWeek = msecPerDay * 7;
    var intervalTime = todaysDate.getTime() - new Date(objectDate).getTime();
    var week = Math.floor(intervalTime / msecPerWeek);
    intervalTime = intervalTime - (week * msecPerWeek);
    var days = Math.floor(intervalTime / msecPerDay);
    intervalTime = intervalTime - (days * msecPerDay);
    var hours = Math.floor(intervalTime / msecPerHour);
    intervalTime = intervalTime - (hours * msecPerHour);
    var minutes = Math.floor(intervalTime / msecPerMinute);
    intervalTime = intervalTime - (minutes * msecPerMinute);
    var seconds = Math.floor(intervalTime / 1000);
    value = minutes;
    $scope.minutes = minutes;
    return value;
  }


  $scope.cancelRequest = function (clientRequestDetail,role) {
    console.log("ClientRequestDetail :"+JSON.stringify(clientRequestDetail)+" && Role :"+role);
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "cancelrequest";
    data.cancelby = role;
    data.client_request_id = $stateParams.client_request_id;

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
        console.log("UserType :"+$stateParams.userType);
        console.log("clientRequestDetail "+JSON.stringify($scope.clientRequestDetail));
        if($stateParams.userType == "client"){
          var data = {};
          data.username = apiUsername;
          data.pwd = apiPassword;
          data.action = "pushnotifications";
          data.user_id = $scope.clientRequestDetail.client_request.user_id;
          data.client_request_id = $scope.clientRequestDetail.client_request.client_request_id;
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
        else{
          if ($scope.clientRequestDetail.clientUser.default_method == "paypal"){
            var total = $scope.clientRequestDetail.cancellation_fee;
            PaypalService.initPaymentUI().then(function () {
              PaypalService.makePayment(total, "Total Amount", $http, 'b', $ionicLoading, apiUsername, apiPassword, $scope.clientRequestDetail.client_request.user_id, apiUrl, $scope.clientRequestDetail.client_request.client_request_id, $state, 'Client',10).then(function (response) {
                alert('get refresh token');
              }, function (error) {
                alert("Transaction Canceled");
              });
            });
            var data = {};
            data.username = apiUsername;
            data.pwd = apiPassword;
            data.action = "pushnotifications";
            data.user_id = $stateParams.washer_id;
            data.message = 'Customer has cancelled request for washing. You will still get your money from carwashmi';
            $.ajax({
              type: 'POST',
              url: apiUrl,
              data: data,
              contentType: "application/x-www-form-urlencoded",
              crossDomain: true
            }).then(function (data) {
              $state.go("home");
              // $scope.$digest();
            }, function (error) {
            });
          }
          else {
            var total = $scope.clientRequestDetail.cancellation_fee;
            var data1 = {};
            data1.username = apiUsername;
            data1.pwd = apiPassword;
            data1.action = "cardpayment";
            data1.client_request_id = $scope.clientRequestDetail.client_request.client_request_id;
            data1.user_id = $scope.clientRequestDetail.client_request.user_id;
            data1.amount = total;
            $.ajax({
              type: 'POST',
              url: apiUrl,
              data: data1,
              contentType: "application/x-www-form-urlencoded",
              crossDomain: true
            }).then(function (data) {
              $ionicLoading.hide();
              if (data.success = "success") {
                $cordovaDialogs.alert("Payment Done!", "Success", "Ok");
                var data1 = {};
                data1.username = apiUsername;
                data1.pwd = apiPassword;
                data1.action = "updaterequeststatus";
                data1.client_request_id = $scope.clientRequestDetail.client_request.client_request_id;
                data1.user_id = $scope.clientRequestDetail.client_request.user_id;
                data1.number = '10';
                $.ajax({
                  type: 'POST',
                  url: apiUrl,
                  data: data1,
                  contentType: "application/x-www-form-urlencoded",
                  crossDomain: true
                }).then(function (data2) {
                  if (data2.success == true && data2.code == 200) {
                    // $state.go('washerOnGoingJob');
                    $state.go("home");
                  }
                  $scope.$digest();
                }, function (error) {
                  $rootScope.counter = $rootScope.counter + 1;
                  $ionicLoading.hide();
                });
              } 
              else {
                $cordovaDialogs.alert("Payment Failed and User Blocked!", "Error", "Close");
                var data1 = {};
                data1.username = apiUsername;
                data1.pwd = apiPassword;
                data1.action = "userblock";
                data1.user_id = $scope.clientRequestDetail.client_request.user_id;

                $.ajax({
                  type: 'POST',
                  url: apiUrl,
                  data: data1,
                  contentType: "application/x-www-form-urlencoded",
                  crossDomain: true
                }).then(function (data2){
                  if (data2.success == true && data2.code == 200) {
                    // $state.go('washerOnGoingJob');
                    $state.go("home");
                  }
                  $scope.$digest();
                }, function (error) {
                  $rootScope.counter = $rootScope.counter + 1;
                  $ionicLoading.hide();
                });
              }
            }, function (error) {
              $ionicLoading.hide();
            });

            var data = {};
            data.username = apiUsername;
            data.pwd = apiPassword;
            data.action = "pushnotifications";
            data.user_id = $stateParams.washer_id;
            data.message = 'Customer has cancelled request for washing. You will still get your money from carwashmi';
            $.ajax({
              type: 'POST',
              url: apiUrl,
              data: data,
              contentType: "application/x-www-form-urlencoded",
              crossDomain: true
            }).then(function (data) {
              // $state.go("home");
              // $scope.$digest();
            }, function (error) {
            });
          }
        }
      }
      $scope.$digest();
    }, function (error) {
      $ionicLoading.hide();
      console.log("cancelrequest Error :"+JSON.stringify(error));
    });
  };

});
