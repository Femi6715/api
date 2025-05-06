(function($) {
    'use strict';

    $(document).ready(function() {
        // Define fallbacks for WordPress variables in case they're not properly localized
        var ajaxUrl = (typeof ajaxurl !== 'undefined') ? ajaxurl : '/wp-admin/admin-ajax.php';
        var nonceValue = (typeof printful_settings !== 'undefined' && printful_settings.nonce) 
            ? printful_settings.nonce 
            : (typeof printfulResources !== 'undefined' && printfulResources.nonce) 
                ? printfulResources.nonce 
                : '';

        // Handle tab switching
        $('.nav-tab').on('click', function(e) {
            e.preventDefault();
            
            // Update active tab
            $('.nav-tab').removeClass('nav-tab-active');
            $(this).addClass('nav-tab-active');
            
            // Show the selected tab content
            const tabId = $(this).attr('href');
            $('.tab-content').hide();
            $(tabId).show();
        });

        // Test API connection for each scope
        $('.test-connection-btn').on('click', function() {
            const scope = $(this).data('scope');
            const apiKey = $('#printful_resources_api_key_' + scope).val();
            const statusElement = $('#connection-status-' + scope);
            
            if (!apiKey) {
                statusElement.html('<span style="color: red;">Please enter an OAuth 2.0 token</span>');
                return;
            }
            
            $(this).prop('disabled', true).text('Testing...');
            statusElement.html('<span style="color: blue;">Testing connection...</span>');
            
            $.ajax({
                url: ajaxUrl,
                type: 'POST',
                data: {
                    action: 'printful_resources_test_connection',
                    api_key: apiKey,
                    scope: scope,
                    nonce: nonceValue
                },
                success: function(response) {
                    if (response.success) {
                        statusElement.html('<span style="color: green;">✓ Connected successfully!</span>');
                        
                        // Display store information if available
                        if (scope === 'stores' && response.data && response.data.store) {
                            const store = response.data.store;
                            let storeInfo = '<p><strong>Store Name:</strong> ' + store.name + '</p>';
                            storeInfo += '<p><strong>Store ID:</strong> ' + store.id + '</p>';
                            storeInfo += '<p><strong>Type:</strong> ' + store.type + '</p>';
                            
                            $('#store-information').html(storeInfo).show();
                            
                            // If store ID not set, use from response
                            if (!$('#printful_resources_store_id').val()) {
                                $('#printful_resources_store_id').val(store.id);
                            }
                        }
                    } else {
                        const errorMsg = response.data && response.data.message 
                            ? response.data.message 
                            : 'Connection failed';
                        statusElement.html('<span style="color: red;">✗ ' + errorMsg + '</span>');
                    }
                },
                error: function() {
                    statusElement.html('<span style="color: red;">✗ Connection test failed. Please try again.</span>');
                },
                complete: function() {
                    $('.test-connection-btn[data-scope="' + scope + '"]').prop('disabled', false)
                        .text('Test ' + scope.charAt(0).toUpperCase() + scope.slice(1) + ' Connection');
                }
            });
        });

        // Initialize - show the first tab by default
        $('.nav-tab:first').click();
    });

})(jQuery); 