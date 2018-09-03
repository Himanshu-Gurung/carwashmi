app.controller('ClientRequestCtrl', function ($scope, $rootScope, $http, apiUrl, $state, $ionicLoading, store, apiUsername, apiPassword, $interval, $stateParams, $ionicPopup, $timeout, $cordovaDialogs,ionicDatePicker,ionicTimePicker) {
  var list = [];
  $scope.users = [];
  if (store.get("washerlist") != null) {
    list = store.get("washerlist");
    $scope.users = list;
  }

  var myPopup = null;

  var info = {};
  $scope.washer_type = 0;
  $rootScope.counter = 0;
  $scope.service_type = 0;
  $scope.requestSince = 0;
  $scope.clientRequest = {};
  $scope.washer_count = $stateParams.count;
  $scope.carddata = {};
  $scope.paypaldata = {};
  
  $scope.changeVehicle = function (val) {
    $scope.washer_type = val;
  }

  $scope.changeService = function (val) {
    $scope.service_type = val;
  }
  
  $scope.filterWasher = function () {
    if (list.length == 0) {
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "getpaypalemail";
      data.user_id = store.get("userId");
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $scope.paypaldata = data;
      }, null);

      var data2 = {};
      data2.username = apiUsername;
      data2.pwd = apiPassword;
      data2.user_id = store.get("userId");
      data2.action = "getcarddata";
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data2,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data) {
        $scope.carddata = data;
      }, null);
    } else {
      for (var i = 0; i < list.length; i++) {
        if ($scope.service_type == 0 && list[i].is_elite_service == "1") {
          $scope.users.push(list[i]);
        } else if ($scope.service_type == 2 && list[i].is_standard_service == "1") {
          $scope.users.push(list[i]);
        } else if ($scope.service_type == 1 && list[i].is_premium_service == "1") {
          $scope.users.push(list[i]);
        } else {
          $scope.users.push(list[i]);
        }
      }
    }
  }

  $scope.getReqeuestStatus = function (id){
    console.log("client_request_id :"+id);
    console.log("$rootScope.counter :"+$rootScope.counter);
    if ($rootScope.counter < 5*60){
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "washerdetails";
      data.client_request_id = id;
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function (data){
          console.log('getReqeuestStatus:'+JSON.stringify(data));
        $rootScope.counter = $rootScope.counter + 1;
        if (data.response.washer_id && data.code == 200){
          $ionicLoading.hide();
          $rootScope.counter = 0;
          $interval.cancel($rootScope.requestStatus);
          $state.go("locate_client", {
            "client_request_id": id, "userType": "washer", "washer_id": data.response.washer_id,
            "latitude": data.response.latitude, "longitude": data.response.longitude
          });
        }
        $scope.$digest();
      }, function (error) {
        $rootScope.counter = $rootScope.counter + 1;
        $ionicLoading.hide();
      });
    }
    else {
      $ionicLoading.hide();
      $rootScope.counter = 0;
      $interval.cancel($rootScope.requestStatus);
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = "cancelrequest";
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
          $cordovaDialogs.alert("No Washer Accepted the request, so it is cancelled!", "Error", "Close");
          $state.go('home');
        }
        $scope.$digest();
      }, function (error) {
        $ionicLoading.hide();
      });
    }
  }
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
    $interval.cancel($rootScope.requestStatus);

    $ionicLoading.show();
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "cancelrequest";
    data.client_request_id = clientRequestDetail;
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      $ionicLoading.hide();
      if (data && data.code == 200) {

        $state.go('home');
        $scope.$digest();
      }

    }, function (error) {
      $ionicLoading.hide();
    });
  }

  if ($scope.users.length == 0) {
    $scope.filterWasher();
  }

  $scope.validateClientRequest = function (sch) {
    console.log("validateClientRequest Schedule :"+sch);
    var schedule = sch;
    if (myPopup != null) {
      myPopup.close();
    }
   
    var is_promotion_available = store.get("is_promotion_available");
    var is_cancellation_charge = store.get("is_cancellation_charge");
    var service_price = store.get("service_price");
    var content;

    console.log("is_promotion_available :"+is_promotion_available+" && is_cancellation_charge :"+is_cancellation_charge);
    if(is_promotion_available == true && is_cancellation_charge != ''){
      var netprice = store.get("netprice");
      var offer = store.get("offer");
      content="<p class='Actual'>Actual Price : <span class='service_price'>$"+service_price+"</span></p>";
      content+="<p class='offer'>Current Offer : <span>"+offer+"</span></p>";
      content+="<p class='is_cancellation_charge'>Cancellation Charge : <span>$"+is_cancellation_charge+"</span></p>";
      content+="<p class='netprice'>Net Price : <span>$"+netprice+"</span></p>";
    }
    else if(is_promotion_available == true && is_cancellation_charge == ''){
      var netprice = store.get("netprice");
      var offer = store.get("offer");
      content="<p class='Actual'>Actual Price : <span class='service_price'>$"+service_price+"</span></p>";
      content+="<p class='offer'>Current Offer : <span>"+offer+"</span></p>";
      content+="<p class='netprice'>Net Price : <span>$"+netprice+"</span></p>";
    }
    else if(is_promotion_available == false && is_cancellation_charge != ''){
      content="<p class='is_cancellation_charge'>Cancellation Charge : <span>$"+is_cancellation_charge+"</span></p>";
      content+="<p class='netprice'>Service Price : <span>$"+service_price+"</span></p>";
    }
    else{
      content="<p>Service Price : $"+service_price+"</p>";
    }

    $scope.data = {}
    myPopup = $ionicPopup.show({
      template: content,
      title: 'Price',
      scope: $scope,
      cssClass: 'my-custom-popup',
      buttons: [
        {
          text: 'Cancel',
          onTap: function (e) {
            store.set("service_price", 0);
            myPopup.close();
          }

        }, {
          text: '<b>Submit</b>',
          type: 'button-positive',
          onTap: function (e) {
            myPopup.close();
            $ionicLoading.show();
            console.log("$scope.users.length :"+$scope.users.length);
            if ($scope.users.length > 0) {
              PayPalMobile.clientMetadataID(function (result) {
                console.log("clientMetadataID Response :"+JSON.stringify(result));
                var data = {};
                data.username = apiUsername;
                data.pwd = apiPassword;
                data.action = "checkpaymentstatus";
                data.user_id = store.get("userId");
                $.ajax({
                  type: 'POST',
                  url: apiUrl,
                  data: data,
                  contentType: "application/x-www-form-urlencoded",
                  crossDomain: true
                }).then(function (data) {
                  console.log('checkpaymentstatus'+JSON.stringify(data));
                  
                  if (data.response.data.status == 1) {
                    // $ionicLoading.show();
                    
                    if(schedule == "later"){
                      var data = {};
                      data.username = apiUsername;
                      data.pwd = apiPassword;
                      data.action = "schedule_request";
                      data.vehicle_type = $scope.washer_type;
                      data.service_type = $scope.service_type;
                      data.vehicle_make = $scope.vec_data.vehicle_make;
                      data.vehicle_model = $scope.vec_data.vehicle_model;
                      data.vehicle_year = $scope.vec_data.vehicle_year;
                      data.vehicle_color = $scope.vec_data.vehicle_color;
                      data.vehicle_name = $scope.vec_data.vehicle_name;
                      data.request_date = $scope.dateTime.selectedDate;
                      data.request_time = $scope.dateTime.selectedTime;
                      data.user_id = store.get("userId");
                      data.users = $scope.users;
                      data.client_meta_data_id = result;
                      data.points = store.get("netprice");
                    }
                    else if(schedule == "Now"){
                      var data = {};
                      data.username = apiUsername;
                      data.pwd = apiPassword;
                      data.action = "request";
                      data.vehicle_type = $scope.washer_type;
                      data.service_type = $scope.service_type;
                      data.vehicle_make = $scope.vec_data.vehicle_make;
                      data.vehicle_model = $scope.vec_data.vehicle_model;
                      data.vehicle_year = $scope.vec_data.vehicle_year;
                      data.vehicle_color = $scope.vec_data.vehicle_color;
                      data.vehicle_name = $scope.vec_data.vehicle_name;
                      data.user_id = store.get("userId");
                      data.users = $scope.users;
                      data.client_meta_data_id = result;
                      data.points = store.get("netprice");
                    }

                    console.log("Request Data :"+JSON.stringify(data));

                    $.ajax({
                      type: 'POST',
                      url: apiUrl,
                      data: data,
                      contentType: "application/x-www-form-urlencoded",
                      crossDomain: true
                    }).then(function (data) {
                      console.log("Request Response :"+JSON.stringify(data));
                      $ionicLoading.hide();
                      $ionicLoading.show({
                        template: 'Request Sent successfully',
                        duration: 1000,
                        noBackdrop: true
                      });
                      if(data && data.response.schedule == true){
                        console.log("Inside schedule");
                        // $ionicLoading.show({
                        //   template: 'Request Scheduled successfully',
                        //   duration: 2000,
                        //   noBackdrop: true
                        // });
                        $cordovaDialogs.alert("Request Scheduled successfully!", "Ok");
                        $state.go("home");
                      }
                      else 
                      {
                        if (data && data.code == 200) {
                          $ionicLoading.show({
                            content: 'Loading',
                            animation: 'fade-in',
                            showBackdrop: true,
                            template: '<div><ion-spinner></ion-spinner><br>Waiting for washer to Accept Request from ' + $scope.users.length + ' washers</div><a class="button" ng-click="cancelRequest(' + data.success + ')" style="background: red;color: white;">Cancel</a>',
                            duration: 6000000,
                            scope: $scope
                          });
                          $rootScope.requestStatus = $interval(function () {
                            $scope.getReqeuestStatus(data.success);
                          }, 1000);
                        }
                      }
                    }, function (error) {
                      $ionicLoading.hide();
                      console.log("Request Error :"+JSON.stringify(error));
                    });
                  }
                  else {
                    $ionicLoading.hide();
                    $cordovaDialogs.alert("Please add a payment method!", "Add Payment Method", "Ok");
                    $state.go('add_points');
                  } 
                }, function (error) {
                  $ionicLoading.hide();
                });
              },
              function (error){
                console.log("PayPalMobile Error :"+JSON.stringify(error));
              });
            } 
            else {
              if ($scope.carddata.response == undefined && $scope.paypaldata.response == undefined) {
                $ionicLoading.show({
                  template: 'No payment method',
                  duration: 2000
                }).then(function () {
                  $state.go("add_points");
                });
              }
              else {
                $ionicLoading.show({
                  template: 'Sorry no washer nearby, please try again later',
                  duration: 2000
                });
              }
            }
          }
        }
      ]
    });
  };

  $scope.select_option = function(){
    var myPopup = $ionicPopup.show({
      title: 'Car Wash Request',
      subTitle: 'Please Select Schedule',
      scope: $scope,
      buttons: [
        {
          text: 'Now',
          type: 'button-positive',
          onTap: function(e){
            $scope.carList('Now');
          }
        },
        { 
          text: 'Later',
          onTap: function(){
            console.log("Test Later");
            $scope.schedule_wash();
          }
        },
        { text: '<i class="icon ion-close"></i>' }
      ]
    });
  }

  $scope.carList = function(sch){
    var schedule = sch;
    console.log("Schedule :"+schedule);
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = 'my_car_list';
    data.user_id = store.get('userId');

    console.log("Form Data :"+JSON.stringify(data));
    
    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function(data){
      $ionicLoading.hide();
      console.log("my_car_list Response :"+JSON.stringify(data));
      $scope.result = data.response;
    },function(error){
      $ionicLoading.hide();
      $cordovaDialogs.alert("No Records !", "", "Close");
      console.log("my_car_list error :"+JSON.stringify(error));    
    });

    $scope.data = {};
    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<select ng-model="data.optionSelected"><option value="">Select Saved Cars</option><option ng-repeat="rs in result" value="{{rs.id}}">{{rs.vehicle_name}}</option></select>',
      title: 'Select Vehicle Details',
      scope: $scope,
      buttons: [
        {
          text: 'Select',
          type: 'button-positive',
          onTap: function(e){
            if(Object.keys($scope.data).length > 0) {
              return $scope.data;
            }else{
              $cordovaDialogs.alert("Please Select Any Existing Vehicle !", "Close");
              e.preventDefault();
            }
          }
        },
        { 
          text: 'Add New',
          onTap: function(){
            $scope.storeClientDetails('',schedule);
          }
        },
        { text: '<i class="icon ion-close"></i>' }
      ]
    });

    myPopup.then(function(res){
      console.log('Tapped : '+JSON.stringify(res));
      $scope.storeClientDetails(res.optionSelected,schedule);
    });
  };

  // Triggered on a button click, or some other target
  $scope.storeClientDetails = function(res,sch){
    var schedule = sch;
    console.log("Option Id :"+res+" && schedule :"+schedule);
    if(res != undefined){
      var data = {};
      data.username = apiUsername;
      data.pwd = apiPassword;
      data.action = 'getcarinfo';
      data.car_id = res;

      console.log("Form Data :"+JSON.stringify(data));
      
      $.ajax({
        type: 'POST',
        url: apiUrl,
        data: data,
        contentType: "application/x-www-form-urlencoded",
        crossDomain: true
      }).then(function(data){
        $ionicLoading.hide();
        console.log("getcarinfo Response :"+JSON.stringify(data));
        $scope.data = {
          vehicle_make : data.response.vehicle_make,
          vehicle_model : data.response.vehicle_model,
          vehicle_year : data.response.vehicle_model_year,
          vehicle_color : data.response.vehicle_color,
          vehicle_name : data.response.vehicle_name
        };

      },function(error){
        $ionicLoading.hide();
        $cordovaDialogs.alert("No Records !", "", "Close");
        console.log("getcarinfo error :"+JSON.stringify(error));    
      });
    }
    else{
      $scope.data = {};
    }
    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<input type="text" placeholder="Vehicle Name" ng-model="data.vehicle_name" ng-require="true"><input type="text" placeholder="Vehicle Make" ng-model="data.vehicle_make" ng-require="true"><input type="text" placeholder="Vehicle Model" ng-model="data.vehicle_model" ng-require="true"><input type="text" placeholder="Vehicle Manufacture Yr" ng-model="data.vehicle_year" ng-require="true"><input type="text" placeholder="Vehicle Color" ng-model="data.vehicle_color" ng-require="true">',
      title: 'Enter Vehicle Details',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e){
            if(Object.keys($scope.data).length > 4) {
              return $scope.data;
            }else{
              $cordovaDialogs.alert("Please Enter Complete Vehicle Details !", "Close");
              e.preventDefault();
            }
          }
        }
      ]
    });

    myPopup.then(function(res){
      console.log('Tapped : '+JSON.stringify(res));
      $scope.vec_data = {
        vehicle_make : res.vehicle_make,
        vehicle_model : res.vehicle_model,
        vehicle_year : res.vehicle_year,
        vehicle_color : res.vehicle_color,
        vehicle_name : res.vehicle_name
      };
      $scope.validateClientRequest(schedule);
    });

  };

  $scope.openDatePicker = function(){
    var ipObj1 = {
      callback: function (val) {  //Mandatory
        var selectedDate = new Date(val);
        console.log('Return value from the datepicker popup is : '+ val);
        var month = selectedDate.getMonth()+1;
        $scope.DateSelected = selectedDate.getFullYear()+'-'+month+'-'+selectedDate.getDate();
        console.log("selectedDate :"+$scope.DateSelected);
      },
      inputDate: new Date(),      //Optional
      mondayFirst: true,          //Optional
      closeOnSelect: false,       //Optional
      templateType: 'popup'       //Optional
    };
    ionicDatePicker.openDatePicker(ipObj1);
  };

  $scope.openTimePicker = function(){
    var ipObj1 = {
      callback: function (val) {      //Mandatory
        if (typeof (val) === 'undefined') {
          console.log('Time not selected');
        } else {
          var selectedTime = new Date(val * 1000);
          console.log('Selected epoch is : '+val+' and the time is '+selectedTime.getUTCHours()+' hrs :'+selectedTime.getUTCMinutes()+' mins');
          $scope.TimeSelected = selectedTime.getUTCHours()+':'+selectedTime.getUTCMinutes()+':00';
          console.log("selectedTime :"+$scope.TimeSelected);
        }
      },
      inputTime: 50400,   //Optional
      format: 12,         //Optional
      step: 15,           //Optional
      setLabel: 'Set'    //Optional
    };
    ionicTimePicker.openTimePicker(ipObj1);
  };

  $scope.schedule_wash = function(info){
    var content = '<input type="text" name="date" placeholder="Date" ng-model="DateSelected" ng-click= "openDatePicker()"/>';
    content += '<input type="text" name="time" placeholder="time" ng-model="TimeSelected" ng-click="openTimePicker()"/>';

    var myPopup = $ionicPopup.show({
      template: content,
      title: 'Select Date & Time',
      scope: $scope,
      buttons: [
        {
          text: 'Submit',
          type: 'button-positive',
          onTap: function(e){
            if($scope.DateSelected != undefined || $scope.TimeSelected != undefined) {
              $scope.dateTime = {
                selectedDate : $scope.DateSelected,
                selectedTime : $scope.TimeSelected
              };
              return $scope.data; 
            }else{
              $cordovaDialogs.alert("Please Select Date & Time !", "Close");
              e.preventDefault();
            }
          }
        },
        { text: '<i class="icon ion-close"></i>' }
      ]
    });

    myPopup.then(function(res){
      console.log('Tapped : '+JSON.stringify(res));
      $scope.carList('later');
    }); 
  };

  $scope.getClientProfile = function (clientRequestForm, info) {
    var data = {};
    data.username = apiUsername;
    data.pwd = apiPassword;
    data.action = "getpriceofservice";
    data.vhicle_type = info.vehicle;
    data.customer_id = store.get("userId");
    data.service_type = info.service;

    $.ajax({
      type: 'POST',
      url: apiUrl,
      data: data,
      contentType: "application/x-www-form-urlencoded",
      crossDomain: true
    }).then(function (data) {
      store.set("is_promotion_available", data.response.is_promotion_available);
      store.set("service_price", data.response.service_price);
      store.set("netprice", data.response.netprice);
      store.set("offer", data.response.offer);
      store.set("is_cancellation_charge", data.response.is_cancellation_charge);
      console.log("Response Data getpriceofservice"+JSON.stringify(data));
      $scope.select_option();
    }, null);


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
      if (data && data.response) {
      }
    }, null);
  }

});
