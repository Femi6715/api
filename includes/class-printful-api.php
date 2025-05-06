<?php
/**
 * Printful API Handler
 *
 * @package Printful_Resources
 */

if (!defined('WPINC')) {
    die;
}

// Ensure WP_Error exists
if (!class_exists('WP_Error')) {
    require_once ABSPATH . WPINC . '/class-wp-error.php';
}

/**
 * Class Printful_API
 * Handles all API communications with Printful
 */
class Printful_API {
    /**
     * API endpoint
     *
     * @var string
     */
    private $api_endpoint = 'https://api.printful.com/';

    /**
     * API key
     *
     * @var string
     */
    private $api_key;

    /**
     * Constructor
     */
    public function __construct() {
        try {
            // Default API key no longer used - specific scopes are preferred
            $this->api_key = '';
            error_log('Printful_API: Initialized (API keys will be selected based on request type)');
        } catch (Exception $e) {
            error_log('Printful_API: Constructor error - ' . $e->getMessage());
            $this->api_key = '';
        }
    }

    /**
     * Set API key directly
     * 
     * @param string $api_key API key to set.
     */
    public function set_api_key($api_key) {
        $this->api_key = $api_key;
    }

    /**
     * Get the appropriate API key for the requested endpoint
     *
     * @param string $endpoint The API endpoint being requested.
     * @return string The API key for the appropriate scope.
     */
    private function get_api_key_for_endpoint($endpoint) {
        // If API key is already set (for testing purposes), use it
        if (!empty($this->api_key)) {
            error_log('Printful_API: Using pre-set API key');
            return $this->api_key;
        }
        
        $api_key = '';
        
        // Determine which key to use based on the endpoint
        if (strpos($endpoint, 'store') === 0) {
            $api_key = get_option('printful_resources_api_key_stores', '');
            error_log('Printful_API: Using stores API key for endpoint: ' . $endpoint);
        } elseif (strpos($endpoint, 'products') === 0 || strpos($endpoint, 'store/products') === 0) {
            $api_key = get_option('printful_resources_api_key_products', '');
            error_log('Printful_API: Using products API key for endpoint: ' . $endpoint);
        } elseif (strpos($endpoint, 'orders') === 0 || strpos($endpoint, 'store/orders') === 0) {
            $api_key = get_option('printful_resources_api_key_orders', '');
            error_log('Printful_API: Using orders API key for endpoint: ' . $endpoint);
        } elseif (strpos($endpoint, 'shipping') === 0) {
            $api_key = get_option('printful_resources_api_key_shipping', '');
            error_log('Printful_API: Using shipping API key for endpoint: ' . $endpoint);
        } elseif (strpos($endpoint, 'webhooks') === 0) {
            $api_key = get_option('printful_resources_api_key_webhooks', '');
            error_log('Printful_API: Using webhooks API key for endpoint: ' . $endpoint);
        } else {
            // Default to stores key for general requests
            $api_key = get_option('printful_resources_api_key_stores', '');
            error_log('Printful_API: Using default stores API key for endpoint: ' . $endpoint);
        }
        
        // If no specific key found, try using a general API key
        if (empty($api_key)) {
            $api_key = get_option('printful_resources_api_key', '');
            error_log('Printful_API: No specific key found, using general API key');
        }
        
        // Check if we have any key
        if (empty($api_key)) {
            error_log('Printful_API: No API key available for endpoint: ' . $endpoint);
        }
        
        return $api_key;
    }

    /**
     * Make an API request to Printful
     *
     * @param string $endpoint Endpoint to call.
     * @param string $method HTTP method (GET, POST, PUT, DELETE).
     * @param array $data Data to send.
     * @return array|WP_Error
     */
    public function request($endpoint, $method = 'GET', $data = []) {
        try {
            // Get the appropriate API key for this endpoint
            $api_key = $this->get_api_key_for_endpoint($endpoint);
            
            if (empty($api_key)) {
                error_log('Printful_API: API key not set for request to ' . $endpoint);
                return new WP_Error('printful_api_error', __('API key not set for this endpoint type', 'printful-resources'));
            }
            
            // Validate endpoint
            if (empty($endpoint)) {
                error_log('Printful_API: Empty endpoint provided');
                return new WP_Error('printful_api_error', __('Invalid endpoint', 'printful-resources'));
            }

            // Build URL
            $url = $this->api_endpoint . trim($endpoint, '/');
            
            // Validate method
            $valid_methods = ['GET', 'POST', 'PUT', 'DELETE'];
            if (!in_array($method, $valid_methods)) {
                error_log('Printful_API: Invalid method ' . $method);
                $method = 'GET'; // Default to GET as fallback
            }
            
            error_log('Printful_API: Preparing ' . $method . ' request to ' . $url);
            
            // Handle authentication - always use Bearer format for OAuth 2.0 tokens
            $auth_token = $api_key;
            if (strpos($auth_token, 'Bearer ') !== 0) {
                // If it doesn't already have Bearer prefix, add it
                $auth_token = 'Bearer ' . $auth_token;
                error_log('Printful_API: Using Bearer authentication');
            }
            
            $args = [
                'method' => $method,
                'headers' => [
                    'Authorization' => $auth_token,
                    'Content-Type' => 'application/json',
                    'User-Agent' => 'Printful WooCommerce Integration/' . PRINTFUL_RESOURCES_VERSION,
                ],
                'timeout' => 30,
                'sslverify' => true,
            ];

            if (!empty($data) && in_array($method, ['POST', 'PUT'])) {
                $args['body'] = json_encode($data);
                error_log('Printful_API: Request with data: ' . json_encode($data));
            }

            // Make the request with error handling
            $response = wp_remote_request($url, $args);

            if (is_wp_error($response)) {
                error_log('Printful_API: WP_Error in request - ' . $response->get_error_message());
                return $response;
            }

            $body = wp_remote_retrieve_body($response);
            $code = wp_remote_retrieve_response_code($response);

            if (empty($body)) {
                error_log('Printful_API: Empty response body from ' . $url);
                return new WP_Error('printful_api_error', __('Empty response from API', 'printful-resources'));
            }

            $result = json_decode($body, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('Printful_API: JSON decode error for response: ' . substr($body, 0, 100) . '...');
                return new WP_Error('printful_api_error', __('Invalid JSON response', 'printful-resources'));
            }

            if ($code < 200 || $code >= 300) {
                $message = isset($result['error']['message']) ? $result['error']['message'] : __('Unknown error', 'printful-resources');
                $code_message = isset($result['error']['code']) ? ' (Code: ' . $result['error']['code'] . ')' : '';
                $error_message = $message . $code_message;
                
                error_log('Printful_API: Error response (code ' . $code . ') - ' . $error_message);
                return new WP_Error('printful_api_error', $error_message, ['status' => $code]);
            }

            error_log('Printful_API: Successful request to ' . $endpoint);
            return $result;
        } catch (Exception $e) {
            error_log('Printful_API: Exception in request method - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('API request failed', 'printful-resources'));
        }
    }

    /**
     * Get store information
     *
     * @return array|WP_Error
     */
    public function get_store_info() {
        try {
            error_log('Printful_API: Getting store info');
            return $this->request('store');
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_store_info - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get store info', 'printful-resources'));
        }
    }

    /**
     * Get products from Printful
     *
     * @param int $offset Offset for pagination.
     * @param int $limit Limit for pagination.
     * @return array|WP_Error
     */
    public function get_products($offset = 0, $limit = 100) {
        try {
            // Validate parameters
            $offset = max(0, intval($offset));
            $limit = max(1, min(100, intval($limit)));
            
            error_log('Printful_API: Getting products (offset: ' . $offset . ', limit: ' . $limit . ')');
            return $this->request(sprintf('store/products?offset=%d&limit=%d', $offset, $limit));
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_products - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get products', 'printful-resources'));
        }
    }

    /**
     * Get a single product
     *
     * @param int $product_id Printful product ID.
     * @return array|WP_Error
     */
    public function get_product($product_id) {
        try {
            if (empty($product_id) || !is_numeric($product_id)) {
                error_log('Printful_API: Invalid product ID: ' . $product_id);
                return new WP_Error('printful_api_error', __('Invalid product ID', 'printful-resources'));
            }
            
            error_log('Printful_API: Getting product ' . $product_id);
            return $this->request('store/products/' . $product_id);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_product - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get product', 'printful-resources'));
        }
    }

    /**
     * Create a product in Printful
     *
     * @param array $product_data Product data.
     * @return array|WP_Error
     */
    public function create_product($product_data) {
        try {
            if (empty($product_data) || !is_array($product_data)) {
                error_log('Printful_API: Invalid product data for create_product');
                return new WP_Error('printful_api_error', __('Invalid product data', 'printful-resources'));
            }
            
            error_log('Printful_API: Creating product');
            return $this->request('store/products', 'POST', $product_data);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in create_product - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to create product', 'printful-resources'));
        }
    }

    /**
     * Update a product in Printful
     *
     * @param int $product_id Printful product ID.
     * @param array $product_data Product data.
     * @return array|WP_Error
     */
    public function update_product($product_id, $product_data) {
        try {
            if (empty($product_id) || !is_numeric($product_id)) {
                error_log('Printful_API: Invalid product ID for update: ' . $product_id);
                return new WP_Error('printful_api_error', __('Invalid product ID', 'printful-resources'));
            }
            
            if (empty($product_data) || !is_array($product_data)) {
                error_log('Printful_API: Invalid product data for update_product');
                return new WP_Error('printful_api_error', __('Invalid product data', 'printful-resources'));
            }
            
            error_log('Printful_API: Updating product ' . $product_id);
            return $this->request('store/products/' . $product_id, 'PUT', $product_data);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in update_product - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to update product', 'printful-resources'));
        }
    }

    /**
     * Delete a product from Printful
     *
     * @param int $product_id Printful product ID.
     * @return array|WP_Error
     */
    public function delete_product($product_id) {
        try {
            if (empty($product_id) || !is_numeric($product_id)) {
                error_log('Printful_API: Invalid product ID for deletion: ' . $product_id);
                return new WP_Error('printful_api_error', __('Invalid product ID', 'printful-resources'));
            }
            
            error_log('Printful_API: Deleting product ' . $product_id);
            return $this->request('store/products/' . $product_id, 'DELETE');
        } catch (Exception $e) {
            error_log('Printful_API: Exception in delete_product - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to delete product', 'printful-resources'));
        }
    }

    /**
     * Get orders from Printful
     *
     * @param int $offset Offset for pagination.
     * @param int $limit Limit for pagination.
     * @param string $status Status filter.
     * @return array|WP_Error
     */
    public function get_orders($offset = 0, $limit = 100, $status = '') {
        try {
            // Validate parameters
            $offset = max(0, intval($offset));
            $limit = max(1, min(100, intval($limit)));
            
            $query = sprintf('orders?offset=%d&limit=%d', $offset, $limit);
            
            if (!empty($status)) {
                $query .= '&status=' . urlencode($status);
            }
            
            error_log('Printful_API: Getting orders with query: ' . $query);
            return $this->request($query);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_orders - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get orders', 'printful-resources'));
        }
    }

    /**
     * Get a single order
     *
     * @param int $order_id Printful order ID.
     * @return array|WP_Error
     */
    public function get_order($order_id) {
        try {
            if (empty($order_id) || !is_numeric($order_id)) {
                error_log('Printful_API: Invalid order ID: ' . $order_id);
                return new WP_Error('printful_api_error', __('Invalid order ID', 'printful-resources'));
            }
            
            error_log('Printful_API: Getting order ' . $order_id);
            return $this->request('orders/' . $order_id);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_order - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get order', 'printful-resources'));
        }
    }

    /**
     * Create an order in Printful
     *
     * @param array $order_data Order data.
     * @return array|WP_Error
     */
    public function create_order($order_data) {
        try {
            if (empty($order_data) || !is_array($order_data)) {
                error_log('Printful_API: Invalid order data for create_order');
                return new WP_Error('printful_api_error', __('Invalid order data', 'printful-resources'));
            }
            
            error_log('Printful_API: Creating order');
            return $this->request('orders', 'POST', $order_data);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in create_order - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to create order', 'printful-resources'));
        }
    }

    /**
     * Update an order in Printful
     *
     * @param int $order_id Printful order ID.
     * @param array $order_data Order data.
     * @return array|WP_Error
     */
    public function update_order($order_id, $order_data) {
        try {
            if (empty($order_id) || !is_numeric($order_id)) {
                error_log('Printful_API: Invalid order ID for update: ' . $order_id);
                return new WP_Error('printful_api_error', __('Invalid order ID', 'printful-resources'));
            }
            
            if (empty($order_data) || !is_array($order_data)) {
                error_log('Printful_API: Invalid order data for update_order');
                return new WP_Error('printful_api_error', __('Invalid order data', 'printful-resources'));
            }
            
            error_log('Printful_API: Updating order ' . $order_id);
            return $this->request('orders/' . $order_id, 'PUT', $order_data);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in update_order - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to update order', 'printful-resources'));
        }
    }

    /**
     * Cancel an order in Printful
     *
     * @param int $order_id Printful order ID.
     * @return array|WP_Error
     */
    public function cancel_order($order_id) {
        try {
            if (empty($order_id) || !is_numeric($order_id)) {
                error_log('Printful_API: Invalid order ID for cancellation: ' . $order_id);
                return new WP_Error('printful_api_error', __('Invalid order ID', 'printful-resources'));
            }
            
            error_log('Printful_API: Cancelling order ' . $order_id);
            return $this->request('orders/' . $order_id . '/cancel', 'POST');
        } catch (Exception $e) {
            error_log('Printful_API: Exception in cancel_order - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to cancel order', 'printful-resources'));
        }
    }

    /**
     * Calculate shipping rates
     *
     * @param array $shipping_data Shipping data.
     * @return array|WP_Error
     */
    public function calculate_shipping($shipping_data) {
        try {
            if (empty($shipping_data) || !is_array($shipping_data)) {
                error_log('Printful_API: Invalid shipping data for calculate_shipping');
                return new WP_Error('printful_api_error', __('Invalid shipping data', 'printful-resources'));
            }
            
            // Validate required fields
            if (empty($shipping_data['recipient']) || empty($shipping_data['items'])) {
                error_log('Printful_API: Missing required fields in shipping data');
                return new WP_Error('printful_api_error', __('Missing recipient or items data', 'printful-resources'));
            }
            
            // Check recipient has required fields
            $recipient = $shipping_data['recipient'];
            if (empty($recipient['country_code']) || empty($recipient['zip'])) {
                error_log('Printful_API: Missing required recipient fields (country_code, zip)');
                return new WP_Error('printful_api_error', __('Missing recipient country or zip code', 'printful-resources'));
            }
            
            error_log('Printful_API: Calculating shipping for ' . count($shipping_data['items']) . ' items to ' . $recipient['country_code']);
            return $this->request('shipping/rates', 'POST', $shipping_data);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in calculate_shipping - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to calculate shipping rates', 'printful-resources'));
        }
    }

    /**
     * Get webhook configuration
     *
     * @return array|WP_Error
     */
    public function get_webhooks() {
        try {
            error_log('Printful_API: Getting webhooks');
            return $this->request('webhooks');
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_webhooks - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get webhooks', 'printful-resources'));
        }
    }

    /**
     * Configure webhooks
     *
     * @param string $url Webhook URL.
     * @param array $events Event types to subscribe to.
     * @return array|WP_Error
     */
    public function configure_webhooks($url, $events = []) {
        try {
            if (empty($url)) {
                error_log('Printful_API: Invalid webhook URL');
                return new WP_Error('printful_api_error', __('Invalid webhook URL', 'printful-resources'));
            }
            
            $data = [
                'url' => $url,
                'types' => !empty($events) ? $events : ['package_shipped', 'order_created', 'order_failed'],
            ];
            
            error_log('Printful_API: Configuring webhooks for URL: ' . $url);
            return $this->request('webhooks', 'POST', $data);
        } catch (Exception $e) {
            error_log('Printful_API: Exception in configure_webhooks - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to configure webhooks', 'printful-resources'));
        }
    }

    /**
     * Get tax rates
     *
     * @return array|WP_Error
     */
    public function get_tax_rates() {
        try {
            error_log('Printful_API: Getting tax rates');
            return $this->request('tax/rates');
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_tax_rates - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get tax rates', 'printful-resources'));
        }
    }

    /**
     * Get available products (catalog)
     *
     * @param int $offset Offset for pagination.
     * @param int $limit Limit for pagination.
     * @return array|WP_Error
     */
    public function get_catalog($offset = 0, $limit = 100) {
        try {
            // Validate parameters
            $offset = max(0, intval($offset));
            $limit = max(1, min(100, intval($limit)));
            
            error_log('Printful_API: Getting catalog (offset: ' . $offset . ', limit: ' . $limit . ')');
            return $this->request(sprintf('products?offset=%d&limit=%d', $offset, $limit));
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_catalog - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get catalog', 'printful-resources'));
        }
    }

    /**
     * Get variants for a catalog product
     *
     * @param int $product_id Catalog product ID.
     * @return array|WP_Error
     */
    public function get_product_variants($product_id) {
        try {
            if (empty($product_id) || !is_numeric($product_id)) {
                error_log('Printful_API: Invalid product ID for variants: ' . $product_id);
                return new WP_Error('printful_api_error', __('Invalid product ID', 'printful-resources'));
            }
            
            error_log('Printful_API: Getting variants for product ' . $product_id);
            return $this->request('products/' . $product_id . '/variants');
        } catch (Exception $e) {
            error_log('Printful_API: Exception in get_product_variants - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Failed to get product variants', 'printful-resources'));
        }
    }
    
    /**
     * Test the API connection
     * 
     * @return bool|WP_Error Returns true if connection is successful, WP_Error on failure
     */
    public function test_connection() {
        try {
            if (empty($this->api_key)) {
                error_log('Printful_API: Cannot test connection - API key not set');
                return new WP_Error('printful_api_error', __('API key not set', 'printful-resources'));
            }
            
            error_log('Printful_API: Testing connection to Printful API');
            $result = $this->get_store_info();
            
            if (is_wp_error($result)) {
                error_log('Printful_API: Connection test failed - ' . $result->get_error_message());
                return $result;
            }
            
            if (!isset($result['result']) || empty($result['result'])) {
                error_log('Printful_API: Connection test failed - Invalid response format');
                return new WP_Error('printful_api_error', __('Invalid API response format', 'printful-resources'));
            }
            
            error_log('Printful_API: Connection test successful');
            return true;
        } catch (Exception $e) {
            error_log('Printful_API: Exception in test_connection - ' . $e->getMessage());
            return new WP_Error('printful_api_error', __('Connection test failed', 'printful-resources'));
        }
    }
} 