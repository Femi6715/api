<div class="wrap">
    <h1><?php echo esc_html__('Printful Dashboard', 'printful-resources'); ?></h1>

    <div class="printful-dashboard">
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
            <div class="printful-dashboard-header">
                <?php if ($store_info) : ?>
                    <div class="printful-store-info">
                        <h2><?php echo esc_html__('Store Information', 'printful-resources'); ?></h2>
                        <table class="widefat">
                            <tbody>
                                <tr>
                                    <th><?php echo esc_html__('Store Name', 'printful-resources'); ?></th>
                                    <td><?php echo esc_html($store_info['name']); ?></td>
                                </tr>
                                <tr>
                                    <th><?php echo esc_html__('Type', 'printful-resources'); ?></th>
                                    <td><?php echo esc_html($store_info['type']); ?></td>
                                </tr>
                                <tr>
                                    <th><?php echo esc_html__('Created', 'printful-resources'); ?></th>
                                    <td><?php echo date_i18n(get_option('date_format'), strtotime($store_info['created'])); ?></td>
                                </tr>
                                <tr>
                                    <th><?php echo esc_html__('Website', 'printful-resources'); ?></th>
                                    <td>
                                        <a href="<?php echo esc_url($store_info['website']); ?>" target="_blank">
                                            <?php echo esc_html($store_info['website']); ?>
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                <?php else : ?>
                    <div class="printful-notice notice notice-error">
                        <p><?php echo esc_html__('Unable to retrieve store information. Please check your API key.', 'printful-resources'); ?></p>
                    </div>
                <?php endif; ?>
            </div>

            <div class="printful-dashboard-content">
                <div class="printful-card">
                    <h2><?php echo esc_html__('Quick Actions', 'printful-resources'); ?></h2>
                    <div class="printful-actions">
                        <a href="<?php echo admin_url('admin.php?page=printful-resources-products'); ?>" class="button button-primary">
                            <?php echo esc_html__('Manage Products', 'printful-resources'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=printful-resources-orders'); ?>" class="button button-primary">
                            <?php echo esc_html__('Manage Orders', 'printful-resources'); ?>
                        </a>
                        <button id="sync-products" class="button button-primary">
                            <?php echo esc_html__('Sync Products Now', 'printful-resources'); ?>
                        </button>
                    </div>
                </div>

                <div class="printful-card">
                    <h2><?php echo esc_html__('Synchronization Status', 'printful-resources'); ?></h2>
                    <div class="printful-sync-status">
                        <?php if ($last_sync) : ?>
                            <p>
                                <?php
                                echo sprintf(
                                    esc_html__('Last sync: %s', 'printful-resources'),
                                    date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $last_sync)
                                );
                                ?>
                            </p>
                        <?php else : ?>
                            <p><?php echo esc_html__('No synchronization has been performed yet.', 'printful-resources'); ?></p>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="printful-card">
                    <h2><?php echo esc_html__('Documentation', 'printful-resources'); ?></h2>
                    <p><?php echo esc_html__('Check out the Printful API documentation for more information:', 'printful-resources'); ?></p>
                    <a href="https://developers.printful.com/docs/" target="_blank" class="button">
                        <?php echo esc_html__('View Documentation', 'printful-resources'); ?>
                    </a>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div> 