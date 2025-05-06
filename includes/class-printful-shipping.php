<?php
/**
 * Printful Shipping
 *
 * @package Printful_Resources
 */

if (!defined('WPINC')) {
    die;
}

// Ensure WC_Error exists
if (!class_exists('WP_Error')) {
    require_once ABSPATH . WPINC . '/class-wp-error.php';
}

/**
 * Class Printful_Shipping
 * Handles shipping rate calculations from Printful
 */
class Printful_Shipping {
    /**
     * Printful API instance
     *
     * @var Printful_API
     */
    private $api;

    /**
     * Constructor
     *
     * @param Printful_API $api API instance.
     */
    public function __construct($api) {
        try {
            if (!is_object($api) || !method_exists($api, 'request')) {
                error_log('Printful_Shipping: Invalid API instance provided');
                $this->api = null;
            } else {
                $this->api = $api;
                error_log('Printful_Shipping: API instance set successfully');
            }
            
            // AJAX handler for calculating shipping rates
            add_action('wp_ajax_printful_calculate_shipping', [$this, 'ajax_calculate_shipping']);
            add_action('wp_ajax_nopriv_printful_calculate_shipping', [$this, 'ajax_calculate_shipping']);
            
            // Hook into WooCommerce shipping method filters
            add_filter('woocommerce_shipping_instance_form_fields_printful', [$this, 'add_extra_shipping_fields'], 10, 1);
            
            error_log('Printful_Shipping: Class initialized');
        } catch (Exception $e) {
            error_log('Printful_Shipping: Constructor error - ' . $e->getMessage());
        }
    }

    /**
     * Add extra shipping fields to the instance settings
     *
     * @param array $fields The original fields.
     * @return array The modified fields.
     */
    public function add_extra_shipping_fields($fields) {
        try {
            // You can add custom fields to the shipping method settings here
            return $fields;
        } catch (Exception $e) {
            error_log('Printful_Shipping: Error in add_extra_shipping_fields - ' . $e->getMessage());
            return $fields;
        }
    }

    /**
     * Calculate shipping rates for a cart
     *
     * @param array $package Shipping package.
     * @return array|WP_Error Shipping rates or error.
     */
    public function calculate_shipping_rates($package) {
        try {
            error_log('Printful_Shipping: Calculating shipping rates');
            
            // Check if API is available
            if (!$this->api) {
                error_log('Printful_Shipping: No API instance available');
                return new WP_Error('printful_shipping_error', __('API not initialized', 'printful-resources'));
            }
            
            // Check if package contains Printful products
            $has_printful_items = false;
            $items = [];
            
            if (empty($package['contents'])) {
                error_log('Printful_Shipping: Empty package contents');
                return [];
            }
            
            foreach ($package['contents'] as $item) {
                if (!isset($item['product_id'])) {
                    continue;
                }
                
                $product_id = $item['product_id'];
                $variation_id = isset($item['variation_id']) ? $item['variation_id'] : 0;
                $target_id = $variation_id ? $variation_id : $product_id;
                
                if (!$target_id) {
                    continue;
                }
                
                $printful_variant_id = get_post_meta($target_id, '_printful_variant_id', true);
                
                if ($printful_variant_id) {
                    $has_printful_items = true;
                    
                    $items[] = [
                        'variant_id' => (int) $printful_variant_id,
                        'quantity' => isset($item['quantity']) ? $item['quantity'] : 1,
                    ];
                }
            }
            
            if (!$has_printful_items) {
                error_log('Printful_Shipping: No Printful items in package');
                return [];
            }
            
            // Check necessary address fields
            if (empty($package['destination']) || 
                empty($package['destination']['country']) || 
                empty($package['destination']['postcode'])) {
                error_log('Printful_Shipping: Missing required destination fields');
                return new WP_Error('printful_shipping_error', __('Missing address information', 'printful-resources'));
            }
            
            // Create shipping data request
            $shipping_data = [
                'recipient' => [
                    'address1' => isset($package['destination']['address']) ? $package['destination']['address'] : '',
                    'address2' => isset($package['destination']['address_2']) ? $package['destination']['address_2'] : '',
                    'city' => isset($package['destination']['city']) ? $package['destination']['city'] : '',
                    'state_code' => isset($package['destination']['state']) ? $package['destination']['state'] : '',
                    'country_code' => $package['destination']['country'],
                    'zip' => $package['destination']['postcode'],
                ],
                'items' => $items,
            ];
            
            error_log('Printful_Shipping: Sending request to API with ' . count($items) . ' items');
            
            // Get shipping rates from Printful API
            $result = $this->api->calculate_shipping($shipping_data);
            
            if (is_wp_error($result)) {
                error_log('Printful_Shipping: API error - ' . $result->get_error_message());
                return $result;
            }
            
            if (!isset($result['result']) || !is_array($result['result'])) {
                error_log('Printful_Shipping: Invalid API response structure');
                return new WP_Error('printful_shipping_error', __('Invalid response from Printful API', 'printful-resources'));
            }
            
            error_log('Printful_Shipping: Received ' . count($result['result']) . ' shipping rates');
            
            return $result['result'];
        } catch (Exception $e) {
            error_log('Printful_Shipping: Exception in calculate_shipping_rates - ' . $e->getMessage());
            return new WP_Error('printful_shipping_error', __('Shipping calculation error', 'printful-resources'));
        }
    }

    /**
     * AJAX handler for calculating shipping rates
     */
    public function ajax_calculate_shipping() {
        try {
            error_log('Printful_Shipping: AJAX calculate shipping called');
            
            // Verify nonce
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
                error_log('Printful_Shipping: Security check failed');
                wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
            }
            
            // Get destination address
            $destination = [
                'address' => isset($_POST['address']) ? sanitize_text_field($_POST['address']) : '',
                'address_2' => isset($_POST['address_2']) ? sanitize_text_field($_POST['address_2']) : '',
                'city' => isset($_POST['city']) ? sanitize_text_field($_POST['city']) : '',
                'state' => isset($_POST['state']) ? sanitize_text_field($_POST['state']) : '',
                'country' => isset($_POST['country']) ? sanitize_text_field($_POST['country']) : '',
                'postcode' => isset($_POST['postcode']) ? sanitize_text_field($_POST['postcode']) : '',
            ];
            
            // Check required fields
            if (empty($destination['country']) || empty($destination['postcode'])) {
                error_log('Printful_Shipping: Missing required address fields in AJAX request');
                wp_send_json_error(['message' => __('Country and postal code are required', 'printful-resources')]);
            }
            
            // Get cart contents
            $contents = [];
            
            if (isset($_POST['cart_items']) && is_array($_POST['cart_items'])) {
                foreach ($_POST['cart_items'] as $item) {
                    $product_id = isset($item['product_id']) ? intval($item['product_id']) : 0;
                    $variation_id = isset($item['variation_id']) ? intval($item['variation_id']) : 0;
                    $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;
                    
                    if ($product_id) {
                        $contents[] = [
                            'product_id' => $product_id,
                            'variation_id' => $variation_id,
                            'quantity' => $quantity,
                        ];
                    }
                }
            }
            
            if (empty($contents)) {
                error_log('Printful_Shipping: No cart contents in AJAX request');
                wp_send_json_error(['message' => __('No items in cart', 'printful-resources')]);
            }
            
            // Create package
            $package = [
                'destination' => $destination,
                'contents' => $contents,
            ];
            
            // Calculate shipping rates
            $rates = $this->calculate_shipping_rates($package);
            
            if (is_wp_error($rates)) {
                error_log('Printful_Shipping: Error in AJAX calculation - ' . $rates->get_error_message());
                wp_send_json_error(['message' => $rates->get_error_message()]);
            } else {
                error_log('Printful_Shipping: AJAX calculation successful - ' . count($rates) . ' rates returned');
                wp_send_json_success(['rates' => $rates]);
            }
        } catch (Exception $e) {
            error_log('Printful_Shipping: Exception in ajax_calculate_shipping - ' . $e->getMessage());
            wp_send_json_error(['message' => __('An error occurred while calculating shipping rates', 'printful-resources')]);
        }
    }
} 