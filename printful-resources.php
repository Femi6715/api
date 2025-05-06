<?php
/**
 * Plugin Name: Printful Resources
 * Plugin URI: https://developers.printful.com/docs/
 * Description: Sync products from Printful to WooCommerce, manage order fulfillment and shipping
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * Text Domain: printful-resources
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * WC requires at least: 4.0
 * WC tested up to: 8.0
 * License: GPL v2 or later
 */

// Enable logging for debugging
if (!defined('WP_DEBUG')) {
    define('WP_DEBUG', true);
}
if (!defined('WP_DEBUG_LOG')) {
    define('WP_DEBUG_LOG', true);
}
if (!defined('WP_DEBUG_DISPLAY')) {
    define('WP_DEBUG_DISPLAY', false);
}

// Custom error handler to catch and log errors
function printful_error_handler($errno, $errstr, $errfile, $errline) {
    error_log("Printful Error: [$errno] $errstr in $errfile on line $errline");
    return false; // Let WordPress handle the error as well
}
set_error_handler('printful_error_handler', E_ALL);

// Log plugin activation
error_log('Printful Resources plugin initializing...');

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Define plugin constants
define('PRINTFUL_RESOURCES_VERSION', '1.0.0');
define('PRINTFUL_RESOURCES_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('PRINTFUL_RESOURCES_PLUGIN_URL', plugin_dir_url(__FILE__));

// Require the composer autoloader
if (file_exists(dirname(__FILE__) . '/vendor/autoload.php')) {
    require_once dirname(__FILE__) . '/vendor/autoload.php';
}

// Wrap core file includes in try-catch to identify problematic files
try {
    error_log('Loading Printful API class...');
    require_once PRINTFUL_RESOURCES_PLUGIN_PATH . 'includes/class-printful-api.php';
    
    error_log('Loading Printful Product Sync class...');
    require_once PRINTFUL_RESOURCES_PLUGIN_PATH . 'includes/class-printful-product-sync.php';
    
    error_log('Loading Printful Order Sync class...');
    require_once PRINTFUL_RESOURCES_PLUGIN_PATH . 'includes/class-printful-order-sync.php';
    
    error_log('Loading Printful Shipping class...');
    require_once PRINTFUL_RESOURCES_PLUGIN_PATH . 'includes/class-printful-shipping.php';
    
    error_log('Loading Printful Shipping Method class...');
    require_once PRINTFUL_RESOURCES_PLUGIN_PATH . 'includes/class-printful-shipping-method.php';
    error_log('All Printful core files loaded successfully');
} catch (Exception $e) {
    error_log('Printful Resources error loading core files: ' . $e->getMessage());
    return; // Stop execution if core files can't be loaded
}

/**
 * Check if WooCommerce is active
 */
function printful_check_woocommerce() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'printful_woocommerce_missing_notice');
        return false;
    }
    return true;
}

/**
 * Display error notice if WooCommerce is not active
 */
function printful_woocommerce_missing_notice() {
    echo '<div class="error"><p>' . 
         sprintf(__('Printful Resources requires WooCommerce to be installed and active. You can download %s here.', 'printful-resources'), 
         '<a href="https://woocommerce.com/" target="_blank">WooCommerce</a>') . 
         '</p></div>';
}

/**
 * Initialize the plugin
 */
function printful_resources_init() {
    error_log('Printful Resources init function starting...');
    
    if (!printful_check_woocommerce()) {
        error_log('Printful Resources: WooCommerce not active');
        return;
    }
    
    try {
        // Initialize API handler
        error_log('Initializing Printful API...');
        $api = new Printful_API();
        
        // Set global API instance for other classes to use
        global $printful_api_instance;
        $printful_api_instance = $api;
        
        // Load admin functionality
        if (is_admin()) {
            error_log('Loading admin functionality...');
            require_once PRINTFUL_RESOURCES_PLUGIN_PATH . 'admin/class-printful-admin.php';
            new Printful_Admin();
        }
        
        // Initialize product sync
        error_log('Initializing product sync...');
        $product_sync = new Printful_Product_Sync($api);
        
        // Initialize order sync
        error_log('Initializing order sync...');
        $order_sync = new Printful_Order_Sync($api);
        
        // Initialize shipping
        error_log('Initializing shipping...');
        $shipping = new Printful_Shipping($api);
        
        // Register shipping method
        add_action('woocommerce_shipping_init', 'printful_shipping_method_init');
        add_filter('woocommerce_shipping_methods', 'printful_add_shipping_method');
        
        error_log('Printful Resources successfully initialized');
    } catch (Exception $e) {
        error_log('Error in Printful Resources initialization: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    }
}
add_action('plugins_loaded', 'printful_resources_init');

/**
 * Initialize Printful shipping method
 */
function printful_shipping_method_init() {
    error_log('Printful shipping method init...');
    // The shipping method class is already included in the main plugin file
}

/**
 * Add Printful shipping method to WooCommerce
 */
function printful_add_shipping_method($methods) {
    error_log('Adding Printful shipping method to WooCommerce...');
    $methods['printful'] = 'Printful_Shipping_Method';
    return $methods;
}

/**
 * Activate plugin
 */
function printful_resources_activate() {
    error_log('Activating Printful Resources plugin...');
    // Create required database tables or post options
    // Flush rewrite rules
    flush_rewrite_rules();
    error_log('Printful Resources plugin activated');
}
register_activation_hook(__FILE__, 'printful_resources_activate');

/**
 * Deactivate plugin
 */
function printful_resources_deactivate() {
    error_log('Deactivating Printful Resources plugin...');
    // Clean up if needed
    flush_rewrite_rules();
    error_log('Printful Resources plugin deactivated');
}
register_deactivation_hook(__FILE__, 'printful_resources_deactivate'); 