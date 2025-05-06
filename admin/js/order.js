/**
 * Printful Resources Order JavaScript
 */
(function($) {
    'use strict';

    $(document).ready(function() {
        // Send order to Printful
        $('#send-to-printful').on('click', function() {
            var orderId = $(this).data('order-id');
            sendToPrintful(orderId);
        });
        
        // Cancel Printful order
        $('#cancel-printful-order').on('click', function() {
            var orderId = $(this).data('order-id');
            
            if (confirm('Are you sure you want to cancel this Printful order?')) {
                cancelPrintfulOrder(orderId);
            }
        });
        
        // Refresh Printful status
        $('#refresh-printful-status').on('click', function() {
            var orderId = $(this).data('order-id');
            refreshPrintfulStatus(orderId);
        });
    });

    /**
     * Send order to Printful
     * 
     * @param {int} orderId WooCommerce order ID.
     */
    function sendToPrintful(orderId) {
        var $button = $('#send-to-printful');
        var originalText = $button.text();
        
        $button.prop('disabled', true).text('Sending...');
        
        $.ajax({
            url: printfulResources.ajaxUrl,
            type: 'POST',
            data: {
                action: 'printful_resources_sync_order',
                nonce: printfulResources.nonce,
                order_id: orderId
            },
            success: function(response) {
                $button.prop('disabled', false).text(originalText);
                
                if (response.success) {
                    alert('Order sent to Printful successfully.');
                    location.reload();
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function() {
                $button.prop('disabled', false).text(originalText);
                alert('Error sending order to Printful. Please try again.');
            }
        });
    }

    /**
     * Cancel Printful order
     * 
     * @param {int} orderId WooCommerce order ID.
     */
    function cancelPrintfulOrder(orderId) {
        var $button = $('#cancel-printful-order');
        var originalText = $button.text();
        
        $button.prop('disabled', true).text('Cancelling...');
        
        $.ajax({
            url: printfulResources.ajaxUrl,
            type: 'POST',
            data: {
                action: 'printful_resources_cancel_order',
                nonce: printfulResources.nonce,
                order_id: orderId
            },
            success: function(response) {
                $button.prop('disabled', false).text(originalText);
                
                if (response.success) {
                    alert('Printful order cancelled successfully.');
                    location.reload();
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function() {
                $button.prop('disabled', false).text(originalText);
                alert('Error cancelling Printful order. Please try again.');
            }
        });
    }

    /**
     * Refresh Printful status
     * 
     * @param {int} orderId WooCommerce order ID.
     */
    function refreshPrintfulStatus(orderId) {
        var $button = $('#refresh-printful-status');
        var originalText = $button.text();
        
        $button.prop('disabled', true).text('Refreshing...');
        
        $.ajax({
            url: printfulResources.ajaxUrl,
            type: 'POST',
            data: {
                action: 'printful_resources_refresh_order_status',
                nonce: printfulResources.nonce,
                order_id: orderId
            },
            success: function(response) {
                $button.prop('disabled', false).text(originalText);
                
                if (response.success) {
                    alert('Status refreshed successfully.');
                    location.reload();
                } else {
                    alert('Error: ' + response.data.message);
                }
            },
            error: function() {
                $button.prop('disabled', false).text(originalText);
                alert('Error refreshing status. Please try again.');
            }
        });
    }

})(jQuery); 