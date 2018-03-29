(function () {
    'use strict'
    
    angular.module('client.components').component('leadsDropdown', {
        templateUrl: 'client/components/leads-dropdown/leads-dropdown.component.html',
        bindings: {
            onSelect: '&'
        },
        controller: LeadsDropdownController
    })

    LeadsDropdownController.$inject = ['leadService']

    function LeadsDropdownController(leadService) {
        var $ctrl = this
        $ctrl.leads = null
        $ctrl.selectedLeadId = null

        $ctrl.$onInit = function() {
            readAll()
        }

        function readAll() {
            leadService.readAll()
                .then(onReadAllSuccess)
                .catch(onError)
        }

        function onReadAllSuccess(data) {
            $ctrl.leads = data.items
        }

        function onError(data) {
            console.log(data)
        }
    }
})()