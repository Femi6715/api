<div class="wrap">
    <h1><?php echo esc_html__('Printful Orders', 'printful-resources'); ?></h1>

    <?php if (empty($api_key)) : ?>
        <div class="printful-notice notice notice-warning">
            <p>
                <?php echo esc_html__('Please set up your Printful API key in the Settings tab to start using the plugin.', 'printful-resources'); ?>
                <a href="<?php echo admin_url('admin.php?page=printful-resources-settings'); ?>" class="button button-primary">
                    <?php echo esc_html__('Go to Settings', 'printful-resources'); ?>
                </a>
            </p>
        </div>
    <?php else : ?>
        <div class="printful-orders-list">
            <h2><?php echo esc_html__('Recent Printful Orders', 'printful-resources'); ?></h2>
            <?php if (empty($printful_orders)) : ?>
                <p><?php echo esc_html__('No orders found in your Printful store. When you process orders with Printful products, they will appear here.', 'printful-resources'); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped printful-orders-table">
                    <thead>
                        <tr>
                            <th><?php echo esc_html__('ID', 'printful-resources'); ?></th>
                            <th><?php echo esc_html__('External ID', 'printful-resources'); ?></th>
                            <th><?php echo esc_html__('Status', 'printful-resources'); ?></th>
                            <th><?php echo esc_html__('Date', 'printful-resources'); ?></th>
                            <th><?php echo esc_html__('Total', 'printful-resources'); ?></th>
                            <th><?php echo esc_html__('Actions', 'printful-resources'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($printful_orders as $order) : ?>
                            <?php 
                            // Get status label
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
                            $status_label = isset($status_labels[$order['status']]) ? $status_labels[$order['status']] : $order['status'];
                            
                            // Find WooCommerce order
                            $wc_order_id = wc_get_order_id_by_order_number($order['external_id']);
                            ?>
                            <tr>
                                <td><?php echo esc_html($order['id']); ?></td>
                                <td>
                                    <?php if ($wc_order_id) : ?>
                                        <a href="<?php echo get_edit_post_link($wc_order_id); ?>" target="_blank">
                                            <?php echo esc_html($order['external_id']); ?>
                                            <span class="dashicons dashicons-external"></span>
                                        </a>
                                    <?php else : ?>
                                        <?php echo esc_html($order['external_id']); ?>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <span class="order-status status-<?php echo esc_attr($order['status']); ?>">
                                        <?php echo esc_html($status_label); ?>
                                    </span>
                                </td>
                                <td><?php echo date_i18n(get_option('date_format'), strtotime($order['created'])); ?></td>
                                <td>
                                    <?php 
                                    if (isset($order['costs']['total'])) {
                                        echo wc_price($order['costs']['total']);
                                    } else {
                                        echo '-';
                                    }
                                    ?>
                                </td>
                                <td>
                                    <a href="https://www.printful.com/dashboard/orders/<?php echo esc_attr($order['id']); ?>" target="_blank" class="button">
                                        <?php echo esc_html__('View on Printful', 'printful-resources'); ?>
                                    </a>
                                    <?php if (in_array($order['status'], ['draft', 'pending', 'inprocess', 'onhold'])) : ?>
                                        <button class="button cancel-printful-order" data-order-id="<?php echo esc_attr($order['id']); ?>" data-wc-order-id="<?php echo esc_attr($wc_order_id); ?>">
                                            <?php echo esc_html__('Cancel', 'printful-resources'); ?>
                                        </button>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div> 