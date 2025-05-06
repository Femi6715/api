/**
 * Printful Resources Admin JavaScript
 */
(function($) {
    'use strict';

    $(document).ready(function() {
        // Dashboard page
        $('#sync-products').on('click', function() {
            syncProducts(false);
        });

        // Products page
        $('#sync-products-force').on('click', function() {
            syncProducts(true);
        });

        // Orders page
        $('.cancel-printful-order').on('click', function() {
            var orderId = $(this).data('order-id');
            var wcOrderId = $(this).data('wc-order-id');
            
            if (confirm(printfulResources.strings.confirm)) {
                cancelOrder(orderId, wcOrderId);
            }
        });

        // Add API connection testing
        $('#test-api-connection').on('click', function() {
            var $button = $(this);
            var $result = $('#api-test-result');
            
            $button.prop('disabled', true).text('Testing...');
            $result.html('<span style="color: blue;">Testing connection...</span>');
            
            $.ajax({
                url: printfulResources.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'printful_resources_test_connection',
                    nonce: printfulResources.nonce,
                    scope: 'products',
                    api_key: '', // Use the saved API key
                    test_type: 'products_api'
                },
                success: function(response) {
                    if (response.success) {
                        $result.html('<span style="color: green;">✓ Connection successful!</span>');
                        
                        // Show additional response data if available
                        if (response.data && response.data.message) {
                            $result.append('<div style="margin-top: 5px;">' + response.data.message + '</div>');
                        }
                    } else {
                        var errorMsg = response.data && response.data.message 
                            ? response.data.message 
                            : 'Connection failed';
                        $result.html('<span style="color: red;">✗ ' + errorMsg + '</span>');
                    }
                },
                error: function(xhr, status, error) {
                    $result.html('<span style="color: red;">✗ Connection failed: ' + status + ' - ' + error + '</span>');
                    
                    // Show response text if available
                    if (xhr.responseText) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            if (response.message) {
                                $result.append('<div style="margin-top: 5px; color: red;">' + response.message + '</div>');
                            }
                        } catch (e) {
                            // If parsing fails, show the raw response
                            if (xhr.responseText.length > 300) {
                                $result.append('<div style="margin-top: 5px; color: red;">Response too large to display</div>');
                            } else {
                                $result.append('<div style="margin-top: 5px; color: red;">' + xhr.responseText + '</div>');
                            }
                        }
                    }
                },
                complete: function() {
                    $button.prop('disabled', false).text('Test Products API Connection');
                }
            });
        });
    });

    /**
     * Sync products
     * 
     * @param {boolean} force Force update all products.
     */
    function syncProducts(force) {
        var $button = force ? $('#sync-products-force') : $('#sync-products');
        var $status = $('#sync-status');
        var originalText = $button.text();
        
        $button.prop('disabled', true);
        $status.text(printfulResources.strings.syncStarted);
        
        $.ajax({
            url: printfulResources.ajaxUrl,
            type: 'POST',
            data: {
                action: 'printful_resources_sync_products',
                nonce: printfulResources.nonce,
                force: force
            },
            success: function(response) {
                $button.prop('disabled', false);
                
                if (response.success) {
                    $status.text(printfulResources.strings.syncCompleted);
                    displaySyncResults(response.data.result);
                } else {
                    $status.text(printfulResources.strings.syncFailed + response.data.message);
                    displaySyncResults(response.data.result);
                }
                
                // Reload page after 3 seconds
                setTimeout(function() {
                    location.reload();
                }, 3000);
            },
            error: function(xhr, status, error) {
                $button.prop('disabled', false);
                $status.text(printfulResources.strings.syncFailed + ' ' + status + ': ' + error);
                
                console.error('Sync error:', { xhr: xhr, status: status, error: error });
                
                // Try to display any error information
                var errorHtml = '<ul>';
                errorHtml += '<li><strong>Status:</strong> ' + status + '</li>';
                errorHtml += '<li><strong>Error:</strong> ' + error + '</li>';
                
                if (xhr.responseText) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.data && response.data.message) {
                            errorHtml += '<li><strong>Message:</strong> ' + response.data.message + '</li>';
                        }
                        
                        if (response.data && response.data.result && response.data.result.errors) {
                            errorHtml += '<li><strong>Detailed Errors:</strong> <ul>';
                            for (var i = 0; i < response.data.result.errors.length; i++) {
                                errorHtml += '<li>' + response.data.result.errors[i] + '</li>';
                            }
                            errorHtml += '</ul></li>';
                        }
                    } catch (e) {
                        // If not JSON, just show a preview
                        var preview = xhr.responseText.substr(0, 200) + (xhr.responseText.length > 200 ? '...' : '');
                        errorHtml += '<li><strong>Response:</strong> <pre>' + preview + '</pre></li>';
                    }
                }
                
                errorHtml += '</ul>';
                
                // Show error information
                displaySyncResults({
                    created: 0,
                    updated: 0,
                    skipped: 0,
                    deleted: 0,
                    errors: [error],
                    debug_info: ['AJAX Error: ' + status, 'See details below', xhr.responseText ? 'Response received' : 'No response text']
                });
            }
        });
    }

    /**
     * Display sync results
     * 
     * @param {object} results Sync results.
     */
    function displaySyncResults(results) {
        var $resultsContainer = $('.printful-sync-results');
        var $resultsContent = $('#sync-results-content');
        
        if (!results) {
            $resultsContent.html('<p>No results data returned from server. Check browser console and server logs for errors.</p>');
            $resultsContainer.show();
            return;
        }
        
        try {
            var html = '<ul>';
            
            html += '<li><strong>Created:</strong> ' + (results.created || 0) + '</li>';
            html += '<li><strong>Updated:</strong> ' + (results.updated || 0) + '</li>';
            html += '<li><strong>Skipped:</strong> ' + (results.skipped || 0) + '</li>';
            html += '<li><strong>Deleted:</strong> ' + (results.deleted || 0) + '</li>';
            
            if (results.errors && results.errors.length > 0) {
                html += '<li><strong>Errors:</strong> <ul class="error-list">';
                
                for (var i = 0; i < results.errors.length; i++) {
                    var errorText = results.errors[i] || 'Unknown error';
                    // Use text() to safely escape HTML
                    var safeError = $('<div/>').text(errorText).html();
                    html += '<li>' + safeError + '</li>';
                }
                
                html += '</ul></li>';
            }
            
            // Add detailed debug information if available
            if (results.debug_info && results.debug_info.length > 0) {
                html += '<li><strong>Debug Information:</strong> <div class="debug-info" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-top: 10px; background-color: #f9f9f9; font-family: monospace;">';
                
                for (var i = 0; i < results.debug_info.length; i++) {
                    var debugText = results.debug_info[i] || '';
                    // Use text() to safely escape HTML
                    var safeDebug = $('<div/>').text(debugText).html();
                    html += '<div>' + safeDebug + '</div>';
                }
                
                html += '</div></li>';
            }
            
            html += '</ul>';
            
            $resultsContent.html(html);
            $resultsContainer.show();
        } catch(e) {
            console.error('Error displaying sync results:', e);
            $resultsContent.html('<p>Error processing results: ' + e.message + '</p>');
            
            // Try to display raw results for debugging
            if (typeof results === 'object') {
                $resultsContent.append('<pre>' + JSON.stringify(results, null, 2) + '</pre>');
            } else {
                $resultsContent.append('<pre>' + (results || 'No data') + '</pre>');
            }
            
            $resultsContainer.show();
        }
    }

    /**
     * Cancel Printful order
     * 
     * @param {int} orderId Printful order ID.
     * @param {int} wcOrderId WooCommerce order ID.
     */
    function cancelOrder(orderId, wcOrderId) {
        $.ajax({
            url: printfulResources.ajaxUrl,
            type: 'POST',
            data: {
                action: 'printful_resources_cancel_order',
                nonce: printfulResources.nonce,
                order_id: wcOrderId || orderId
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data.message);
                    location.reload();
                } else {
                    alert(response.data.message);
                }
            },
            error: function() {
                alert('Error cancelling order. Please try again.');
            }
        });
    }

})(jQuery); 