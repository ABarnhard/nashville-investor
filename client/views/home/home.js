/* jshint unused:false, camelcase:false */
/* global google, Chart, _ */

(function(){
  'use strict';

  angular.module('prop')
  .controller('HomeCtrl', ['User', '$scope', '$timeout', 'Home', 'Permit', 'DevApp', 'Value', function(User, $scope, $timeout, Home, Permit, DevApp, Value){
    $scope.title = 'Nashville Investor';

    $scope.tab = 1;
    $scope.markers = {};
    $scope.markers.main = [];
    $scope.markers.permits = [];
    $scope.markers.apps = [];
    $scope.history = [];
    $scope.hideReset = true;

    // messaging //
    $scope.email = {};

    $scope.sendMail = function(){
      User.sendMail($scope.email).then(function(response){
        toastr.success('Message Sent!');
        $scope.email = {};
      });
    };

    //---- End Messaging ----//

    $scope.$on('LOAD', function(){$scope.isLoading=true;});
    $scope.$on('UNLOAD', function(){$scope.isLoading=false;});

    angular.element(document).ready(function(){
      $scope.map = cartographer('cityMap', 36.1667, -86.7833, 8);
    });

    $scope.loc = {};

    $scope.geocodeAndSearch = function(){
      var address = $scope.loc.street + ', ' + $scope.loc.city + ', ' + $scope.loc.state + ' ' + $scope.loc.zip;
      geocode(address, function(name, lat, lng){
        $scope.loc.name = name;
        $scope.loc.lat = lat;
        $scope.loc.lng = lng;
        $scope.map.panTo(new google.maps.LatLng(lat, lng));
        $scope.map.setZoom(12);
        $scope.markers.main.push(addMarker($scope.map, lat, lng, name, '/assets/images/markers/main-icon.png'));
        $scope.addHistory();
        $scope.getMedian();
      });
    };

    $scope.newSearch = function(){
      $scope.map.panTo(new google.maps.LatLng(36.1667, -86.7833));
      $scope.map.setZoom(8);
      $scope.hideReset = true;
      $scope.loc = {city:'Nashville', state:'TN'};
      $scope.homeValue = null;
      Object.keys($scope.markers).forEach(function(key){
        clearMarkers($scope.markers[key]);
        $scope.markers[key] = [];
      });
      $scope.permits = $scope.devApps = null;
    };

    $scope.searchPermits = function(){
      $scope.$emit('LOAD');
      Permit.getPermits($scope.loc.lat, $scope.loc.lng).then(function(res){
        clearMarkers($scope.markers.apps);
        res.data.markers.forEach(function(m){
          $scope.markers.permits.push(addMarkerNoAnimation($scope.map, m.lat, m.lng, m.name, m.icon));
        });
        var ctx = document.getElementById('permit-chart').getContext('2d');
        $scope.permitChart = new Chart(ctx).Pie(res.data.chartData, {});
        $scope.permits = res.data;
        $scope.$emit('UNLOAD');
      });
    };

    $scope.searchApps = function(){
      $scope.$emit('LOAD');
      DevApp.getApps($scope.loc.lat, $scope.loc.lng).then(function(res){
        clearMarkers($scope.markers.permits);
        res.data.markers.forEach(function(m){
          $scope.markers.apps.push(addMarkerNoAnimation($scope.map, m.lat, m.lng, m.name, m.icon));
        });
        $scope.appRows = res.data.tableRows;
        $scope.devApps = res.data;
        $scope.$emit('UNLOAD');
      });
    };

    //Zestimate and Demographic Median Sale Price/Bar Graph
    //Size of canvas handled in createBar()
    $scope.getMedian = function(){
      $scope.$emit('LOAD');
      Value.getData($scope.loc.street, $scope.loc.city, $scope.loc.state, $scope.loc.zip).then(function(response){
        $scope.homeValue = response.data.zestimate;
        createBar(response.data.zestimate, response.data.demoCity, response.data.demoNation);
        $scope.hideReset = false;
        $scope.$emit('UNLOAD');
      });
    };

    $scope.selectTab = function(setTab){
      $scope.tab = setTab;
      switch(setTab){
        case 1:
          clearMarkers($scope.markers.apps || []);
          clearMarkers($scope.markers.permits || []);
          break;
        case 2:
          clearMarkers($scope.markers.apps || []);
          if(!$scope.permits){
            $scope.searchPermits();
          }else{
            showMarkers($scope.markers.permits, $scope.map);
          }
          break;
        case 3:
          clearMarkers($scope.markers.permits || []);
          if(!$scope.devApps){
            $scope.searchApps();
          }else{
            showMarkers($scope.markers.apps, $scope.map);
          }
          break;
      }
    };

    $scope.isSelected = function(checkTab){
      return $scope.tab === checkTab;
    };

    $scope.addHistory = function(){
      var loc = new Search($scope.loc);
      //Do we want to prevent duplicate addresses and also store search type?
      $scope.history.push(loc);
      $scope.history = _.uniq($scope.history, function(item, key, s){
        return item.street;
      });
    };

  }]);

  function geocode(address, cb){
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({address:address}, function(results, status){
      //console.log('results', results);
      var name = results[0].formatted_address,
          lat  = results[0].geometry.location.lat(),
          lng  = results[0].geometry.location.lng();
      cb(name, lat, lng);
    });
  }

  function cartographer(cssId, lat, lng, zoom){
    var mapOptions = {center: new google.maps.LatLng(lat, lng), zoom: zoom, mapTypeId: google.maps.MapTypeId.ROADMAP},
        map = new google.maps.Map(document.getElementById(cssId), mapOptions);
    return map;
  }

  function addMarker(map, lat, lng, name, icon){
    var latLng = new google.maps.LatLng(lat, lng);
    return new google.maps.Marker({map: map, position: latLng, title: name, animation: google.maps.Animation.DROP, icon: icon});
  }

  function addMarkerNoAnimation(map, lat, lng, name, icon){
    var latLng = new google.maps.LatLng(lat, lng);
    return new google.maps.Marker({map: map, position: latLng, title: name, icon: icon});
  }

  function createBar(zest, demoCity, demoNation){
    var data = {
      labels: ['Home', 'City', 'Nation'],
      datasets: [
        {
          fillColor: 'rgba(69,220,20,0.5)',
          strokeColor: 'rgba(69,220,20,0.8)',
          highlightFill: 'rgba(69,200,20,1)',
          highlightStroke: 'rgba(69,200,20,1)',
          data: [zest, demoCity, demoNation]
        }
      ]
    },
    ctx = document.getElementById('value').getContext('2d');
    ctx.canvas.width = 1000;
    ctx.canvas.height = 400;
    new Chart(ctx).Bar(data);
  }

  // Sets the map on all markers in the array.
  function setAllMap(markers, map){
    for (var i = 0; i < markers.length; i++){
      markers[i].setMap(map);
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  function clearMarkers(markers){
    setAllMap(markers, null);
  }

  // Shows any markers currently in the array.
  function showMarkers(markers, map){
    setAllMap(markers, map);
  }

  // Deletes all markers in the array by removing references to them.
  function deleteMarkers(markers){
    clearMarkers(markers);
    markers = [];
  }

  //Search object for search history
  function Search(o){
    this.street   = o.street;
    this.zip      = o.zip;
    this.state    = o.state;
    this.city     = o.city;
    this.name     = o.name;
    this.lat      = o.lat;
    this.lng      = o.lng;
  }

})();
