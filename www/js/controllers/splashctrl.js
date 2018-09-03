app.controller('splashctrl', function ($scope, $ionicLoading, $timeout, $state) {
  $ionicLoading.show({
    content: 'Loading',
    animation: 'fade-in',
    showBackdrop: true,
    maxWidth: 200,
    showDelay: 0,
    duration: 2000
  });
  $timeout(function () {
    $state.go('/')
  }, 2000);
});
	
