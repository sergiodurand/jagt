angular.module('starter.controllers', [])

.controller('MapCtrl', function($scope) {

  ionic.Platform.ready(function() {

    $scope.$on('$ionicView.leave', function(){
      console.log("Leaving the Map");
      cordova.plugins.CordovaMqTTPlugin.disconnect({
        success:function(s){
          console.log("Successful disconnect().");},
        error:function(e){
          console.log("An error has occurred during disconnect()." + e);}
      });
    });

    $scope.$on('$ionicView.enter', function(){
      console.log("Entering the Map");
      cordova.plugins.CordovaMqTTPlugin.connect({
        //url:"tcp://broker.mqttdashboard.com",
        url:"tcp://test.mosquitto.org",
        port:1883,
        //clientId:"A7DHDJDKDKD8383HD",
        connectionTimeout:3000,
        //willTopicConfig:{qos:2, retain:true, topic:"jagt/anytopic", payload:"any payload"},
        //username:"uname",
        //password:'pass',
        keepAlive:60,
        success:function(s){
          console.log("MQTT successfully connected.");
          cordova.plugins.CordovaMqTTPlugin.subscribe({topic:"jagt/#", qos:1,
            success:function(s){
              console.log("MQTT successfully subscribed to 'jagt/#' topic.");
              var latLngI = new google.maps.LatLng(-22.9, -47.1);
              var mapOptions = {center: latLngI, zoom: 14, mapTypeId: google.maps.MapTypeId.ROADMAP};
              var markers = []
              $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
              google.maps.event.addListenerOnce($scope.map, 'idle', function(){   // Wait map to load
                cordova.plugins.CordovaMqTTPlugin.listen("jagt/#",function(payload,params,topic,topic_pattern){
                  if (markers.length > 0) {
                    var x = markers.shift();
                    x.setMap(null);
                  }
                  var pos = JSON.parse(payload) // expected payload string format: {"lat": -28, "lng": 137}
                  console.log("Received a new position: Lat: " + pos.lat + " Long: " + pos.lng);
                  var latLng = new google.maps.LatLng(pos.lat, pos.lng);
                  var marker = new google.maps.Marker({
                    map: $scope.map,
                    //animation: google.maps.Animation.DROP,
                    position: latLng
                  });
                  markers.push(marker);
                  //var infoWindow = new google.maps.InfoWindow({
                  //    content: "Here I am!"
                  //});
                  //google.maps.event.addListener(marker, 'click', function(){
                  //      infoWindow.open($scope.map, marker);
                  //});
                  $scope.map.setCenter(latLng);
                });
              });
            },
            error:function(e){
                    console.log("An error has occurred during subscribe()." + e);
            }
          });
        },
        error:function(e){
                console.log("An error has occurred during connect()." + e);
        },
        onConnectionLost:function (){
                console.log("The connection with broker was lost.");
        },
      });
    });

  });
})

.controller('TrackerCtrl', function($scope) { //}, $cordovaGeolocation) {

  ionic.Platform.ready(function() {

    var watchID;
    var geolocation_options = {timeout: 60000, maximumAge: 10000, enableHighAccuracy: true};
    var date_format = {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short'};

    $scope.$on('$ionicView.leave', function() {
      console.log("Leaving the Tracker");
      navigator.geolocation.clearWatch(watchID);
      cordova.plugins.CordovaMqTTPlugin.disconnect({
        success:function(s){
          console.log("Successful disconnect().");},
        error:function(e){
          console.log("An error has occurred during disconnect()." + e);}
      });
    });

    $scope.$on('$ionicView.enter', function() {
      console.log("Entering the Tracker");
      document.getElementById("lat").innerHTML = "waiting for GPS signal...";
      document.getElementById("lng").innerHTML = "waiting for GPS signal...";
      document.getElementById("timestamp").innerHTML = "waiting for GPS signal...";
      function onError(error) {
        console.log("Error with GeoLocation:" + error);
      };
      function onSuccess(position) {
        console.log("New location:" + position.coords.latitude + position.coords.longitude);
        document.getElementById("lat").innerHTML = position.coords.latitude;
        document.getElementById("lng").innerHTML = position.coords.longitude;
        document.getElementById("timestamp").innerHTML = new Date(position.timestamp).toLocaleDateString("en-US", date_format);
        cordova.plugins.CordovaMqTTPlugin.publish({
          topic:"jagt/u1",
          payload:JSON.stringify({"lat": position.coords.latitude, "lng": position.coords.longitude, "timestamp": position.timestamp}),
          qos:1,
          retain:true,
          success:function(s){
           console.log("MQTT published.");
          },
          error:function(e){
           console.log("MQTT error to publish.");
          }
        });
      };
      cordova.plugins.CordovaMqTTPlugin.connect({
        //url:"tcp://broker.mqttdashboard.com",
        url:"tcp://test.mosquitto.org",
        port:1883,
        //clientId:"A7DHDJDKDKD8383HD",
        connectionTimeout:3000,
        //willTopicConfig:{qos:2, retain:true, topic:"jagt/anytopic", payload:"any payload"},
        //username:"uname",
        //password:'pass',
        keepAlive:60,
        success:function(s){
          console.log("MQTT successfully connected.");
          watchID = navigator.geolocation.watchPosition(onSuccess, onError, geolocation_options);
        },
        error:function(e){
          console.log("An error has occurred during connect()." + e);
        }
      });
    });
  });
})


.controller('SettingsCtrl', function($scope, $state) {
  console.log("hello");
  $scope.default = "Test!"

  function getFormData(formSettings) {
    console.log(formSettings);
  }

})
