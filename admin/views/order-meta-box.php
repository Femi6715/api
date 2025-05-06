<?php
/**
 * Order meta box view
 *
 * @package Printful_Resources
 */

if (!defined('WPINC')) {
    die;
}

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
        ?>
        <p><?php echo esc_html__('This order contains Printful products but has not been sent to Printful.', 'printful-resources'); ?></p>
        
        <button type="button" class="button" id="send-to-printful" data-order-id="<?php echo esc_attr($order_id); ?>">
            <?php echo esc_html__('Send to Printful', 'printful-resources'); ?>
        </button>
        <?php
    } else {
        ?>
        <p><?php echo esc_html__('This order does not contain any Printful products.', 'printful-resources'); ?></p>
        <?php
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
?>

<p><strong><?php echo esc_html__('Printful Order ID:', 'printful-resources'); ?></strong> <?php echo esc_html($printful_order_id); ?></p>
<p><strong><?php echo esc_html__('Status:', 'printful-resources'); ?></strong> <?php echo esc_html($status_label); ?></p>

<?php if ($tracking_number) : ?>
    <p><strong><?php echo esc_html__('Tracking:', 'printful-resources'); ?></strong> 
        <?php if ($tracking_url) : ?>
            <a href="<?php echo esc_url($tracking_url); ?>" target="_blank"><?php echo esc_html($tracking_number); ?></a>
        <?php else : ?>
            <?php echo esc_html($tracking_number); ?>
        <?php endif; ?>
    </p>
<?php endif; ?>

<div class="printful-actions">
    <a href="https://www.printful.com/dashboard/orders/<?php echo esc_attr($printful_order_id); ?>" target="_blank" class="button">
        <?php echo esc_html__('View on Printful', 'printful-resources'); ?>
    </a>
    
    <?php if (in_array($printful_status, ['draft', 'inprocess', 'onhold'])) : ?>
        <button type="button" class="button" id="cancel-printful-order" data-order-id="<?php echo esc_attr($order_id); ?>">
            <?php echo esc_html__('Cancel Order', 'printful-resources'); ?>
        </button>
    <?php endif; ?>
    
    <button type="button" class="button" id="refresh-printful-status" data-order-id="<?php echo esc_attr($order_id); ?>">
        <?php echo esc_html__('Refresh Status', 'printful-resources'); ?>
    </button>
</div> 