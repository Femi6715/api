<?php
/**
 * Uninstall Printful Resources
 *
 * Removes all options, custom post types, and other data associated with the plugin.
 *
 * @package Printful_Resources
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete plugin options
delete_option('printful_resources_api_key');
delete_option('printful_resources_store_id');
delete_option('printful_resources_last_sync');
delete_option('printful_resources_sync_status');
delete_option('printful_resources_settings');

// Clean up any transients
delete_transient('printful_resources_categories');
delete_transient('printful_resources_shipping_rates');
delete_transient('printful_resources_products');

// Remove any scheduled events
wp_clear_scheduled_hook('printful_resources_sync_products');
wp_clear_scheduled_hook('printful_resources_sync_orders');

// Optionally: Clean up any custom tables
// global $wpdb;
// $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}printful_resources_logs");

// Flush cache and rewrite rules
wp_cache_flush();
flush_rewrite_rules(); 