/* global angular */

(function () {
    'use strict'
    
    angular.module('client.leads')
        .controller('leadEditController', LeadEditController)

    LeadEditController.$inject = [
        'leadService',
        'userService',
        'providerServiceService',
        'providerService',
        '$stateParams',
        '$state',
        '$log',
        '$uibModal',
        'reactComponentsService'
    ]

    function LeadEditController(
        leadService,
        userService,
        providerServiceService,
        providerService,
        $stateParams,
        $state,
        $log,
        $uibModal,
        reactComponentsService

    ) {
        var vm = this

        vm.lead = null
        vm.edit = null
        vm.createOrEdit = null
        vm.statusList = null
        vm.noteFormInput = null
        vm.leadStatus = null
        vm.typeList = null
        vm.userData = null
        vm.providerData = null
        vm.userRole = null
        vm.isVisible = false
        vm.leadHistory = null
        vm.submittedBy = null
        vm.save = _save
        vm.addUpdate = _addUpdate
        vm.getCurrentModeTxt = _getCurrentModeTxt
        vm.getStatusColor = _getStatusColor
        vm.hasValidationError = _hasValidationError
        vm.showValidationError = _showValidationError
        vm.allowSubmit = _allowSubmit
        vm.showNotesTextArea = _showNotesTextArea
        vm.checkUserRole = _checkUserRole
        vm.currentDropdownId = _currenDropdownId
        vm.currentServiceId = _currentServiceId

        vm.leadEditProps = {
            component: reactComponentsService.UserResume,
            leadData: vm.lead
        }

        init()

        function init() {
            vm.userRole = userService.getUserRole($stateParams.id)
            vm.statusList = [
                'Submitted',
                'In Progress',
                'Accepted',
                'Declined',
                'Closed',
                'Paid'
            ]
            vm.typeList = [
                'Insurance',
                'Accounting',
                'Payroll',
                'Staffing',
                'IT Solutions',
                'Employee Benefits'
            ]
            vm.lead = {
                contact: {},
                providerId: null,
                serviceId: null,
                status: vm.statusList[0], //default to first option
                type: vm.typeList[0],
                notes: [],
                description: null
            }
            vm.leadHistory = []

            if ($stateParams.id) {
                vm.edit = true
                readById()
            } else {
                vm.edit = null
            }
        }

        function readById() {
            leadService.readByIdExt($stateParams.id)
                .then(onReadByIdSuccess)
                .catch(onError)
        }

        function readActivities() {
            leadService.readActivities($stateParams.id)
                .then(onReadActivitiesSuccess)
                .catch(onError)
        }

        function _currenDropdownId(id) {
            vm.lead.providerId = id
        }

        function _currentServiceId(id) {
            vm.lead.serviceId = id
        }

        function _save() {
            if ($stateParams.id) {
                delete vm.lead.leadIdDataExt
                delete vm.lead.providerData
                delete vm.lead.userData
                leadService.update(vm.lead)
                    .then(onSubmitSuccess)
                    .catch(onError)
            } else {
                leadService.create(vm.lead)
                    .then(onSubmitSuccess)
                    .catch(onError)
            }
        }

        function _addUpdate() {
            let newNote = {
                note: vm.noteFormInput,
                date: new Date()
            }
            if ($stateParams.id) {
                leadService.updateNotes($stateParams.id, newNote)
            }
            vm.lead.notes.push(newNote)
            vm.noteFormInput = null
            vm.noteForm['notes'].$pristine = true

            buildLeadHistory()
        }

        function buildLeadHistory() {
            vm.leadHistory = []
            if (vm.lead.notes) {
                if (vm.lead.notes.length) {
                    vm.lead.notes.forEach(note => {
                        let historyItem = {
                            title: 'Note Added',
                            content: note.note,
                            date: new Date(note.date)
                        }
                        vm.leadHistory.push(historyItem)
                    })
                }
            }
            if (vm.leadActivity.length) {
                vm.leadActivity.forEach(activity => {
                    let historyItem = {
                        title: activity.activityType,
                        content: activity.metadata[2].leadStatus,
                        date: new Date(activity.createDate)
                    }
                    vm.leadHistory.push(historyItem)
                })
            }
        }

        function _getCurrentModeTxt(isBtn) { //get string for save button or title
            return isBtn || vm.edit ? !isBtn ? 'Edit' : vm.edit ? 'Save' : 'Submit' : 'New'
        }

        function _getStatusColor() {
            switch (vm.lead.status) {
                case 'Submitted':
                    return null
                    break
                case 'Declined':
                    return 'text-warning'
                    break
                case 'Closed':
                    return 'text-danger'
                    break
                default:
                    return 'text-success'
                    break
            }
        }

        function _allowSubmit() {
            return vm.editForm.$invalid
        }

        function _showNotesTextArea() {
            vm.isVisible = vm.isVisible ? false : true
        }

        function _checkUserRole() {
            if (vm.userRole === "User" && $stateParams.id) {
                return true
            }
        }

        function onSubmitSuccess() {
            $state.go('site.leads.list')
        }

        function onReadByIdSuccess(data) {
            vm.lead = data.item

            vm.leadEditProps = {
                component: reactComponentsService.UserResume,
                leadData: vm.lead
            }
            if (vm.userRole == 'User') {
                vm.submittedBy = vm.lead.providerData
                vm.submittedBy.title = 'Submitted For'
            } else {
                vm.submittedBy = vm.lead.userData
                vm.submittedBy.title = 'Submitted By'
            }
            readActivities()
        }

        function onReadActivitiesSuccess(data) {
            vm.leadActivity = data.items
            buildLeadHistory()
        }

        function onError(data) {
            console.log(data)
            $log.log(`Error: ${data.errors}`)
        }

        function _hasValidationError(property) {
            return (vm.editForm.$submitted || vm.editForm[property].$dirty) && vm.editForm[property].$invalid
        }

        function _showValidationError(property, rule) {
            return (vm.editForm.$submitted || vm.editForm[property].$dirty) && vm.editForm[property].$error[rule]
        }
    }
})()