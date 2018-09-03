app.controller('ClientRequestDetailCtrl', function ($scope, PaypalService, $rootScope, $http, apiUrl, $state,
                                                    $ionicLoading, store, $ionicModal, apiUsername, apiPassword, $stateParams) {

  $scope.clientRequestId = $stateParams.client_request_id;
  $scope.clientRequestDetail = {};
  $ionicModal.fromTemplateUrl('templates/rating.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });
  $scope.$on('$ionicView.afterEnter', function () {
    $scope.getClientRequest($scope.clientRequestId);
  });

  $scope.getClientRequest = function (id) {
    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "clientrequestdetail";
    data.client_request_id = id;
    data.user_id = store.get("userId");
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      console.log("clientrequestdetail response :"+ JSON.stringify(data));
      $ionicLoading.hide();
      if(data.code == 200){
		    data.response.timeAgo = $scope.timeAgo(data.response.washerdetail.washer_response_date);
        $scope.clientRequestDetail = data.response;
        $scope.clientRequestDetail.client_request.distance = Math.round($scope.distance(store.get('latitude'), store.get('longitude'), parseFloat($scope.clientRequestDetail.user.latitude), parseFloat($scope.clientRequestDetail.user.longitude)) * 100) / 100;

        $scope.ratingsObject = {
          iconOn: 'ion-ios-star',    //Optional
          iconOff: 'ion-ios-star-outline',   //Optional
          iconOnColor: 'rgb(200, 200, 100)',  //Optional
          iconOffColor: 'rgb(200, 100, 100)',    //Optional
          rating:  data.response.client_request.washer_rating,
          readOnly: true,
          callback: function (rating, index) {
          }
        };
      }
      // $scope.$digest();
    }, function (error) {
      $ionicLoading.hide();
    });
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

  $scope.timeAgo = function (objectDate) {
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
    if (week == 0 && hours == 0 && minutes < 5) {
      value = minutes;
    }
    return value;
  }

  $scope.cancelRequest = function (clientRequestDetail) {
    if ($scope.timeAgo(clientRequestDetail.details.washerdetail.washer_response_date) != null) {
      $ionicLoading.show();
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "cancelrequest";
      data.client_request_id = clientRequestDetail.details.client_request.client_request_id;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $ionicLoading.hide();
        if (data && data.code == 200) {
          clientRequestDetail.details.client_request.is_payment_done = 2;
        }
        $scope.$digest();
      }, function (error) {
        $ionicLoading.hide();
      });
    } else {
      $ionicLoading.show({
        template: "You can't Cancel this request, 5 Minutes are Over.",
        duration: 2000
      });
    }
  }

  $scope.setJobCompleted = function (requestId, userId){
    $state.go('rating', {
      requestId: requestId,
      userId: store.get("userId")
    });
  };

});
