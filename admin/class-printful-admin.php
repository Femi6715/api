<?php
/**
 * Printful Admin
 *
 * @package Printful_Resources
 */

if (!defined('WPINC')) {
    die;
}

/**
 * Class Printful_Admin
 * Handles the admin interface for the plugin
 */
class Printful_Admin {
    /**
     * Printful API instance
     *
     * @var Printful_API
     */
    private $api;

    /**
     * Constructor
     */
    public function __construct() {
        try {
            $this->api = new Printful_API();
            
            // Add admin menu
            add_action('admin_menu', [$this, 'add_admin_menu']);
            
            // Register settings
            add_action('admin_init', [$this, 'register_settings']);
            
            // Add admin scripts and styles
            add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
            
            // AJAX handlers
            add_action('wp_ajax_printful_resources_test_connection', [$this, 'ajax_test_connection']);
            add_action('wp_ajax_printful_resources_sync_products', [$this, 'ajax_sync_products']);
            add_action('wp_ajax_printful_resources_sync_order', [$this, 'ajax_sync_order']);
            add_action('wp_ajax_printful_resources_cancel_order', [$this, 'ajax_cancel_order']);
            add_action('wp_ajax_printful_resources_refresh_order_status', [$this, 'ajax_refresh_order_status']);
            add_action('wp_ajax_printful_resources_sync_single_product', [$this, 'ajax_sync_single_product']);
            
            // Add meta boxes for order page
            add_action('add_meta_boxes', [$this, 'add_order_meta_boxes']);
            
            error_log('Printful_Admin: Class initialized successfully');
        } catch (Exception $e) {
            error_log('Printful_Admin: Error initializing class - ' . $e->getMessage());
        }
    }

    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        try {
            add_menu_page(
                __('Printful', 'printful-resources'),
                __('Printful', 'printful-resources'),
                'manage_woocommerce',
                'printful-resources',
                [$this, 'render_dashboard_page'],
                'dashicons-products',
                58
            );
            
            add_submenu_page(
                'printful-resources',
                __('Dashboard', 'printful-resources'),
                __('Dashboard', 'printful-resources'),
                'manage_woocommerce',
                'printful-resources',
                [$this, 'render_dashboard_page']
            );
            
            add_submenu_page(
                'printful-resources',
                __('Products', 'printful-resources'),
                __('Products', 'printful-resources'),
                'manage_woocommerce',
                'printful-resources-products',
                [$this, 'render_products_page']
            );
            
            add_submenu_page(
                'printful-resources',
                __('Orders', 'printful-resources'),
                __('Orders', 'printful-resources'),
                'manage_woocommerce',
                'printful-resources-orders',
                [$this, 'render_orders_page']
            );
            
            add_submenu_page(
                'printful-resources',
                __('Settings', 'printful-resources'),
                __('Settings', 'printful-resources'),
                'manage_woocommerce',
                'printful-resources-settings',
                [$this, 'render_settings_page']
            );
            
            error_log('Printful_Admin: Admin menu added');
        } catch (Exception $e) {
            error_log('Printful_Admin: Error adding admin menu - ' . $e->getMessage());
        }
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // General settings
        register_setting('printful_resources_general', 'printful_resources_api_key_stores');
        register_setting('printful_resources_general', 'printful_resources_api_key_products');
        register_setting('printful_resources_general', 'printful_resources_api_key_orders');
        register_setting('printful_resources_general', 'printful_resources_api_key_shipping');
        register_setting('printful_resources_general', 'printful_resources_api_key_webhooks');
        register_setting('printful_resources_general', 'printful_resources_store_id');
        
        // Product settings
        register_setting('printful_resources_products', 'printful_resources_sync_to_printful');
        register_setting('printful_resources_products', 'printful_resources_delete_products');
        register_setting('printful_resources_products', 'printful_resources_delete_from_printful');
        
        // Order settings
        register_setting('printful_resources_orders', 'printful_resources_auto_fulfill');
        register_setting('printful_resources_orders', 'printful_resources_shipped_status');
        register_setting('printful_resources_orders', 'printful_resources_fail_status');
        register_setting('printful_resources_orders', 'printful_resources_hold_status');
        register_setting('printful_resources_orders', 'printful_resources_refund_action');
        
        // Add settings script
        add_action('admin_enqueue_scripts', function($hook) {
            if (strpos($hook, 'printful-resources-settings') !== false) {
                wp_enqueue_script(
                    'printful-resources-settings',
                    PRINTFUL_RESOURCES_PLUGIN_URL . 'admin/js/settings.js',
                    ['jquery'],
                    PRINTFUL_RESOURCES_VERSION,
                    true
                );
                
                wp_localize_script(
                    'printful-resources-settings', 
                    'printful_settings', 
                    [
                        'ajaxurl' => admin_url('admin-ajax.php'),
                        'nonce' => wp_create_nonce('printful_resources_nonce')
                    ]
                );
            }
        });
    }

    /**
     * Enqueue admin scripts and styles
     *
     * @param string $hook Hook suffix.
     */
    public function enqueue_scripts($hook) {
        $screen = get_current_screen();
        
        if (strpos($hook, 'printful-resources') !== false) {
            // Enqueue styles
            wp_enqueue_style(
                'printful-resources-admin',
                PRINTFUL_RESOURCES_PLUGIN_URL . 'admin/css/admin.css',
                [],
                PRINTFUL_RESOURCES_VERSION
            );
            
            // Enqueue scripts
            wp_enqueue_script(
                'printful-resources-admin',
                PRINTFUL_RESOURCES_PLUGIN_URL . 'admin/js/admin.js',
                ['jquery'],
                PRINTFUL_RESOURCES_VERSION,
                true
            );
            
            // Localize script
            $script_data = [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('printful_resources_nonce'),
                'strings' => [
                    'testSuccess' => __('Connection successful!', 'printful-resources'),
                    'testFailed' => __('Connection failed: ', 'printful-resources'),
                    'syncStarted' => __('Synchronization started...', 'printful-resources'),
                    'syncCompleted' => __('Synchronization completed.', 'printful-resources'),
                    'syncFailed' => __('Synchronization failed: ', 'printful-resources'),
                    'confirm' => __('Are you sure?', 'printful-resources'),
                ],
            ];
            
            wp_localize_script('printful-resources-admin', 'printfulResources', $script_data);
        }
        
        // Order edit page
        if ($screen && $screen->id === 'shop_order') {
            wp_enqueue_script(
                'printful-resources-order',
                PRINTFUL_RESOURCES_PLUGIN_URL . 'admin/js/order.js',
                ['jquery'],
                PRINTFUL_RESOURCES_VERSION,
                true
            );
            
            $order_script_data = [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('printful_resources_nonce'),
            ];
            
            wp_localize_script('printful-resources-order', 'printfulResources', $order_script_data);
        }
    }

    /**
     * Render dashboard page
     */
    public function render_dashboard_page() {
        try {
            // Get store information if API key is set
            $store_info = null;
            $api_key = get_option('printful_resources_api_key_stores');
            
            if ($api_key) {
                $response = $this->api->get_store_info();
                
                if (!is_wp_error($response) && isset($response['result'])) {
                    $store_info = $response['result'];
                }
            }
            
            // Get last sync time
            $last_sync = get_option('printful_resources_last_sync');
            
            // Include template
            include PRINTFUL_RESOURCES_PLUGIN_PATH . 'admin/views/dashboard.php';
        } catch (Exception $e) {
            error_log('Printful_Admin: Error rendering dashboard - ' . $e->getMessage());
            echo '<div class="wrap"><div class="notice notice-error"><p>';
            echo esc_html__('An error occurred while loading the dashboard. Please check the error logs for more information.', 'printful-resources');
            echo '</p></div></div>';
        }
    }

    /**
     * Render products page
     */
    public function render_products_page() {
        try {
            // Set error handling to capture all potential issues
            error_reporting(E_ALL);
            ini_set('display_errors', 1);
            
            error_log('Printful_Admin: Starting to render products page');
            
            // Get printful products
            $printful_products = [];
            $api_key = get_option('printful_resources_api_key_products');
            
            if ($api_key) {
                error_log('Printful_Admin: Fetching products from Printful API');
                $response = $this->api->get_products();
                
                if (is_wp_error($response)) {
                    error_log('Printful_Admin: Error getting products - ' . $response->get_error_message());
                } elseif (isset($response['result']) && is_array($response['result'])) {
                    $printful_products = $response['result'];
                    error_log('Printful_Admin: Retrieved ' . count($printful_products) . ' products');
                } else {
                    error_log('Printful_Admin: Invalid product response format');
                }
            }
            
            // Helper function for template
            $this->printful_get_wc_product_by_printful_id = function($printful_id) {
                global $wpdb;
                
                try {
                    if (empty($printful_id)) {
                        return false;
                    }
                    
                    $query = $wpdb->prepare(
                        "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_printful_product_id' AND meta_value = %s LIMIT 1",
                        $printful_id
                    );
                    
                    $product_id = $wpdb->get_var($query);
                    
                    return $product_id ? (int) $product_id : false;
                } catch (Exception $e) {
                    error_log('Printful_Admin: Error in get_wc_product_by_printful_id - ' . $e->getMessage());
                    return false;
                }
            };
            
            // Include template
            include PRINTFUL_RESOURCES_PLUGIN_PATH . 'admin/views/products.php';
        } catch (Exception $e) {
            error_log('Printful_Admin: Error rendering products page - ' . $e->getMessage());
            echo '<div class="wrap"><div class="notice notice-error"><p>';
            echo esc_html__('A critical error occurred while loading the products page.', 'printful-resources');
            echo '</p>';

            if (defined('WP_DEBUG') && WP_DEBUG) {
                echo '<p><strong>Error details:</strong> ' . esc_html($e->getMessage()) . '</p>';
                echo '<pre>' . esc_html($e->getTraceAsString()) . '</pre>';
            } else {
                echo '<p>' . esc_html__('Please check the error logs for more information or enable WP_DEBUG for details.', 'printful-resources') . '</p>';
            }

            echo '</div></div>';
        }
    }
    
    /**
     * Get WooCommerce product ID by Printful ID
     *
     * @param int $printful_id Printful product ID.
     * @return int|false WooCommerce product ID or false.
     */
    public function get_wc_product_by_printful_id($printful_id) {
        global $wpdb;
        
        try {
            if (empty($printful_id)) {
                return false;
            }
            
            $query = $wpdb->prepare(
                "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_printful_product_id' AND meta_value = %s LIMIT 1",
                $printful_id
            );
            
            $product_id = $wpdb->get_var($query);
            
            return $product_id ? (int) $product_id : false;
        } catch (Exception $e) {
            error_log('Printful_Admin: Error in get_wc_product_by_printful_id - ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Render orders page
     */
    public function render_orders_page() {
        try {
            // Get printful orders
            $printful_orders = [];
            $api_key = get_option('printful_resources_api_key_orders');
            
            if ($api_key) {
                $response = $this->api->get_orders();
                
                if (!is_wp_error($response) && isset($response['result'])) {
                    $printful_orders = $response['result'];
                }
            }
            
            // Include template
            include PRINTFUL_RESOURCES_PLUGIN_PATH . 'admin/views/orders.php';
        } catch (Exception $e) {
            error_log('Printful_Admin: Error rendering orders page - ' . $e->getMessage());
            echo '<div class="wrap"><div class="notice notice-error"><p>';
            echo esc_html__('An error occurred while loading the orders page. Please check the error logs for more information.', 'printful-resources');
            echo '</p></div></div>';
        }
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        try {
            // Include template
            include PRINTFUL_RESOURCES_PLUGIN_PATH . 'admin/views/settings.php';
        } catch (Exception $e) {
            error_log('Printful_Admin: Error rendering settings page - ' . $e->getMessage());
            echo '<div class="wrap"><div class="notice notice-error"><p>';
            echo esc_html__('An error occurred while loading the settings page. Please check the error logs for more information.', 'printful-resources');
            echo '</p></div></div>';
        }
    }

    /**
     * AJAX handler for testing API connection
     */
    public function ajax_test_connection() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
            wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
        }
        
        // Check user capability
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('You do not have permission to do this', 'printful-resources')]);
        }
        
        // Get API key and scope
        $api_key = isset($_POST['api_key']) ? sanitize_text_field($_POST['api_key']) : '';
        $scope = isset($_POST['scope']) ? sanitize_text_field($_POST['scope']) : '';
        $test_type = isset($_POST['test_type']) ? sanitize_text_field($_POST['test_type']) : '';
        
        // Special handling for testing from products page
        if ($test_type === 'products_api') {
            // Use the stored products API key
            $api_key = get_option('printful_resources_api_key_products', '');
            $scope = 'products';
            
            if (empty($api_key)) {
                wp_send_json_error(['message' => __('Products API key is not set in the settings', 'printful-resources')]);
                return;
            }
        } else {
            // Normal API key validation for settings page
            if (empty($api_key)) {
                wp_send_json_error(['message' => __('API key is required', 'printful-resources')]);
                return;
            }
            
            if (empty($scope)) {
                wp_send_json_error(['message' => __('Scope is required', 'printful-resources')]);
                return;
            }
        }
        
        // Create temporary API instance with provided key
        $temp_api = new Printful_API();
        
        // Set the API key directly for testing
        $temp_api->set_api_key($api_key);
        
        // Test connection based on scope
        $result = false;
        $response_data = [];
        
        try {
            error_log('Printful_Admin: Testing connection for scope: ' . $scope . ' with API key: ' . substr($api_key, 0, 5) . '...');
            
            switch ($scope) {
                case 'stores':
                    $response = $temp_api->get_store_info();
                    if (!is_wp_error($response) && isset($response['result'])) {
                        $result = true;
                        $response_data['store'] = $response['result'];
                        $message = __('Successfully connected to Printful and retrieved store information', 'printful-resources');
                    } else {
                        $error_message = is_wp_error($response) ? $response->get_error_message() : __('Invalid response format', 'printful-resources');
                        error_log('Printful_Admin: Store connection test failed: ' . $error_message);
                        wp_send_json_error(['message' => $error_message]);
                        return;
                    }
                    break;
                    
                case 'products':
                    $response = $temp_api->get_products(0, 1); // Just get one product to test
                    if (!is_wp_error($response)) {
                        $result = true;
                        $message = __('Successfully connected to Printful Products API', 'printful-resources');
                        
                        // Add product count if available
                        if (isset($response['paging']) && isset($response['paging']['total'])) {
                            $message .= ' - ' . sprintf(__('Found %d products', 'printful-resources'), $response['paging']['total']);
                        }
                    } else {
                        error_log('Printful_Admin: Products connection test failed: ' . $response->get_error_message());
                        wp_send_json_error(['message' => $response->get_error_message()]);
                        return;
                    }
                    break;
                    
                case 'orders':
                    $response = $temp_api->get_orders(0, 1); // Just get one order to test
                    if (!is_wp_error($response)) {
                        $result = true;
                        $message = __('Successfully connected to Printful Orders API', 'printful-resources');
                    } else {
                        error_log('Printful_Admin: Orders connection test failed: ' . $response->get_error_message());
                        wp_send_json_error(['message' => $response->get_error_message()]);
                        return;
                    }
                    break;
                    
                case 'shipping':
                    // We can only test if the API key is valid, not if it actually works for shipping
                    // Since shipping rates require specific data
                    $response = $temp_api->test_connection();
                    if (!is_wp_error($response)) {
                        $result = true;
                        $message = __('Successfully connected to Printful Shipping API', 'printful-resources');
                    } else {
                        error_log('Printful_Admin: Shipping connection test failed: ' . $response->get_error_message());
                        wp_send_json_error(['message' => $response->get_error_message()]);
                        return;
                    }
                    break;
                    
                case 'webhooks':
                    $response = $temp_api->get_webhooks();
                    if (!is_wp_error($response)) {
                        $result = true;
                        $message = __('Successfully connected to Printful Webhooks API', 'printful-resources');
                    } else {
                        error_log('Printful_Admin: Webhooks connection test failed: ' . $response->get_error_message());
                        wp_send_json_error(['message' => $response->get_error_message()]);
                        return;
                    }
                    break;
                    
                default:
                    wp_send_json_error(['message' => __('Invalid scope', 'printful-resources')]);
                    return;
            }
            
            if ($result) {
                // If successful and not just testing from products page
                if ($test_type !== 'products_api') {
                    // Save the key for the specific scope
                    update_option('printful_resources_api_key_' . $scope, $api_key);
                }
                
                $response_data['message'] = $message;
                wp_send_json_success($response_data);
            } else {
                wp_send_json_error(['message' => __('Connection test failed', 'printful-resources')]);
            }
        } catch (Exception $e) {
            error_log('Printful_Admin: Exception during connection test: ' . $e->getMessage());
            wp_send_json_error([
                'message' => __('Exception during connection test: ', 'printful-resources') . $e->getMessage()
            ]);
        }
    }

    /**
     * Enable detailed error logging
     */
    private function enable_debug_logging() {
        // Make sure error display is enabled
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        
        // Set error reporting to maximum
        error_reporting(E_ALL);
        
        // Enable WordPress debugging if not already enabled
        if (!defined('WP_DEBUG')) {
            define('WP_DEBUG', true);
        }
        
        if (!defined('WP_DEBUG_LOG')) {
            define('WP_DEBUG_LOG', true);
        }
        
        error_log('Printful_Admin: Debug logging enabled for debugging product sync');
    }

    /**
     * AJAX handler for product synchronization
     */
    public function ajax_sync_products() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
            wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
        }
        
        // Check user capability
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('You do not have permission to do this', 'printful-resources')]);
        }
        
        // Enable detailed error logging for debugging
        $this->enable_debug_logging();
        
        // Force update
        $force = isset($_POST['force']) && $_POST['force'] === 'true';
        
        // Get the products API key
        $products_api_key = get_option('printful_resources_api_key_products', '');
        
        if (empty($products_api_key)) {
            error_log('Printful_Admin: Products API key is not set');
            wp_send_json_error([
                'message' => __('Products API key is not set. Please configure it in the settings.', 'printful-resources'),
                'result' => ['errors' => [__('Products API key is not set', 'printful-resources')]]
            ]);
            return;
        }
        
        error_log('Printful_Admin: Starting product sync with API key: ' . substr($products_api_key, 0, 5) . '...');
        
        // Create a new API instance specifically for products
        try {
            $product_api = new Printful_API();
            $product_api->set_api_key($products_api_key);
            
            // Test the API connection first
            $test_response = $product_api->get_products(0, 1);
            if (is_wp_error($test_response)) {
                error_log('Printful_Admin: API test failed: ' . $test_response->get_error_message());
                wp_send_json_error([
                    'message' => __('API connection test failed: ', 'printful-resources') . $test_response->get_error_message(),
                    'result' => ['errors' => [$test_response->get_error_message()]]
                ]);
                return;
            }
            
            error_log('Printful_Admin: API connection test successful');
            
            // Initialize product sync with the dedicated API instance
            $product_sync = new Printful_Product_Sync($product_api);
            
            // Sync products
            try {
                error_log('Printful_Admin: Starting product sync. Force update: ' . ($force ? 'yes' : 'no'));
                $result = $product_sync->sync_all_products($force);
                
                if (!empty($result['errors'])) {
                    error_log('Printful_Admin: Sync completed with errors: ' . implode(', ', $result['errors']));
                    wp_send_json_error([
                        'message' => __('Sync completed with errors', 'printful-resources'),
                        'result' => $result,
                    ]);
                } else {
                    error_log('Printful_Admin: Sync completed successfully');
                    wp_send_json_success([
                        'message' => __('Sync completed successfully', 'printful-resources'),
                        'result' => $result,
                    ]);
                }
            } catch (Exception $e) {
                $error_message = 'Error during sync: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
                error_log('Printful_Admin: ' . $error_message);
                error_log('Printful_Admin: ' . $e->getTraceAsString());
                
                wp_send_json_error([
                    'message' => sprintf(__('Error during sync: %s', 'printful-resources'), $e->getMessage()),
                    'result' => [
                        'errors' => [$e->getMessage()],
                        'debug_info' => [
                            'Exception: ' . $error_message,
                            'File: ' . $e->getFile(),
                            'Line: ' . $e->getLine(),
                            'Stack trace: ' . $e->getTraceAsString()
                        ]
                    ]
                ]);
            }
        } catch (Exception $e) {
            $error_message = 'Exception initializing API: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
            error_log('Printful_Admin: ' . $error_message);
            error_log('Printful_Admin: ' . $e->getTraceAsString());
            
            wp_send_json_error([
                'message' => sprintf(__('Error initializing API: %s', 'printful-resources'), $e->getMessage()),
                'result' => [
                    'errors' => [$e->getMessage()],
                    'debug_info' => [
                        'Exception: ' . $error_message,
                        'File: ' . $e->getFile(),
                        'Line: ' . $e->getLine(),
                        'Stack trace: ' . $e->getTraceAsString()
                    ]
                ]
            ]);
        }
    }

    /**
     * AJAX handler for order synchronization
     */
    public function ajax_sync_order() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
            wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
        }
        
        // Check user capability
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('You do not have permission to do this', 'printful-resources')]);
        }
        
        // Get order ID
        $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
        
        if (!$order_id) {
            wp_send_json_error(['message' => __('Invalid order ID', 'printful-resources')]);
        }
        
        // Get order
        $order = wc_get_order($order_id);
        
        if (!$order) {
            wp_send_json_error(['message' => __('Order not found', 'printful-resources')]);
        }
        
        // Initialize order sync
        $order_sync = new Printful_Order_Sync($this->api);
        
        // Create Printful order
        $order_sync->create_printful_order($order_id, [], $order);
        
        // Get updated order data
        $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
        
        if (!$printful_order_id) {
            wp_send_json_error(['message' => __('Failed to create Printful order', 'printful-resources')]);
        }
        
        wp_send_json_success([
            'message' => __('Order sent to Printful successfully', 'printful-resources'),
            'order_id' => $printful_order_id,
        ]);
    }

    /**
     * AJAX handler for canceling an order
     */
    public function ajax_cancel_order() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
            wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
        }
        
        // Check user capability
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('You do not have permission to do this', 'printful-resources')]);
        }
        
        // Get order ID
        $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
        
        if (!$order_id) {
            wp_send_json_error(['message' => __('Invalid order ID', 'printful-resources')]);
        }
        
        $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
        
        if (!$printful_order_id) {
            wp_send_json_error(['message' => __('No Printful order found', 'printful-resources')]);
        }
        
        // Cancel order in Printful
        $response = $this->api->cancel_order($printful_order_id);
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }
        
        // Update order status
        update_post_meta($order_id, '_printful_order_status', 'canceled');
        
        $order = wc_get_order($order_id);
        $order->add_order_note(__('Printful order cancelled', 'printful-resources'));
        
        wp_send_json_success([
            'message' => __('Order cancelled successfully', 'printful-resources'),
        ]);
    }

    /**
     * AJAX handler for refreshing order status
     */
    public function ajax_refresh_order_status() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
            wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
        }
        
        // Check user capability
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('You do not have permission to do this', 'printful-resources')]);
        }
        
        // Get order ID
        $order_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
        
        if (!$order_id) {
            wp_send_json_error(['message' => __('Invalid order ID', 'printful-resources')]);
        }
        
        $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
        
        if (!$printful_order_id) {
            wp_send_json_error(['message' => __('No Printful order found', 'printful-resources')]);
        }
        
        // Get order from Printful
        $response = $this->api->get_order($printful_order_id);
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }
        
        if (!isset($response['result'])) {
            wp_send_json_error(['message' => __('Invalid response from Printful API', 'printful-resources')]);
        }
        
        $printful_order = $response['result'];
        $current_status = get_post_meta($order_id, '_printful_order_status', true);
        
        // Update status if changed
        if ($current_status !== $printful_order['status']) {
            update_post_meta($order_id, '_printful_order_status', $printful_order['status']);
            
            $order = wc_get_order($order_id);
            $order->add_order_note(sprintf(
                __('Printful order status updated: %s', 'printful-resources'),
                $printful_order['status']
            ));
            
            // Update tracking info if available
            if (!empty($printful_order['shipments'])) {
                $shipment = reset($printful_order['shipments']);
                
                if (isset($shipment['tracking_number'])) {
                    update_post_meta($order_id, '_printful_tracking_number', $shipment['tracking_number']);
                    update_post_meta($order_id, '_printful_tracking_url', $shipment['tracking_url'] ?? '');
                }
            }
        }
        
        wp_send_json_success([
            'message' => __('Order status refreshed', 'printful-resources'),
            'status' => $printful_order['status'],
        ]);
    }

    /**
     * AJAX handler for syncing a single product
     */
    public function ajax_sync_single_product() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
            wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
        }
        
        // Check user capability
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => __('You do not have permission to do this', 'printful-resources')]);
        }
        
        // Get product ID
        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        
        if (!$product_id) {
            wp_send_json_error(['message' => __('Invalid product ID', 'printful-resources')]);
            return;
        }
        
        // Enable detailed error logging for debugging
        $this->enable_debug_logging();
        
        // Get the products API key
        $products_api_key = get_option('printful_resources_api_key_products', '');
        
        if (empty($products_api_key)) {
            error_log('Printful_Admin: Products API key is not set');
            wp_send_json_error([
                'message' => __('Products API key is not set. Please configure it in the settings.', 'printful-resources')
            ]);
            return;
        }
        
        error_log('Printful_Admin: Starting single product sync for product ID: ' . $product_id);
        
        try {
            // Create a new API instance specifically for products
            $product_api = new Printful_API();
            $product_api->set_api_key($products_api_key);
            
            // Get product details from Printful
            $response = $product_api->get_product($product_id);
            
            if (is_wp_error($response)) {
                error_log('Printful_Admin: API error retrieving product: ' . $response->get_error_message());
                wp_send_json_error([
                    'message' => __('Error retrieving product: ', 'printful-resources') . $response->get_error_message()
                ]);
                return;
            }
            
            if (!isset($response['result']) || !is_array($response['result'])) {
                error_log('Printful_Admin: Invalid product data from API');
                wp_send_json_error([
                    'message' => __('Invalid product data returned from Printful', 'printful-resources')
                ]);
                return;
            }
            
            $product_data = $response['result'];
            
            // Initialize product sync with the dedicated API instance
            $product_sync = new Printful_Product_Sync($product_api);
            
            // Check if product already exists in WooCommerce
            $wc_product_id = null;
            
            // Try to find the product in WooCommerce
            global $wpdb;
            $query = $wpdb->prepare(
                "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_printful_product_id' AND meta_value = %s LIMIT 1",
                $product_id
            );
            $wc_product_id = $wpdb->get_var($query);
            
            $result = null;
            
            if ($wc_product_id) {
                // Update existing product
                error_log('Printful_Admin: Updating existing product (WC ID: ' . $wc_product_id . ')');
                $result = $product_sync->update_wc_product($wc_product_id, $product_data['sync_product']);
                
                if (is_wp_error($result)) {
                    error_log('Printful_Admin: Error updating product: ' . $result->get_error_message());
                    wp_send_json_error([
                        'message' => __('Error updating product: ', 'printful-resources') . $result->get_error_message()
                    ]);
                    return;
                }
                
                if ($result === false) {
                    error_log('Printful_Admin: Product already up to date');
                    wp_send_json_success([
                        'message' => __('Product already up to date', 'printful-resources'),
                        'wc_product_id' => $wc_product_id
                    ]);
                    return;
                }
                
                wp_send_json_success([
                    'message' => __('Product updated successfully', 'printful-resources'),
                    'wc_product_id' => $wc_product_id
                ]);
            } else {
                // Create new product
                error_log('Printful_Admin: Creating new product');
                $result = $product_sync->create_wc_product($product_data['sync_product']);
                
                if (is_wp_error($result)) {
                    error_log('Printful_Admin: Error creating product: ' . $result->get_error_message());
                    wp_send_json_error([
                        'message' => __('Error creating product: ', 'printful-resources') . $result->get_error_message()
                    ]);
                    return;
                }
                
                wp_send_json_success([
                    'message' => __('Product created successfully', 'printful-resources'),
                    'wc_product_id' => $result
                ]);
            }
        } catch (Exception $e) {
            $error_message = 'Exception syncing product: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
            error_log('Printful_Admin: ' . $error_message);
            error_log('Printful_Admin: ' . $e->getTraceAsString());
            
            wp_send_json_error([
                'message' => sprintf(__('Error syncing product: %s', 'printful-resources'), $e->getMessage())
            ]);
        }
    }

    /**
     * Add meta boxes to order page
     */
    public function add_order_meta_boxes() {
        add_meta_box(
            'printful_order_data',
            __('Printful Order', 'printful-resources'),
            [$this, 'render_order_meta_box'],
            'shop_order',
            'side',
            'high'
        );
    }

    /**
     * Render order meta box
     *
     * @param WP_Post $post Post object.
     */
    public function render_order_meta_box($post) {
        try {
            $order_id = $post->ID;
            $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
            
            if (!$printful_order_id) {
                // Check if order contains Printful products
                $order = wc_get_order($order_id);
                $has_printful_items = false;
                
                foreach ($order->get_items() as $item) {
                    $product_id = $item->get_product_id();
                    $variation_id = $item->get_variation_id();
                    $target_id = $variation_id ? $variation_id : $product_id;
                    
                    $printful_variant_id = get_post_meta($target_id, '_printful_variant_id', true);
                    
                    if ($printful_variant_id) {
                        $has_printful_items = true;
                        break;
                    }
                }
                
                if ($has_printful_items) {
                    echo '<p>' . __('This order contains Printful products but has not been sent to Printful.', 'printful-resources') . '</p>';
                    
                    echo '<button type="button" class="button" id="send-to-printful" data-order-id="' . esc_attr($order_id) . '">';
                    echo __('Send to Printful', 'printful-resources');
                    echo '</button>';
                } else {
                    echo '<p>' . __('This order does not contain any Printful products.', 'printful-resources') . '</p>';
                }
                
                return;
            }
            
            $printful_status = get_post_meta($order_id, '_printful_order_status', true);
            $tracking_number = get_post_meta($order_id, '_printful_tracking_number', true);
            $tracking_url = get_post_meta($order_id, '_printful_tracking_url', true);
            
            $status_labels = [
                'draft' => __('Draft', 'printful-resources'),
                'pending' => __('Pending', 'printful-resources'),
                'inprocess' => __('In Process', 'printful-resources'),
                'onhold' => __('On Hold', 'printful-resources'),
                'failed' => __('Failed', 'printful-resources'),
                'canceled' => __('Canceled', 'printful-resources'),
                'shipped' => __('Shipped', 'printful-resources'),
                'fulfilled' => __('Fulfilled', 'printful-resources'),
            ];
            
            $status_label = isset($status_labels[$printful_status]) ? $status_labels[$printful_status] : $printful_status;
            
            echo '<p><strong>' . __('Printful Order ID:', 'printful-resources') . '</strong> ' . esc_html($printful_order_id) . '</p>';
            echo '<p><strong>' . __('Status:', 'printful-resources') . '</strong> ' . esc_html($status_label) . '</p>';
            
            if ($tracking_number) {
                echo '<p><strong>' . __('Tracking:', 'printful-resources') . '</strong> ';
                
                if ($tracking_url) {
                    echo '<a href="' . esc_url($tracking_url) . '" target="_blank">' . esc_html($tracking_number) . '</a>';
                } else {
                    echo esc_html($tracking_number);
                }
                
                echo '</p>';
            }
            
            // Show action buttons based on order status
            echo '<div class="printful-actions">';
            
            if (in_array($printful_status, ['draft', 'inprocess', 'onhold'])) {
                echo '<button type="button" class="button" id="cancel-printful-order" data-order-id="' . esc_attr($order_id) . '">';
                echo __('Cancel Printful Order', 'printful-resources');
                echo '</button>';
            }
            
            echo '<button type="button" class="button" id="refresh-printful-status" data-order-id="' . esc_attr($order_id) . '">';
            echo __('Refresh Status', 'printful-resources');
            echo '</button>';
            
            echo '</div>';
        } catch (Exception $e) {
            error_log('Printful_Admin: Error rendering order meta box - ' . $e->getMessage());
            echo '<p>' . esc_html__('An error occurred while loading Printful order data.', 'printful-resources') . '</p>';
        }
    }
} 