angular.module("openattic").config(["toastyConfigProvider", function(toastyConfigProvider) {
  toastyConfigProvider.setConfig({
    sound:        false,
    shake:        false,
    limit:        5,
    position:     "top-center",
    showClose:    true,
    clickToClose: true,
    timeout:      4000,
    sound:        false,
    html:         true,
    theme:        "bootstrap"
  });
}]);