
(function () {
    'use strict'

    angular.module('client.services')
        .factory('leadService', LeadServiceFactory)

    LeadServiceFactory.$inject = ['$http', '$q']

    function LeadServiceFactory($http, $q) {
        return {
            readAll: readAll,
            readById: readById,
            readByIdExt: readByIdExt,
            readByProviderId: readByProviderId,
            readActivities: readActivities,
            create: create,
            update: update,
            updateNotes: _updateNotes,
            updateStatus: _updateStatus,
            delete: _delete
        }

        function _updateNotes (id,newNote){
            return $http.put(`/api/leads/add-note/${id}`, newNote)
                .then(xhrSuccess)
                .catch(onError)
        }

        function _updateStatus (id, newStatus) {
            return $http.put(`/api/leads/change-status/${id}`, newStatus)
                .then(xhrSuccess)
                .catch(onError)
        }

        function readAll() {
            return $http.get(`/api/leads`)
                .then(xhrSuccess)
                .catch(onError)
        }    

        function readById(id) {
            return $http.get(`/api/leads/${id}`)
                .then(xhrSuccess) 
                .catch(onError)
        }

        function readByProviderId(id, count) {
            return $http.get(`/api/leads/get-by-provider-id/${id}/${count}`)
                .then(xhrSuccess)
                .catch(onError)
        }

        function readByIdExt(id) {
            return $http.get(`/api/leads/get-by-id-ext/${id}`)
                .then(xhrSuccess) 
                .catch(onError)
        }

        function readActivities(id) {
            return $http.get(`/api/activities/get-by-lead-id/${id}`)
                .then(xhrSuccess) 
                .catch(onError)
        }

        function create(leadData) {
            return $http.post('/api/leads', leadData)
                .then(xhrSuccess)
                .catch(onError)
        }

        function update(leadData) {
            return $http.put(`/api/leads/${leadData._id}`, leadData)
                .then(xhrSuccess)
                .catch(onError)
        }

        function _delete(id) {
            return $http.delete(`/api/leads/${id}`)
                .then(xhrSuccess)
                .catch(onError)
        }

        function xhrSuccess(response) {
            return response.data
        }

        function onError(error) {
            console.log(error.data)
            return $q.reject(error.data)
        }
    }
})()
