(function(){
  'use strict';

  angular.module('prop')
  .factory('User', ['$http', function($http){

    function sendMail(email){
      return $http.post('/sendMail', email);
    }

    function register(user){
      return $http.post('/register', user);
    }

    function login(user){
      return $http.post('/login', user);
    }

    function logout(){
      return $http.delete('/logout');
    }

    return {register:register, login:login, logout:logout, sendMail:sendMail};
  }]);
})();

