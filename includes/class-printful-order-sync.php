<?php
/**
 * Printful Order Synchronization
 *
 * @package Printful_Resources
 */

if (!defined('WPINC')) {
    die;
}

/**
 * Class Printful_Order_Sync
 * Handles order synchronization between WooCommerce and Printful
 */
class Printful_Order_Sync {
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
        $this->api = $api;
        
        // Add hooks for order synchronization
        add_action('woocommerce_checkout_order_processed', [$this, 'create_printful_order'], 10, 3);
        add_action('woocommerce_order_status_changed', [$this, 'update_printful_order_status'], 10, 4);
        add_action('woocommerce_order_refunded', [$this, 'handle_order_refund'], 10, 2);
        
        // Add webhook listener
        add_action('rest_api_init', [$this, 'register_webhook_endpoint']);
        
        // Add metabox to order page
        add_action('add_meta_boxes', [$this, 'add_order_meta_box'], 10);

        // Periodic sync check
        add_action('printful_resources_order_sync', [$this, 'sync_order_statuses']);
        
        // Schedule order status sync if not already scheduled
        if (!wp_next_scheduled('printful_resources_order_sync')) {
            wp_schedule_event(time(), 'hourly', 'printful_resources_order_sync');
        }
    }

    /**
     * Create a Printful order when a WooCommerce order is placed
     *
     * @param int $order_id Order ID.
     * @param array $posted_data Posted data.
     * @param WC_Order $order Order object.
     */
    public function create_printful_order($order_id, $posted_data, $order) {
        // Check if auto fulfillment is enabled
        $auto_fulfill = get_option('printful_resources_auto_fulfill', 'yes');
        
        if ($auto_fulfill !== 'yes') {
            return;
        }
        
        // Check if order payment is complete
        if ($order->get_status() !== 'processing' && $order->get_status() !== 'completed') {
            return;
        }
        
        // Get order items
        $items = $order->get_items();
        $printful_items = [];
        $has_printful_items = false;
        
        // Check if order contains Printful products
        foreach ($items as $item) {
            $product_id = $item->get_product_id();
            $variation_id = $item->get_variation_id();
            $target_id = $variation_id ? $variation_id : $product_id;
            
            $printful_variant_id = get_post_meta($target_id, '_printful_variant_id', true);
            
            if ($printful_variant_id) {
                $has_printful_items = true;
                
                $printful_items[] = [
                    'sync_variant_id' => (int) $printful_variant_id,
                    'quantity' => $item->get_quantity(),
                    'retail_price' => $order->get_item_total($item, false),
                    'name' => $item->get_name(),
                    'sku' => get_post_meta($target_id, '_sku', true),
                ];
            }
        }
        
        if (!$has_printful_items) {
            return;
        }
        
        // Get shipping information
        $shipping_address = [
            'name' => $order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name(),
            'company' => $order->get_shipping_company(),
            'address1' => $order->get_shipping_address_1(),
            'address2' => $order->get_shipping_address_2(),
            'city' => $order->get_shipping_city(),
            'state_code' => $order->get_shipping_state(),
            'country_code' => $order->get_shipping_country(),
            'zip' => $order->get_shipping_postcode(),
            'phone' => $order->get_billing_phone(),
            'email' => $order->get_billing_email(),
        ];
        
        // Create Printful order data
        $printful_order_data = [
            'external_id' => $order->get_order_number(),
            'shipping' => 'STANDARD',
            'recipient' => $shipping_address,
            'items' => $printful_items,
            'retail_costs' => [
                'subtotal' => $order->get_subtotal(),
                'discount' => $order->get_discount_total(),
                'shipping' => $order->get_shipping_total(),
                'tax' => $order->get_total_tax(),
            ],
        ];
        
        // Send order to Printful
        $response = $this->api->create_order($printful_order_data);
        
        if (is_wp_error($response)) {
            // Log error
            $order->add_order_note(sprintf(
                __('Error creating Printful order: %s', 'printful-resources'),
                $response->get_error_message()
            ));
            return;
        }
        
        // Store Printful order ID in the WooCommerce order
        if (isset($response['result']['id'])) {
            $printful_order_id = $response['result']['id'];
            update_post_meta($order_id, '_printful_order_id', $printful_order_id);
            update_post_meta($order_id, '_printful_order_data', $response['result']);
            update_post_meta($order_id, '_printful_order_status', $response['result']['status']);
            
            $order->add_order_note(sprintf(
                __('Printful order created. Order ID: %s', 'printful-resources'),
                $printful_order_id
            ));
        }
    }

    /**
     * Update a Printful order when a WooCommerce order status changes
     *
     * @param int $order_id Order ID.
     * @param string $from_status Previous status.
     * @param string $to_status New status.
     * @param WC_Order $order Order object.
     */
    public function update_printful_order_status($order_id, $from_status, $to_status, $order) {
        $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
        
        if (!$printful_order_id) {
            // If the order wasn't previously sent to Printful but is now eligible
            if (($to_status === 'processing' || $to_status === 'completed') && $from_status !== 'processing' && $from_status !== 'completed') {
                $this->create_printful_order($order_id, [], $order);
            }
            return;
        }
        
        // Handle cancellation
        if ($to_status === 'cancelled') {
            $response = $this->api->cancel_order($printful_order_id);
            
            if (is_wp_error($response)) {
                $order->add_order_note(sprintf(
                    __('Error cancelling Printful order: %s', 'printful-resources'),
                    $response->get_error_message()
                ));
            } else {
                $order->add_order_note(__('Printful order cancelled', 'printful-resources'));
                update_post_meta($order_id, '_printful_order_status', 'canceled');
            }
        }
    }

    /**
     * Handle order refunds
     *
     * @param int $order_id Order ID.
     * @param int $refund_id Refund ID.
     */
    public function handle_order_refund($order_id, $refund_id) {
        $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
        
        if (!$printful_order_id) {
            return;
        }
        
        // Check refund policy
        $refund_action = get_option('printful_resources_refund_action', 'cancel');
        
        if ($refund_action === 'cancel') {
            $response = $this->api->cancel_order($printful_order_id);
            
            if (!is_wp_error($response)) {
                $order = wc_get_order($order_id);
                $order->add_order_note(__('Printful order cancelled due to refund', 'printful-resources'));
                update_post_meta($order_id, '_printful_order_status', 'canceled');
            }
        }
    }

    /**
     * Register webhook endpoint for Printful callbacks
     */
    public function register_webhook_endpoint() {
        register_rest_route('printful-resources/v1', '/webhook', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Handle webhook callbacks from Printful
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response Response object.
     */
    public function handle_webhook($request) {
        $payload = $request->get_json_params();
        
        if (empty($payload) || !isset($payload['type']) || !isset($payload['data'])) {
            return new WP_REST_Response(['status' => 'error', 'message' => 'Invalid payload'], 400);
        }
        
        // Log webhook
        $this->log_webhook($payload);
        
        $type = $payload['type'];
        $data = $payload['data'];
        
        switch ($type) {
            case 'package_shipped':
                $this->handle_package_shipped($data);
                break;
                
            case 'order_created':
                $this->handle_order_created($data);
                break;
                
            case 'order_failed':
                $this->handle_order_failed($data);
                break;
                
            case 'order_canceled':
                $this->handle_order_canceled($data);
                break;
                
            case 'order_put_hold':
                $this->handle_order_put_hold($data);
                break;
                
            case 'order_removed_hold':
                $this->handle_order_removed_hold($data);
                break;
        }
        
        return new WP_REST_Response(['status' => 'success'], 200);
    }

    /**
     * Log webhook data for debugging
     *
     * @param array $data Webhook data.
     */
    private function log_webhook($data) {
        $log_file = PRINTFUL_RESOURCES_PLUGIN_PATH . 'logs/webhook.log';
        $log_dir = dirname($log_file);
        
        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
        }
        
        $log_entry = '[' . date('Y-m-d H:i:s') . '] ' . json_encode($data) . PHP_EOL;
        file_put_contents($log_file, $log_entry, FILE_APPEND);
    }

    /**
     * Handle package shipped event
     *
     * @param array $data Event data.
     */
    private function handle_package_shipped($data) {
        if (!isset($data['order']['external_id'])) {
            return;
        }
        
        $order_number = $data['order']['external_id'];
        
        // Find WooCommerce order by order number
        $order_id = wc_get_order_id_by_order_number($order_number);
        
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return;
        }
        
        // Update order status
        $update_to_completed = get_option('printful_resources_shipped_status', 'completed');
        
        if ($update_to_completed === 'completed') {
            $order->update_status('completed', __('Order fulfilled and shipped by Printful', 'printful-resources'));
        } else {
            $order->add_order_note(sprintf(
                __('Order shipped by Printful. Tracking number: %s', 'printful-resources'),
                $data['tracking_number'] ?? __('Not provided', 'printful-resources')
            ));
        }
        
        // Store tracking information
        if (isset($data['tracking_number'])) {
            update_post_meta($order_id, '_printful_tracking_number', $data['tracking_number']);
            update_post_meta($order_id, '_printful_tracking_url', $data['tracking_url'] ?? '');
        }
        
        update_post_meta($order_id, '_printful_order_status', 'shipped');
    }

    /**
     * Handle order created event
     *
     * @param array $data Event data.
     */
    private function handle_order_created($data) {
        if (!isset($data['order']['external_id'])) {
            return;
        }
        
        $order_number = $data['order']['external_id'];
        $order_id = wc_get_order_id_by_order_number($order_number);
        
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return;
        }
        
        $order->add_order_note(__('Printful has received the order and will process it', 'printful-resources'));
        update_post_meta($order_id, '_printful_order_status', 'inprocess');
    }

    /**
     * Handle order failed event
     *
     * @param array $data Event data.
     */
    private function handle_order_failed($data) {
        if (!isset($data['order']['external_id'])) {
            return;
        }
        
        $order_number = $data['order']['external_id'];
        $order_id = wc_get_order_id_by_order_number($order_number);
        
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return;
        }
        
        $reason = $data['reason'] ?? __('Unknown reason', 'printful-resources');
        
        $order->add_order_note(sprintf(
            __('Printful order failed: %s', 'printful-resources'),
            $reason
        ));
        
        $on_fail_status = get_option('printful_resources_fail_status', 'on-hold');
        
        if ($on_fail_status !== 'none') {
            $order->update_status($on_fail_status);
        }
        
        update_post_meta($order_id, '_printful_order_status', 'failed');
    }

    /**
     * Handle order canceled event
     *
     * @param array $data Event data.
     */
    private function handle_order_canceled($data) {
        if (!isset($data['order']['external_id'])) {
            return;
        }
        
        $order_number = $data['order']['external_id'];
        $order_id = wc_get_order_id_by_order_number($order_number);
        
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return;
        }
        
        $order->add_order_note(__('Printful order has been canceled', 'printful-resources'));
        update_post_meta($order_id, '_printful_order_status', 'canceled');
    }

    /**
     * Handle order put on hold event
     *
     * @param array $data Event data.
     */
    private function handle_order_put_hold($data) {
        if (!isset($data['order']['external_id'])) {
            return;
        }
        
        $order_number = $data['order']['external_id'];
        $order_id = wc_get_order_id_by_order_number($order_number);
        
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return;
        }
        
        $reason = $data['reason'] ?? __('Unknown reason', 'printful-resources');
        
        $order->add_order_note(sprintf(
            __('Printful order put on hold: %s', 'printful-resources'),
            $reason
        ));
        
        $on_hold_status = get_option('printful_resources_hold_status', 'on-hold');
        
        if ($on_hold_status !== 'none') {
            $order->update_status($on_hold_status);
        }
        
        update_post_meta($order_id, '_printful_order_status', 'onhold');
    }

    /**
     * Handle order removed from hold event
     *
     * @param array $data Event data.
     */
    private function handle_order_removed_hold($data) {
        if (!isset($data['order']['external_id'])) {
            return;
        }
        
        $order_number = $data['order']['external_id'];
        $order_id = wc_get_order_id_by_order_number($order_number);
        
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return;
        }
        
        $order->add_order_note(__('Printful order removed from hold status', 'printful-resources'));
        update_post_meta($order_id, '_printful_order_status', 'inprocess');
        
        if ($order->get_status() === 'on-hold') {
            $order->update_status('processing');
        }
    }

    /**
     * Add meta box to order edit page
     */
    public function add_order_meta_box() {
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
        $order_id = $post->ID;
        $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
        
        if (!$printful_order_id) {
            echo '<p>' . __('This order has not been sent to Printful.', 'printful-resources') . '</p>';
            
            echo '<button type="button" class="button" id="send-to-printful" data-order-id="' . esc_attr($order_id) . '">';
            echo __('Send to Printful', 'printful-resources');
            echo '</button>';
            
            return;
        }
        
        $printful_status = get_post_meta($order_id, '_printful_order_status', true);
        $tracking_number = get_post_meta($order_id, '_printful_tracking_number', true);
        $tracking_url = get_post_meta($order_id, '_printful_tracking_url', true);
        
        echo '<p><strong>' . __('Printful Order ID:', 'printful-resources') . '</strong> ' . esc_html($printful_order_id) . '</p>';
        echo '<p><strong>' . __('Status:', 'printful-resources') . '</strong> ' . esc_html($this->get_printful_status_label($printful_status)) . '</p>';
        
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
        
        // Add JavaScript for button actions
        ?>
        <script type="text/javascript">
            jQuery(document).ready(function($) {
                $('#send-to-printful').on('click', function() {
                    let orderId = $(this).data('order-id');
                    // AJAX call to send order to Printful
                });
                
                $('#cancel-printful-order').on('click', function() {
                    let orderId = $(this).data('order-id');
                    // AJAX call to cancel Printful order
                });
                
                $('#refresh-printful-status').on('click', function() {
                    let orderId = $(this).data('order-id');
                    // AJAX call to refresh status
                });
            });
        </script>
        <?php
    }

    /**
     * Get a readable label for Printful order status
     *
     * @param string $status Status code.
     * @return string Status label.
     */
    private function get_printful_status_label($status) {
        $labels = [
            'draft' => __('Draft', 'printful-resources'),
            'pending' => __('Pending', 'printful-resources'),
            'inprocess' => __('In Process', 'printful-resources'),
            'onhold' => __('On Hold', 'printful-resources'),
            'failed' => __('Failed', 'printful-resources'),
            'canceled' => __('Canceled', 'printful-resources'),
            'shipped' => __('Shipped', 'printful-resources'),
            'fulfilled' => __('Fulfilled', 'printful-resources'),
        ];
        
        return isset($labels[$status]) ? $labels[$status] : $status;
    }

    /**
     * Sync order statuses from Printful
     */
    public function sync_order_statuses() {
        // Get WooCommerce orders with Printful IDs
        $args = [
            'post_type' => 'shop_order',
            'post_status' => 'any',
            'meta_key' => '_printful_order_id',
            'meta_compare' => 'EXISTS',
            'posts_per_page' => 50,
            'fields' => 'ids',
        ];
        
        $query = new WP_Query($args);
        
        if (empty($query->posts)) {
            return;
        }
        
        foreach ($query->posts as $order_id) {
            $printful_order_id = get_post_meta($order_id, '_printful_order_id', true);
            
            if (!$printful_order_id) {
                continue;
            }
            
            // Get current order status from Printful
            $response = $this->api->get_order($printful_order_id);
            
            if (is_wp_error($response) || !isset($response['result'])) {
                continue;
            }
            
            $printful_order = $response['result'];
            $current_status = get_post_meta($order_id, '_printful_order_status', true);
            
            // If status has changed, update it
            if ($current_status !== $printful_order['status']) {
                update_post_meta($order_id, '_printful_order_status', $printful_order['status']);
                
                $order = wc_get_order($order_id);
                
                if (!$order) {
                    continue;
                }
                
                // Update WooCommerce order based on Printful status
                switch ($printful_order['status']) {
                    case 'shipped':
                        $tracking_number = '';
                        $tracking_url = '';
                        
                        if (!empty($printful_order['shipments'])) {
                            $shipment = reset($printful_order['shipments']);
                            $tracking_number = $shipment['tracking_number'] ?? '';
                            $tracking_url = $shipment['tracking_url'] ?? '';
                        }
                        
                        if ($tracking_number) {
                            update_post_meta($order_id, '_printful_tracking_number', $tracking_number);
                            update_post_meta($order_id, '_printful_tracking_url', $tracking_url);
                        }
                        
                        $update_to_completed = get_option('printful_resources_shipped_status', 'completed');
                        
                        if ($update_to_completed === 'completed' && $order->get_status() !== 'completed') {
                            $order->update_status('completed', __('Order fulfilled and shipped by Printful', 'printful-resources'));
                        } else {
                            $order->add_order_note(sprintf(
                                __('Order shipped by Printful. Tracking number: %s', 'printful-resources'),
                                $tracking_number ? $tracking_number : __('Not provided', 'printful-resources')
                            ));
                        }
                        break;
                        
                    case 'failed':
                        $order->add_order_note(__('Printful order failed', 'printful-resources'));
                        
                        $on_fail_status = get_option('printful_resources_fail_status', 'on-hold');
                        
                        if ($on_fail_status !== 'none') {
                            $order->update_status($on_fail_status);
                        }
                        break;
                        
                    case 'onhold':
                        $order->add_order_note(__('Printful order put on hold', 'printful-resources'));
                        
                        $on_hold_status = get_option('printful_resources_hold_status', 'on-hold');
                        
                        if ($on_hold_status !== 'none') {
                            $order->update_status($on_hold_status);
                        }
                        break;
                        
                    case 'canceled':
                        $order->add_order_note(__('Printful order has been canceled', 'printful-resources'));
                        break;
                }
            }
        }
    }
} 