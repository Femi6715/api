<?php
/**
 * Printful Shipping Method
 *
 * @package Printful_Resources
 */

if (!defined('WPINC')) {
    die;
}

// Check for WooCommerce shipping class existence
if (!class_exists('WC_Shipping_Method')) {
    error_log('Printful Resources: WC_Shipping_Method class not found');
    return; // Exit without defining the class to prevent fatal errors
}

/**
 * Class Printful_Shipping_Method
 * WooCommerce shipping method implementation for Printful
 */
class Printful_Shipping_Method extends WC_Shipping_Method {
    /**
     * Printful API instance
     *
     * @var Printful_API
     */
    private $api;

    /**
     * Constructor
     *
     * @param int $instance_id Instance ID.
     */
    public function __construct($instance_id = 0) {
        try {
            $this->id = 'printful';
            $this->instance_id = absint($instance_id);
            $this->method_title = __('Printful Shipping', 'printful-resources');
            $this->method_description = __('Provides shipping rates from Printful.', 'printful-resources');
            $this->supports = [
                'shipping-zones',
                'instance-settings',
            ];
            
            $this->init();
            
            // Get the API from global if available, otherwise we'll use it when calculate_shipping is called
            global $printful_api_instance;
            if (isset($printful_api_instance) && is_object($printful_api_instance) && method_exists($printful_api_instance, 'request')) {
                $this->api = $printful_api_instance;
                error_log('Printful Shipping Method: API instance set from global');
            } else {
                error_log('Printful Shipping Method: No global API instance found');
            }
        } catch (Exception $e) {
            error_log('Printful Shipping Method constructor error: ' . $e->getMessage());
        }
    }

    /**
     * Initialize settings
     */
    public function init() {
        try {
            // Load the settings API
            $this->init_form_fields();
            $this->init_settings();
            
            // Get settings
            $this->title = $this->get_option('title', $this->method_title);
            $this->enabled = $this->get_option('enabled', 'yes');
            $this->tax_status = $this->get_option('tax_status', 'taxable');
            $this->fallback_method = $this->get_option('fallback_method', 'flat_rate');
            $this->fallback_cost = $this->get_option('fallback_cost', '10.00');
            
            // Save settings
            add_action('woocommerce_update_options_shipping_' . $this->id, [$this, 'process_admin_options']);
        } catch (Exception $e) {
            error_log('Printful Shipping Method init error: ' . $e->getMessage());
        }
    }

    /**
     * Set API instance
     *
     * @param Printful_API $api API instance.
     */
    public function set_api($api) {
        if (is_object($api) && method_exists($api, 'request')) {
            $this->api = $api;
            error_log('Printful Shipping Method: API instance manually set');
            return true;
        } else {
            error_log('Printful Shipping Method: Invalid API instance provided');
            return false;
        }
    }

    /**
     * Initialize form fields
     */
    public function init_form_fields() {
        $this->instance_form_fields = [
            'title' => [
                'title' => __('Title', 'printful-resources'),
                'type' => 'text',
                'description' => __('This controls the title which the user sees during checkout.', 'printful-resources'),
                'default' => $this->method_title,
                'desc_tip' => true,
            ],
            'tax_status' => [
                'title' => __('Tax Status', 'printful-resources'),
                'type' => 'select',
                'description' => __('Set whether or not the shipping cost is taxable.', 'printful-resources'),
                'default' => 'taxable',
                'options' => [
                    'taxable' => __('Taxable', 'printful-resources'),
                    'none' => __('Not taxable', 'printful-resources'),
                ],
                'desc_tip' => true,
            ],
            'fallback_method' => [
                'title' => __('Fallback Method', 'printful-resources'),
                'type' => 'select',
                'description' => __('If Printful cannot calculate rates, use this method.', 'printful-resources'),
                'default' => 'flat_rate',
                'options' => [
                    'flat_rate' => __('Flat Rate', 'printful-resources'),
                    'free' => __('Free Shipping', 'printful-resources'),
                    'disable' => __('Disable Shipping Method', 'printful-resources'),
                ],
                'desc_tip' => true,
            ],
            'fallback_cost' => [
                'title' => __('Fallback Cost', 'printful-resources'),
                'type' => 'price',
                'description' => __('If using flat rate as fallback, this will be the cost.', 'printful-resources'),
                'default' => '10.00',
                'desc_tip' => true,
            ],
        ];
    }

    /**
     * Calculate shipping
     *
     * @param array $package Package information.
     */
    public function calculate_shipping($package = []) {
        try {
            if (empty($package['contents'])) {
                error_log('Printful Shipping Method: Empty package contents');
                return;
            }
            
            // If API isn't set yet, try to get it
            if (!$this->api) {
                global $printful_api_instance;
                if (isset($printful_api_instance) && is_object($printful_api_instance) && method_exists($printful_api_instance, 'request')) {
                    $this->api = $printful_api_instance;
                    error_log('Printful Shipping Method: API instance set from global during calculate_shipping');
                } else {
                    error_log('Printful Shipping Method: No API available for calculate_shipping');
                    // No API available, use fallback
                    $this->use_fallback_shipping($package);
                    return;
                }
            }
            
            // Check if package contains Printful products
            $has_printful_items = false;
            $items = [];
            
            foreach ($package['contents'] as $item) {
                $product_id = isset($item['product_id']) ? $item['product_id'] : 0;
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
                error_log('Printful Shipping Method: No Printful items in package');
                // No Printful items in package
                return;
            }
            
            // Validate destination
            if (empty($package['destination']) || 
                empty($package['destination']['country']) ||
                empty($package['destination']['postcode'])) {
                error_log('Printful Shipping Method: Incomplete destination data');
                $this->use_fallback_shipping($package);
                return;
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
            
            // Get shipping rates from Printful API
            try {
                error_log('Printful Shipping Method: Calculating shipping rates for ' . count($items) . ' items to ' . $package['destination']['country']);
                $response = $this->api->calculate_shipping($shipping_data);
                
                if (is_wp_error($response)) {
                    error_log('Printful Shipping Method: API error - ' . $response->get_error_message());
                    $this->use_fallback_shipping($package);
                    return;
                }
                
                if (!isset($response['result']) || !is_array($response['result'])) {
                    error_log('Printful Shipping Method: Invalid API response format');
                    $this->use_fallback_shipping($package);
                    return;
                }
                
                $rates = $response['result'];
                
                if (empty($rates)) {
                    error_log('Printful Shipping Method: No rates returned from API');
                    // No rates returned, use fallback
                    $this->use_fallback_shipping($package);
                    return;
                }
                
                // Add each rate from Printful as a shipping rate
                foreach ($rates as $rate) {
                    if (!isset($rate['id']) || !isset($rate['name']) || !isset($rate['rate'])) {
                        error_log('Printful Shipping Method: Incomplete rate data: ' . json_encode($rate));
                        continue;
                    }
                    
                    $rate_id = $this->get_rate_id($rate['id']);
                    $rate_label = $rate['name'];
                    $rate_cost = $rate['rate'];
                    
                    $this->add_rate([
                        'id' => $rate_id,
                        'label' => $rate_label,
                        'cost' => $rate_cost,
                        'calc_tax' => 'per_order',
                    ]);
                    
                    error_log('Printful Shipping Method: Added rate - ' . $rate_label . ' ($' . $rate_cost . ')');
                }
            } catch (Exception $e) {
                error_log('Printful Shipping Method: Exception during API call - ' . $e->getMessage());
                // Use fallback in case of any exception
                $this->use_fallback_shipping($package);
            }
        } catch (Exception $e) {
            error_log('Printful Shipping Method: Exception in calculate_shipping - ' . $e->getMessage());
            try {
                $this->use_fallback_shipping($package);
            } catch (Exception $inner_e) {
                error_log('Printful Shipping Method: Exception in fallback shipping - ' . $inner_e->getMessage());
            }
        }
    }

    /**
     * Use fallback shipping method
     *
     * @param array $package Package information.
     */
    private function use_fallback_shipping($package) {
        try {
            error_log('Printful Shipping Method: Using fallback shipping method: ' . $this->fallback_method);
            
            switch ($this->fallback_method) {
                case 'flat_rate':
                    $this->add_rate([
                        'id' => $this->get_rate_id('fallback'),
                        'label' => __('Standard Shipping', 'printful-resources'),
                        'cost' => $this->fallback_cost,
                        'calc_tax' => 'per_order',
                    ]);
                    error_log('Printful Shipping Method: Added fallback flat rate - cost: ' . $this->fallback_cost);
                    break;
                    
                case 'free':
                    $this->add_rate([
                        'id' => $this->get_rate_id('free'),
                        'label' => __('Free Shipping', 'printful-resources'),
                        'cost' => 0,
                        'calc_tax' => 'per_order',
                    ]);
                    error_log('Printful Shipping Method: Added fallback free shipping');
                    break;
                    
                case 'disable':
                    // Do nothing, method will be disabled
                    error_log('Printful Shipping Method: Fallback disabled, no rates added');
                    break;
                
                default:
                    // Use flat rate as default fallback
                    $this->add_rate([
                        'id' => $this->get_rate_id('fallback'),
                        'label' => __('Standard Shipping', 'printful-resources'),
                        'cost' => $this->fallback_cost,
                        'calc_tax' => 'per_order',
                    ]);
                    error_log('Printful Shipping Method: Added default fallback rate');
                    break;
            }
        } catch (Exception $e) {
            error_log('Printful Shipping Method: Exception in use_fallback_shipping - ' . $e->getMessage());
        }
    }

    /**
     * Generate rate ID
     *
     * @param string $suffix Rate ID suffix.
     * @return string Full rate ID.
     */
    public function get_rate_id($suffix = '') {
        try {
            return $this->id . ':' . $suffix;
        } catch (Exception $e) {
            error_log('Printful Shipping Method: Exception in get_rate_id - ' . $e->getMessage());
            return 'printful:error';
        }
    }
} 