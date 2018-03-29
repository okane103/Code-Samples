/* global angular */
(function () {
    'use strict';

    angular.module('client.leads', ['ui.router', 'ui.mask', 'client.services'])

    angular.module('client.leads').config(RouteConfig);

    RouteConfig.$inject = ['$stateProvider'];

    function RouteConfig($stateProvider) {
        $stateProvider
            .state('site.leads', {
                url: '/leads',
                abstract: true
            })
            .state('site.leads.edit', {
                url: '/edit/{id:[0-9a-fA-F]{24}}',
                views: {
                    'content@site': {
                        templateUrl: 'client/leads/edit/lead-create-edit.html',
                        controller: 'leadEditController as leadCtrl'
                    }
                },
                ncyBreadcrumb: {
                    parent: 'site.leads.list',
                    label: 'Leads Create/Edit'
                },
                params: {
                    id: null
                }
            })
            .state('site.leads.list', {
                url: '/list',
                views: {
                    'content@site': {
                        templateUrl: 'client/leads/list/lead-list.html',
                        controller: 'leadListController as leadCtrl'
                    }
                },
                ncyBreadcrumb: {
                    label: 'Leads List'
                },
                resolve: {
                    leads: getAllLeads
                }
            });
    }
    getAllLeads.$inject = ['leadService']
    function getAllLeads(leadService) {
        return leadService.readAll()
            .then(data => data.items)
    } 
})();
