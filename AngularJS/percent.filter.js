/* Filter to display numbers as percents rounded to two decimal points*/
(function () {
    'use strict';

    angular.module('client.filters', [])
        .filter('percent', PercentFilter)

    function PercentFilter() {
        return input => parseFloat(input) 
            ? `${(parseFloat(input).toFixed(2))}%`
            : 'Invalid Number'
    }
})();
