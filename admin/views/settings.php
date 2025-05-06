<?php
/**
 * Printful Settings Page
 */
if (!defined('WPINC')) {
    die;
}
?>
<div class="wrap">
    <h1><?php echo esc_html__('Printful Settings', 'printful-resources'); ?></h1>

    <div class="printful-settings">
        <h2 class="nav-tab-wrapper">
            <a href="#general" class="nav-tab nav-tab-active"><?php echo esc_html__('General', 'printful-resources'); ?></a>
            <a href="#products" class="nav-tab"><?php echo esc_html__('Products', 'printful-resources'); ?></a>
            <a href="#orders" class="nav-tab"><?php echo esc_html__('Orders', 'printful-resources'); ?></a>
            <a href="#shipping" class="nav-tab"><?php echo esc_html__('Shipping', 'printful-resources'); ?></a>
        </h2>

        <div class="printful-settings-tabs">
            <!-- General Settings -->
            <div id="general" class="tab-content active">
                <form method="post" action="options.php">
                    <?php settings_fields('printful_resources_general'); ?>
                    
                    <div class="notice notice-warning inline">
                        <p>
                            <strong><?php echo esc_html__('Important:'); ?></strong> 
                            <?php echo esc_html__('Printful now requires OAuth 2.0 tokens with specific scopes for API access. Basic API tokens are no longer supported.', 'printful-resources'); ?>
                        </p>
                    </div>
                    
                    <h3><?php _e('API Settings', 'printful-resources'); ?></h3>
                    <p class="description">
                        <?php _e('You need to create separate OAuth 2.0 tokens for each scope in your Printful dashboard.', 'printful-resources'); ?>
                        <a href="https://www.printful.com/dashboard/store/integrations/api" target="_blank">
                            <?php _e('Create OAuth 2.0 tokens here', 'printful-resources'); ?>
                        </a>
                    </p>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_api_key_stores"><?php _e('Stores Token (stores_list/read)', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <input type="text" id="printful_resources_api_key_stores" name="printful_resources_api_key_stores" value="<?php echo esc_attr(get_option('printful_resources_api_key_stores', '')); ?>" class="regular-text" />
                                <p class="description">
                                    <?php _e('Required for store information access.', 'printful-resources'); ?>
                                </p>
                                <button type="button" data-scope="stores" class="button button-secondary test-connection-btn">
                                    <?php echo esc_html__('Test Stores Connection', 'printful-resources'); ?>
                                </button>
                                <span id="connection-status-stores" class="connection-status" style="margin-left: 10px;"></span>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_api_key_products"><?php _e('Products Token (products/read,write)', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <input type="text" id="printful_resources_api_key_products" name="printful_resources_api_key_products" value="<?php echo esc_attr(get_option('printful_resources_api_key_products', '')); ?>" class="regular-text" />
                                <p class="description">
                                    <?php _e('Required for product synchronization.', 'printful-resources'); ?>
                                </p>
                                <button type="button" data-scope="products" class="button button-secondary test-connection-btn">
                                    <?php echo esc_html__('Test Products Connection', 'printful-resources'); ?>
                                </button>
                                <span id="connection-status-products" class="connection-status" style="margin-left: 10px;"></span>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_api_key_orders"><?php _e('Orders Token (orders/read,write)', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <input type="text" id="printful_resources_api_key_orders" name="printful_resources_api_key_orders" value="<?php echo esc_attr(get_option('printful_resources_api_key_orders', '')); ?>" class="regular-text" />
                                <p class="description">
                                    <?php _e('Required for order processing and fulfillment.', 'printful-resources'); ?>
                                </p>
                                <button type="button" data-scope="orders" class="button button-secondary test-connection-btn">
                                    <?php echo esc_html__('Test Orders Connection', 'printful-resources'); ?>
                                </button>
                                <span id="connection-status-orders" class="connection-status" style="margin-left: 10px;"></span>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_api_key_shipping"><?php _e('Shipping Token (shipping_rates/read)', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <input type="text" id="printful_resources_api_key_shipping" name="printful_resources_api_key_shipping" value="<?php echo esc_attr(get_option('printful_resources_api_key_shipping', '')); ?>" class="regular-text" />
                                <p class="description">
                                    <?php _e('Required for shipping rate calculations.', 'printful-resources'); ?>
                                </p>
                                <button type="button" data-scope="shipping" class="button button-secondary test-connection-btn">
                                    <?php echo esc_html__('Test Shipping Connection', 'printful-resources'); ?>
                                </button>
                                <span id="connection-status-shipping" class="connection-status" style="margin-left: 10px;"></span>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_api_key_webhooks"><?php _e('Webhooks Token (webhooks/read,write)', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <input type="text" id="printful_resources_api_key_webhooks" name="printful_resources_api_key_webhooks" value="<?php echo esc_attr(get_option('printful_resources_api_key_webhooks', '')); ?>" class="regular-text" />
                                <p class="description">
                                    <?php _e('Required for order status updates.', 'printful-resources'); ?>
                                </p>
                                <button type="button" data-scope="webhooks" class="button button-secondary test-connection-btn">
                                    <?php echo esc_html__('Test Webhooks Connection', 'printful-resources'); ?>
                                </button>
                                <span id="connection-status-webhooks" class="connection-status" style="margin-left: 10px;"></span>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_store_id"><?php echo esc_html__('Store ID', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <input type="text" id="printful_resources_store_id" name="printful_resources_store_id" class="regular-text" value="<?php echo esc_attr(get_option('printful_resources_store_id')); ?>" />
                                <p class="description">
                                    <?php echo esc_html__('Enter your Printful Store ID. This is optional and will be auto-detected from your API key.', 'printful-resources'); ?>
                                </p>
                                <div id="store-information" class="store-info" style="display: none;"></div>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button(); ?>
                </form>
            </div>

            <!-- Product Settings -->
            <div id="products" class="tab-content">
                <form method="post" action="options.php">
                    <?php settings_fields('printful_resources_products'); ?>
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_sync_to_printful"><?php echo esc_html__('Sync to Printful', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_sync_to_printful" name="printful_resources_sync_to_printful">
                                    <option value="no" <?php selected(get_option('printful_resources_sync_to_printful', 'no'), 'no'); ?>>
                                        <?php echo esc_html__('No', 'printful-resources'); ?>
                                    </option>
                                    <option value="yes" <?php selected(get_option('printful_resources_sync_to_printful', 'no'), 'yes'); ?>>
                                        <?php echo esc_html__('Yes', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('When enabled, changes to product information in WooCommerce will be synced back to Printful.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_delete_products"><?php echo esc_html__('Delete Products', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_delete_products" name="printful_resources_delete_products">
                                    <option value="no" <?php selected(get_option('printful_resources_delete_products', 'no'), 'no'); ?>>
                                        <?php echo esc_html__('No', 'printful-resources'); ?>
                                    </option>
                                    <option value="yes" <?php selected(get_option('printful_resources_delete_products', 'no'), 'yes'); ?>>
                                        <?php echo esc_html__('Yes', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('When enabled, products deleted from Printful will also be deleted from WooCommerce during synchronization.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_delete_from_printful"><?php echo esc_html__('Delete from Printful', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_delete_from_printful" name="printful_resources_delete_from_printful">
                                    <option value="no" <?php selected(get_option('printful_resources_delete_from_printful', 'no'), 'no'); ?>>
                                        <?php echo esc_html__('No', 'printful-resources'); ?>
                                    </option>
                                    <option value="yes" <?php selected(get_option('printful_resources_delete_from_printful', 'no'), 'yes'); ?>>
                                        <?php echo esc_html__('Yes', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('When enabled, products deleted from WooCommerce will also be deleted from Printful.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button(); ?>
                </form>
            </div>

            <!-- Order Settings -->
            <div id="orders" class="tab-content">
                <form method="post" action="options.php">
                    <?php settings_fields('printful_resources_orders'); ?>
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_auto_fulfill"><?php echo esc_html__('Auto Fulfill', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_auto_fulfill" name="printful_resources_auto_fulfill">
                                    <option value="yes" <?php selected(get_option('printful_resources_auto_fulfill', 'yes'), 'yes'); ?>>
                                        <?php echo esc_html__('Yes', 'printful-resources'); ?>
                                    </option>
                                    <option value="no" <?php selected(get_option('printful_resources_auto_fulfill', 'yes'), 'no'); ?>>
                                        <?php echo esc_html__('No', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('When enabled, orders containing Printful products will be automatically sent to Printful for fulfillment.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_shipped_status"><?php echo esc_html__('Shipped Status', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_shipped_status" name="printful_resources_shipped_status">
                                    <option value="completed" <?php selected(get_option('printful_resources_shipped_status', 'completed'), 'completed'); ?>>
                                        <?php echo esc_html__('Mark as Completed', 'printful-resources'); ?>
                                    </option>
                                    <option value="none" <?php selected(get_option('printful_resources_shipped_status', 'completed'), 'none'); ?>>
                                        <?php echo esc_html__('Do Not Change Status', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('Action to take when an order is shipped by Printful.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_fail_status"><?php echo esc_html__('Failed Order Status', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_fail_status" name="printful_resources_fail_status">
                                    <option value="on-hold" <?php selected(get_option('printful_resources_fail_status', 'on-hold'), 'on-hold'); ?>>
                                        <?php echo esc_html__('On Hold', 'printful-resources'); ?>
                                    </option>
                                    <option value="failed" <?php selected(get_option('printful_resources_fail_status', 'on-hold'), 'failed'); ?>>
                                        <?php echo esc_html__('Failed', 'printful-resources'); ?>
                                    </option>
                                    <option value="none" <?php selected(get_option('printful_resources_fail_status', 'on-hold'), 'none'); ?>>
                                        <?php echo esc_html__('Do Not Change Status', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('Action to take when Printful fails to process an order.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_hold_status"><?php echo esc_html__('On Hold Status', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_hold_status" name="printful_resources_hold_status">
                                    <option value="on-hold" <?php selected(get_option('printful_resources_hold_status', 'on-hold'), 'on-hold'); ?>>
                                        <?php echo esc_html__('On Hold', 'printful-resources'); ?>
                                    </option>
                                    <option value="none" <?php selected(get_option('printful_resources_hold_status', 'on-hold'), 'none'); ?>>
                                        <?php echo esc_html__('Do Not Change Status', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('Action to take when Printful puts an order on hold.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <label for="printful_resources_refund_action"><?php echo esc_html__('Refund Action', 'printful-resources'); ?></label>
                            </th>
                            <td>
                                <select id="printful_resources_refund_action" name="printful_resources_refund_action">
                                    <option value="cancel" <?php selected(get_option('printful_resources_refund_action', 'cancel'), 'cancel'); ?>>
                                        <?php echo esc_html__('Cancel Printful Order', 'printful-resources'); ?>
                                    </option>
                                    <option value="none" <?php selected(get_option('printful_resources_refund_action', 'cancel'), 'none'); ?>>
                                        <?php echo esc_html__('Do Nothing', 'printful-resources'); ?>
                                    </option>
                                </select>
                                <p class="description">
                                    <?php echo esc_html__('Action to take when an order is refunded in WooCommerce.', 'printful-resources'); ?>
                                </p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button(); ?>
                </form>
            </div>

            <!-- Shipping Settings -->
            <div id="shipping" class="tab-content">
                <p><?php echo esc_html__('Printful shipping is controlled through the WooCommerce shipping zones. Please configure your shipping zones in WooCommerce and add the Printful shipping method to use Printful shipping rates.', 'printful-resources'); ?></p>
                <a href="<?php echo admin_url('admin.php?page=wc-settings&tab=shipping'); ?>" class="button button-primary">
                    <?php echo esc_html__('Configure Shipping Zones', 'printful-resources'); ?>
                </a>
            </div>
        </div>
    </div>

    <script>
        jQuery(document).ready(function($) {
            // Tab navigation
            $('.nav-tab').on('click', function(e) {
                e.preventDefault();
                var target = $(this).attr('href');
                
                // Update tabs
                $('.nav-tab').removeClass('nav-tab-active');
                $(this).addClass('nav-tab-active');
                
                // Update content
                $('.tab-content').removeClass('active');
                $(target).addClass('active');
            });
            
            // Test connection for each scope
            $('.test-connection-btn').on('click', function() {
                var scope = $(this).data('scope');
                var apiKey = $('#printful_resources_api_key_' + scope).val();
                var statusEl = $('#connection-status-' + scope);
                
                if (!apiKey) {
                    statusEl.html('<span style="color: red;"><?php echo esc_js(__('Please enter an API key', 'printful-resources')); ?></span>');
                    return;
                }
                
                $(this).prop('disabled', true).text('Testing...');
                statusEl.html('<span style="color: blue;"><?php echo esc_js(__('Testing connection...', 'printful-resources')); ?></span>');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'printful_resources_test_connection',
                        nonce: printfulResources.nonce,
                        api_key: apiKey,
                        scope: scope
                    },
                    success: function(response) {
                        if (response.success) {
                            statusEl.html('<span style="color: green;">✓ Connected successfully!</span>');
                            
                            // If this is the stores scope and we have store data
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
                            statusEl.html('<span style="color: red;">✗ ' + (response.data.message || 'Connection failed') + '</span>');
                        }
                    },
                    error: function() {
                        statusEl.html('<span style="color: red;">✗ <?php echo esc_js(__('Connection failed. Please try again.', 'printful-resources')); ?></span>');
                    },
                    complete: function() {
                        $('.test-connection-btn[data-scope="' + scope + '"]').prop('disabled', false).text('Test ' + scope.charAt(0).toUpperCase() + scope.slice(1) + ' Connection');
                    }
                });
            });
        });
    </script>
</div> 