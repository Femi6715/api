<?php
// Define a helper function to get WooCommerce product ID by Printful ID
function get_wc_product_by_printful_id($printful_id) {
    global $wpdb;
    
    $query = $wpdb->prepare(
        "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_printful_product_id' AND meta_value = %s LIMIT 1",
        $printful_id
    );
    
    $wc_product_id = $wpdb->get_var($query);
    
    return $wc_product_id ? intval($wc_product_id) : null;
}

// Handle direct product synchronization (non-AJAX)
if (isset($_POST['printful_sync_product']) && isset($_POST['product_id']) && check_admin_referer('printful_resources_nonce')) {
    // Verify user capability
    if (!current_user_can('manage_woocommerce')) {
        wp_die(__('You do not have permission to sync products.', 'printful-resources'));
    }
    
    $product_id = intval($_POST['product_id']);
    
    // Get the API instance
    $printful_api = null;
    if (isset($this) && property_exists($this, 'api') && $this->api instanceof Printful_API) {
        $printful_api = $this->api;
    } elseif (class_exists('Printful_Resources') && method_exists('Printful_Resources', 'get_instance')) {
        $plugin = Printful_Resources::get_instance();
        if (property_exists($plugin, 'api') && $plugin->api instanceof Printful_API) {
            $printful_api = $plugin->api;
        }
    }
    
    if (!$printful_api) {
        // Create a new API instance if needed
        if (class_exists('Printful_API')) {
            $printful_api = new Printful_API();
        } else {
            wp_die(__('Printful API class not available.', 'printful-resources'));
        }
    }
    
    // Get product sync class
    $product_sync = null;
    if (isset($this) && $this instanceof Printful_Product_Sync) {
        $product_sync = $this;
    } elseif (class_exists('Printful_Product_Sync')) {
        $product_sync = new Printful_Product_Sync($printful_api);
    } else {
        wp_die(__('Printful Product Sync class not available.', 'printful-resources'));
    }
    
    // Log the sync attempt
    error_log('Printful Direct Sync: Starting sync for product ID: ' . $product_id);
    
    try {
        // Get the product data from Printful
        $response = $printful_api->get_product($product_id);
        
        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            error_log('Printful Direct Sync: Error getting product from API: ' . $error_message);
            wp_die(__('Error fetching product from Printful API: ', 'printful-resources') . $error_message);
        }
        
        if (!isset($response['result']) || !is_array($response['result'])) {
            error_log('Printful Direct Sync: Invalid product data received from API');
            wp_die(__('Invalid product data received from Printful API.', 'printful-resources'));
        }
        
        $product_data = $response['result'];
        
        // Check if product exists in WooCommerce - using our helper function
        $wc_product_id = get_wc_product_by_printful_id($product_id);
        
        $result = [];
        
        if ($wc_product_id) {
            // Update existing product
            error_log('Printful Direct Sync: Updating existing WC product ID: ' . $wc_product_id);
            
            if (!isset($product_data['sync_product']) || !is_array($product_data['sync_product'])) {
                error_log('Printful Direct Sync: Product data missing sync_product field');
                wp_die(__('Invalid product data structure from Printful API.', 'printful-resources'));
            }
            
            $update_result = $product_sync->update_wc_product($wc_product_id, $product_data['sync_product']);
            
            if (is_wp_error($update_result)) {
                $error_message = $update_result->get_error_message();
                error_log('Printful Direct Sync: Error updating product: ' . $error_message);
                wp_die(__('Error updating WooCommerce product: ', 'printful-resources') . $error_message);
            }
            
            $message = __('Product updated successfully!', 'printful-resources');
            $wc_product_edit_url = get_edit_post_link($wc_product_id);
            
            // Redirect to the product edit page with a success message
            wp_redirect(add_query_arg(array(
                'post' => $wc_product_id,
                'action' => 'edit',
                'printful_sync' => 'success',
                'printful_message' => urlencode($message)
            ), admin_url('post.php')));
            exit;
            
        } else {
            // Create new product
            error_log('Printful Direct Sync: Creating new product from Printful ID: ' . $product_id);
            
            if (!isset($product_data['sync_product']) || !is_array($product_data['sync_product'])) {
                error_log('Printful Direct Sync: Product data missing sync_product field');
                wp_die(__('Invalid product data structure from Printful API.', 'printful-resources'));
            }
            
            $create_result = $product_sync->create_wc_product($product_data['sync_product']);
            
            if (is_wp_error($create_result)) {
                $error_message = $create_result->get_error_message();
                error_log('Printful Direct Sync: Error creating product: ' . $error_message);
                wp_die(__('Error creating WooCommerce product: ', 'printful-resources') . $error_message);
            }
            
            $wc_product_id = $create_result;
            $message = __('Product created successfully!', 'printful-resources');
            
            // Redirect to the product edit page with a success message
            wp_redirect(add_query_arg(array(
                'post' => $wc_product_id,
                'action' => 'edit',
                'printful_sync' => 'success',
                'printful_message' => urlencode($message)
            ), admin_url('post.php')));
            exit;
        }
    } catch (Exception $e) {
        $error_message = 'Printful Direct Sync Exception: ' . $e->getMessage();
        error_log($error_message);
        wp_die(__('An unexpected error occurred: ', 'printful-resources') . $e->getMessage());
    }
}

// Handle bulk product synchronization
if (isset($_POST['printful_sync_bulk']) && isset($_POST['product_ids']) && check_admin_referer('printful_resources_nonce_bulk')) {
    // Verify user capability
    if (!current_user_can('manage_woocommerce')) {
        wp_die(__('You do not have permission to sync products.', 'printful-resources'));
    }
    
    $product_ids = isset($_POST['product_ids']) ? array_map('intval', $_POST['product_ids']) : array();
    
    if (empty($product_ids)) {
        wp_die(__('No products selected for synchronization.', 'printful-resources'));
    }
    
    // Get the API instance
    $printful_api = null;
    if (isset($this) && property_exists($this, 'api') && $this->api instanceof Printful_API) {
        $printful_api = $this->api;
    } elseif (class_exists('Printful_Resources') && method_exists('Printful_Resources', 'get_instance')) {
        $plugin = Printful_Resources::get_instance();
        if (property_exists($plugin, 'api') && $plugin->api instanceof Printful_API) {
            $printful_api = $plugin->api;
        }
    }
    
    if (!$printful_api) {
        // Create a new API instance if needed
        if (class_exists('Printful_API')) {
            $printful_api = new Printful_API();
        } else {
            wp_die(__('Printful API class not available.', 'printful-resources'));
        }
    }
    
    // Get product sync class
    $product_sync = null;
    if (isset($this) && $this instanceof Printful_Product_Sync) {
        $product_sync = $this;
    } elseif (class_exists('Printful_Product_Sync')) {
        $product_sync = new Printful_Product_Sync($printful_api);
    } else {
        wp_die(__('Printful Product Sync class not available.', 'printful-resources'));
    }
    
    // Log the bulk sync attempt
    error_log('Printful Direct Bulk Sync: Starting sync for ' . count($product_ids) . ' products');
    
    // Track results
    $results = array(
        'success' => 0,
        'failed' => 0,
        'created' => 0,
        'updated' => 0,
        'errors' => array()
    );
    
    // Process each product
    foreach ($product_ids as $product_id) {
        try {
            // Get the product data from Printful
            $response = $printful_api->get_product($product_id);
            
            if (is_wp_error($response)) {
                $error_message = $response->get_error_message();
                error_log('Printful Direct Bulk Sync: Error getting product ' . $product_id . ' from API: ' . $error_message);
                $results['errors'][] = sprintf(__('Error fetching product %d: %s', 'printful-resources'), $product_id, $error_message);
                $results['failed']++;
                continue;
            }
            
            if (!isset($response['result']) || !is_array($response['result'])) {
                error_log('Printful Direct Bulk Sync: Invalid product data received from API for product ' . $product_id);
                $results['errors'][] = sprintf(__('Invalid product data for product %d', 'printful-resources'), $product_id);
                $results['failed']++;
                continue;
            }
            
            $product_data = $response['result'];
            
            // Check if product exists in WooCommerce - using our helper function
            $wc_product_id = get_wc_product_by_printful_id($product_id);
            
            if ($wc_product_id) {
                // Update existing product
                if (!isset($product_data['sync_product']) || !is_array($product_data['sync_product'])) {
                    error_log('Printful Direct Bulk Sync: Product data missing sync_product field for product ' . $product_id);
                    $results['errors'][] = sprintf(__('Invalid product data structure for product %d', 'printful-resources'), $product_id);
                    $results['failed']++;
                    continue;
                }
                
                $update_result = $product_sync->update_wc_product($wc_product_id, $product_data['sync_product']);
                
                if (is_wp_error($update_result)) {
                    $error_message = $update_result->get_error_message();
                    error_log('Printful Direct Bulk Sync: Error updating product ' . $product_id . ': ' . $error_message);
                    $results['errors'][] = sprintf(__('Error updating product %d: %s', 'printful-resources'), $product_id, $error_message);
                    $results['failed']++;
                } else {
                    $results['success']++;
                    $results['updated']++;
                }
            } else {
                // Create new product
                if (!isset($product_data['sync_product']) || !is_array($product_data['sync_product'])) {
                    error_log('Printful Direct Bulk Sync: Product data missing sync_product field for product ' . $product_id);
                    $results['errors'][] = sprintf(__('Invalid product data structure for product %d', 'printful-resources'), $product_id);
                    $results['failed']++;
                    continue;
                }
                
                $create_result = $product_sync->create_wc_product($product_data['sync_product']);
                
                if (is_wp_error($create_result)) {
                    $error_message = $create_result->get_error_message();
                    error_log('Printful Direct Bulk Sync: Error creating product ' . $product_id . ': ' . $error_message);
                    $results['errors'][] = sprintf(__('Error creating product %d: %s', 'printful-resources'), $product_id, $error_message);
                    $results['failed']++;
                } else {
                    $results['success']++;
                    $results['created']++;
                }
            }
        } catch (Exception $e) {
            $error_message = 'Printful Direct Bulk Sync Exception for product ' . $product_id . ': ' . $e->getMessage();
            error_log($error_message);
            $results['errors'][] = sprintf(__('Error syncing product %d: %s', 'printful-resources'), $product_id, $e->getMessage());
            $results['failed']++;
        }
    }
    
    // Build result message
    $message = sprintf(
        __('Sync completed. %d products processed: %d created, %d updated, %d failed.', 'printful-resources'),
        count($product_ids),
        $results['created'],
        $results['updated'],
        $results['failed']
    );
    
    // Set transient with results for display
    set_transient('printful_bulk_sync_results', $results, 60 * 5); // Store for 5 minutes
    
    // Redirect back with status
    wp_redirect(add_query_arg(array(
        'page' => 'printful-resources-products',
        'printful_bulk_sync' => 'complete',
        'printful_message' => urlencode($message)
    ), admin_url('admin.php')));
    exit;
}

// Add admin notice for success message
add_action('admin_notices', function() {
    if (isset($_GET['printful_sync']) && $_GET['printful_sync'] === 'success' && isset($_GET['printful_message'])) {
        ?>
        <div class="notice notice-success is-dismissible">
            <p><?php echo esc_html(urldecode($_GET['printful_message'])); ?></p>
        </div>
        <?php
    }
    
    // Display bulk sync results
    if (isset($_GET['printful_bulk_sync']) && $_GET['printful_bulk_sync'] === 'complete' && isset($_GET['printful_message'])) {
        $results = get_transient('printful_bulk_sync_results');
        ?>
        <div class="notice notice-success is-dismissible">
            <p><?php echo esc_html(urldecode($_GET['printful_message'])); ?></p>
            <?php if ($results && !empty($results['errors'])): ?>
                <ul class="printful-sync-errors" style="color: #d63638; margin-left: 20px; list-style-type: disc;">
                    <?php foreach ($results['errors'] as $error): ?>
                        <li><?php echo esc_html($error); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </div>
        <?php
        // Clear the transient
        delete_transient('printful_bulk_sync_results');
    }
});
?>

<div class="printful-products-list">
    <h2><?php echo esc_html__('Available Printful Products', 'printful-resources'); ?></h2>
    
    <?php if (!isset($printful_products) || !is_array($printful_products)) : ?>
        <div class="notice notice-error">
            <p><?php echo esc_html__('Error: Product data is not in the expected format.', 'printful-resources'); ?></p>
            <p>Debug: <?php echo isset($printful_products) ? gettype($printful_products) : 'Variable not set'; ?></p>
        </div>
        
        <?php if (isset($printful_products)) : ?>
            <pre><?php print_r($printful_products); ?></pre>
        <?php endif; ?>
        
    <?php elseif (empty($printful_products)) : ?>
        <div class="printful-empty-state">
            <div class="empty-state-icon">
                <span class="dashicons dashicons-tag"></span>
            </div>
            <h3><?php echo esc_html__('No products found', 'printful-resources'); ?></h3>
            <p><?php echo esc_html__('No products found in your Printful store. You can create products in Printful and then sync them to your WooCommerce store.', 'printful-resources'); ?></p>
            <a href="https://www.printful.com/dashboard/products" target="_blank" class="button button-primary">
                <span class="dashicons dashicons-external"></span>
                <?php echo esc_html__('Create Products in Printful', 'printful-resources'); ?>
            </a>
        </div>
    
    <?php else : ?>
        <div class="printful-products-header">
            <div class="products-count">
                <span class="count-number"><?php echo count($printful_products); ?></span>
                <span class="count-label"><?php echo esc_html__('Products Available', 'printful-resources'); ?></span>
            </div>
            
            <div class="sync-actions">
                <form method="post" id="bulk-sync-form">
                    <?php wp_nonce_field('printful_resources_nonce_bulk', '_wpnonce', false); ?>
                    <div id="product-ids-container"></div>
                    <button id="sync-selected-products" type="submit" name="printful_sync_bulk" class="button" disabled>
                        <span class="dashicons dashicons-update"></span>
                        <?php echo esc_html__('Sync Selected', 'printful-resources'); ?>
                        <span class="selected-count">(0)</span>
                    </button>
                </form>
            </div>
        </div>
        
        <div class="printful-filter-tools">
            <div class="filter-wrapper">
                <label for="product-filter"><?php echo esc_html__('Filter Products:', 'printful-resources'); ?></label>
                <input type="text" id="product-filter" placeholder="<?php echo esc_attr__('Search by name...', 'printful-resources'); ?>">
            </div>
            <div class="sort-wrapper">
                <label for="product-sort"><?php echo esc_html__('Sort By:', 'printful-resources'); ?></label>
                <select id="product-sort">
                    <option value="name-asc"><?php echo esc_html__('Name (A-Z)', 'printful-resources'); ?></option>
                    <option value="name-desc"><?php echo esc_html__('Name (Z-A)', 'printful-resources'); ?></option>
                    <option value="status"><?php echo esc_html__('Sync Status', 'printful-resources'); ?></option>
                </select>
            </div>
            <div class="view-toggle">
                <button class="view-grid active"><span class="dashicons dashicons-grid-view"></span></button>
                <button class="view-list"><span class="dashicons dashicons-list-view"></span></button>
            </div>
        </div>
        
        <div class="printful-products-grid-wrapper">
            <table class="printful-products-table" style="display: none;">
                <thead>
                    <tr>
                        <th class="check-column">
                            <input type="checkbox" id="select-all-products">
                        </th>
                        <th class="column-thumbnail"><?php echo esc_html__('Image', 'printful-resources'); ?></th>
                        <th class="column-name"><?php echo esc_html__('Product', 'printful-resources'); ?></th>
                        <th class="column-variants"><?php echo esc_html__('Variants', 'printful-resources'); ?></th>
                        <th class="column-status"><?php echo esc_html__('Status', 'printful-resources'); ?></th>
                        <th class="column-actions"><?php echo esc_html__('Actions', 'printful-resources'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($printful_products as $product) : 
                        if (!is_array($product) || !isset($product['id'])) {
                            continue;
                        }
                        
                        // Get WooCommerce product ID
                        $wc_product_id = get_wc_product_by_printful_id($product['id']);
                        
                        $is_synced = !empty($wc_product_id);
                        
                        if ($is_synced) {
                            $sync_status_class = 'synced';
                            $sync_status_text = esc_html__('Synced', 'printful-resources');
                            $sync_status_icon = 'dashicons-yes-alt';
                        } else {
                            $sync_status_class = 'not-synced';
                            $sync_status_text = esc_html__('Not Synced', 'printful-resources');
                            $sync_status_icon = 'dashicons-no-alt';
                        }
                    ?>
                    <tr class="product-row <?php echo esc_attr($sync_status_class); ?>">
                        <td>
                            <input type="checkbox" class="product-select" value="<?php echo esc_attr($product['id']); ?>" <?php echo $is_synced ? 'disabled' : ''; ?>>
                        </td>
                        <td class="product-thumbnail">
                            <?php if (!empty($product['thumbnail_url'])) : ?>
                                <img src="<?php echo esc_url($product['thumbnail_url']); ?>" alt="<?php echo isset($product['name']) ? esc_attr($product['name']) : ''; ?>">
                            <?php else : ?>
                                <div class="no-image">
                                    <span class="dashicons dashicons-format-image"></span>
                                </div>
                            <?php endif; ?>
                        </td>
                        <td class="product-name">
                            <strong><?php echo isset($product['name']) ? esc_html($product['name']) : esc_html__('No name', 'printful-resources'); ?></strong>
                            <div class="product-id">ID: <?php echo esc_html($product['id']); ?></div>
                        </td>
                        <td class="product-variants">
                            <?php 
                            if (isset($product['variants']) && is_numeric($product['variants'])) {
                                echo '<span class="variant-count">' . esc_html($product['variants']) . '</span>';
                            } elseif (isset($product['sync_variants']) && is_array($product['sync_variants'])) {
                                echo '<span class="variant-count">' . esc_html(count($product['sync_variants'])) . '</span>';
                            } else {
                                echo '<span class="variant-count">0</span>';
                            }
                            ?>
                        </td>
                        <td class="product-status">
                            <span class="status-indicator <?php echo esc_attr($sync_status_class); ?>">
                                <span class="dashicons <?php echo esc_attr($sync_status_icon); ?>"></span>
                                <?php echo $sync_status_text; ?>
                            </span>
                        </td>
                        <td class="product-actions">
                            <?php if ($is_synced) : 
                                $wc_product_edit_link = get_edit_post_link($wc_product_id);
                                $wc_product_view_link = get_permalink($wc_product_id);
                            ?>
                                <a href="<?php echo esc_url($wc_product_edit_link); ?>" class="button button-small" target="_blank">
                                    <span class="dashicons dashicons-edit"></span>
                                </a>
                                <a href="<?php echo esc_url($wc_product_view_link); ?>" class="button button-small" target="_blank">
                                    <span class="dashicons dashicons-visibility"></span>
                                </a>
                            <?php else : ?>
                                <form method="post" style="display:inline;">
                                    <?php wp_nonce_field('printful_resources_nonce'); ?>
                                    <input type="hidden" name="product_id" value="<?php echo esc_attr($product['id']); ?>">
                                    <button type="submit" name="printful_sync_product" class="button button-primary button-small">
                                        <span class="dashicons dashicons-update"></span> <?php echo esc_html__('Sync Now', 'printful-resources'); ?>
                                    </button>
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <ul class="printful-products-grid">
                <?php 
                // Safety check before iterating
                if (is_array($printful_products)) :
                    foreach ($printful_products as $product) : 
                        // Check if product is an array and has required fields
                        if (!is_array($product) || !isset($product['id'])) {
                            continue;
                        }
                        
                        try {
                            // Get WooCommerce product ID by Printful ID safely
                            $wc_product_id = get_wc_product_by_printful_id($product['id']);
                            
                            // Get sync status
                            $is_synced = !empty($wc_product_id);
                            
                            if ($is_synced) {
                                $sync_status_class = 'synced';
                                $sync_status_icon = 'dashicons-yes-alt';
                                $sync_status_text = esc_html__('Synced', 'printful-resources');
                            } else {
                                $sync_status_class = 'not-synced';
                                $sync_status_icon = 'dashicons-no-alt';
                                $sync_status_text = esc_html__('Not synced', 'printful-resources');
                            }
                            
                            // Get WC product data if available
                            $wc_product_title = '';
                            $wc_product_edit_link = '';
                            $wc_product_view_link = '';
                            
                            if ($wc_product_id) {
                                $wc_product_title = get_the_title($wc_product_id);
                                $wc_product_edit_link = get_edit_post_link($wc_product_id);
                                $wc_product_view_link = get_permalink($wc_product_id);
                            }
                            ?>
                            <li class="printful-product-item <?php echo esc_attr($sync_status_class); ?>" data-product-id="<?php echo esc_attr($product['id']); ?>">
                                <?php if (!$is_synced) : ?>
                                <div class="product-select-wrapper">
                                    <input type="checkbox" class="product-select" value="<?php echo esc_attr($product['id']); ?>">
                                </div>
                                <?php endif; ?>
                                
                                <div class="product-card">
                                    <div class="product-image">
                                        <?php if (!empty($product['thumbnail_url'])) : ?>
                                            <img src="<?php echo esc_url($product['thumbnail_url']); ?>" alt="<?php echo isset($product['name']) ? esc_attr($product['name']) : ''; ?>">
                                        <?php else : ?>
                                            <div class="no-image">
                                                <span class="dashicons dashicons-format-image"></span>
                                            </div>
                                        <?php endif; ?>
                                        <div class="status-badge <?php echo esc_attr($sync_status_class); ?>">
                                            <span class="dashicons <?php echo esc_attr($sync_status_icon); ?>"></span>
                                            <?php echo $sync_status_text; ?>
                                        </div>
                                    </div>
                                    
                                    <div class="product-details">
                                        <h3 class="product-title"><?php echo isset($product['name']) ? esc_html($product['name']) : esc_html__('No name', 'printful-resources'); ?></h3>
                                        
                                        <div class="product-meta">
                                            <div class="product-id">
                                                <strong><?php echo esc_html__('ID:', 'printful-resources'); ?></strong> 
                                                <?php echo esc_html($product['id']); ?>
                                            </div>
                                            
                                            <div class="product-variants">
                                                <strong><?php echo esc_html__('Variants:', 'printful-resources'); ?></strong>
                                                <?php 
                                                if (isset($product['variants']) && is_numeric($product['variants'])) {
                                                    echo '<span class="variant-count">' . esc_html($product['variants']) . '</span>';
                                                } elseif (isset($product['sync_variants']) && is_array($product['sync_variants'])) {
                                                    echo '<span class="variant-count">' . esc_html(count($product['sync_variants'])) . '</span>';
                                                } else {
                                                    echo '<span class="variant-count">0</span>';
                                                }
                                                ?>
                                            </div>
                                        </div>
                                        
                                        <?php if ($is_synced && !empty($wc_product_title)) : ?>
                                            <div class="wc-product-info">
                                                <span><?php echo esc_html__('WC Product:', 'printful-resources'); ?></span> 
                                                <?php echo esc_html($wc_product_title); ?>
                                            </div>
                                        <?php endif; ?>
                                        
                                        <div class="product-actions">
                                            <?php if ($is_synced && !empty($wc_product_edit_link)) : ?>
                                                <a href="<?php echo esc_url($wc_product_edit_link); ?>" class="button button-small" target="_blank">
                                                    <span class="dashicons dashicons-edit"></span> <?php echo esc_html__('Edit', 'printful-resources'); ?>
                                                </a>
                                                <?php if (!empty($wc_product_view_link)) : ?>
                                                <a href="<?php echo esc_url($wc_product_view_link); ?>" class="button button-small" target="_blank">
                                                    <span class="dashicons dashicons-visibility"></span> <?php echo esc_html__('View', 'printful-resources'); ?>
                                                </a>
                                                <?php endif; ?>
                                            <?php else : ?>
                                                <form method="post" style="display:inline;">
                                                    <?php wp_nonce_field('printful_resources_nonce'); ?>
                                                    <input type="hidden" name="product_id" value="<?php echo esc_attr($product['id']); ?>">
                                                    <button type="submit" name="printful_sync_product" class="button button-primary button-small">
                                                        <span class="dashicons dashicons-update"></span> <?php echo esc_html__('Sync Now', 'printful-resources'); ?>
                                                    </button>
                                                </form>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        <?php 
                        } catch (Exception $e) {
                            echo '<li class="product-error">Error processing product: ' . esc_html($e->getMessage()) . '</li>';
                        }
                    endforeach;
                endif;
                ?>
            </ul>
        </div>
        
        <div class="printful-bulk-actions">
            <div class="selected-products-summary">
                <span class="selected-count">0</span> <?php echo esc_html__('products selected', 'printful-resources'); ?>
            </div>
            <button id="sync-selected-products-bottom" type="button" class="button button-primary" disabled onclick="document.getElementById('bulk-sync-form').submit();">
                <span class="dashicons dashicons-update"></span>
                <?php echo esc_html__('Sync Selected Products', 'printful-resources'); ?>
            </button>
        </div>
        
        <div class="printful-sync-progress" style="display: none;">
            <div class="progress-bar-wrapper">
                <div class="progress-bar" style="width: 0%;"></div>
            </div>
            <div class="progress-status">
                <span class="products-processed">0</span> / <span class="products-total">0</span> <?php echo esc_html__('products synced', 'printful-resources'); ?>
            </div>
        </div>
    <?php endif; ?>
</div>

<script>
jQuery(document).ready(function($) {
    // Define ajaxurl if it's not already defined
    if (typeof ajaxurl === 'undefined') {
        var ajaxurl = '<?php echo esc_url(admin_url('admin-ajax.php')); ?>';
    }
    
    // Toggle between grid and list views
    $('.view-grid').on('click', function() {
        $(this).addClass('active');
        $('.view-list').removeClass('active');
        $('.printful-products-grid').show();
        $('.printful-products-table').hide();
    });
    
    $('.view-list').on('click', function() {
        $(this).addClass('active');
        $('.view-grid').removeClass('active');
        $('.printful-products-table').show();
        $('.printful-products-grid').hide();
    });
    
    // Product selection
    $('.product-select').on('change', function() {
        updateSelectedCount();
    });
    
    $('#select-all-products').on('change', function() {
        var isChecked = $(this).prop('checked');
        $('.product-select:not(:disabled)').prop('checked', isChecked);
        updateSelectedCount();
    });
    
    function updateSelectedCount() {
        var selectedCount = $('.product-select:checked').length;
        $('.selected-count').text(selectedCount);
        
        // Enable or disable the sync buttons
        if (selectedCount > 0) {
            $('#sync-selected-products, #sync-selected-products-bottom').prop('disabled', false);
            
            // Update the form with selected product IDs
            updateFormProductIds();
        } else {
            $('#sync-selected-products, #sync-selected-products-bottom').prop('disabled', true);
            
            // Clear product IDs from form
            $('#product-ids-container').empty();
        }
    }
    
    // Update hidden form fields with selected product IDs
    function updateFormProductIds() {
        var selectedProducts = [];
        
        // Get all selected product IDs
        $('.product-select:checked').each(function() {
            selectedProducts.push($(this).val());
        });
        
        // Clear existing fields
        $('#product-ids-container').empty();
        
        // Add a hidden input for each selected product
        for (var i = 0; i < selectedProducts.length; i++) {
            $('#product-ids-container').append(
                '<input type="hidden" name="product_ids[]" value="' + selectedProducts[i] + '">'
            );
        }
    }
    
    // Product filtering
    $('#product-filter').on('keyup', function() {
        var searchTerm = $(this).val().toLowerCase();
        
        $('.printful-product-item, .product-row').each(function() {
            var productName = $(this).find('.product-title, .product-name').text().toLowerCase();
            var productId = $(this).find('.product-id').text().toLowerCase();
            
            if (productName.indexOf(searchTerm) > -1 || productId.indexOf(searchTerm) > -1) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
    
    // Product sorting
    $('#product-sort').on('change', function() {
        var sortBy = $(this).val();
        sortProducts(sortBy);
    });
    
    function sortProducts(sortBy) {
        // Grid view sorting
        var products = $('.printful-products-grid .printful-product-item').get();
        
        products.sort(function(a, b) {
            if (sortBy === 'name-asc') {
                var nameA = $(a).find('.product-title').text().toLowerCase();
                var nameB = $(b).find('.product-title').text().toLowerCase();
                return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
            } else if (sortBy === 'name-desc') {
                var nameA = $(a).find('.product-title').text().toLowerCase();
                var nameB = $(b).find('.product-title').text().toLowerCase();
                return (nameA > nameB) ? -1 : (nameA < nameB) ? 1 : 0;
            } else if (sortBy === 'status') {
                return $(b).hasClass('synced') - $(a).hasClass('synced');
            }
        });
        
        $.each(products, function(i, item) {
            $('.printful-products-grid').append(item);
        });
        
        // Table view sorting
        var tableRows = $('.printful-products-table tbody tr').get();
        
        tableRows.sort(function(a, b) {
            if (sortBy === 'name-asc') {
                var nameA = $(a).find('.product-name strong').text().toLowerCase();
                var nameB = $(b).find('.product-name strong').text().toLowerCase();
                return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
            } else if (sortBy === 'name-desc') {
                var nameA = $(a).find('.product-name strong').text().toLowerCase();
                var nameB = $(b).find('.product-name strong').text().toLowerCase();
                return (nameA > nameB) ? -1 : (nameA < nameB) ? 1 : 0;
            } else if (sortBy === 'status') {
                return $(b).hasClass('synced') - $(a).hasClass('synced');
            }
        });
        
        $.each(tableRows, function(i, item) {
            $('.printful-products-table tbody').append(item);
        });
    }
});
</script>

<style>
/* Grid/Table Toggle Styles */
.view-toggle {
    display: inline-flex;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
}

.view-toggle button {
    border: none;
    background: #f5f5f5;
    padding: 5px 10px;
    cursor: pointer;
}

.view-toggle button.active {
    background: #0073aa;
    color: white;
}

/* Empty State Styles */
.printful-empty-state {
    text-align: center;
    padding: 40px 20px;
    background: #f9f9f9;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
}

.empty-state-icon {
    font-size: 48px;
    color: #ccc;
    margin-bottom: 20px;
}

.empty-state-icon .dashicons {
    font-size: 48px;
    width: 48px;
    height: 48px;
}

/* Status Badge Styles */
.status-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.status-badge.synced {
    background-color: #46b450;
    color: white;
}

.status-badge.not-synced {
    background-color: #f0f0f1;
    color: #23282d;
}

/* Product Card Hover Effects */
.product-card {
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

/* Product Selection Styles */
.product-select-wrapper {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 5;
}

/* Progress Bar Styles */
.progress-bar-wrapper {
    height: 20px;
    background-color: #f0f0f1;
    border-radius: 10px;
    margin-bottom: 10px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background-color: #0073aa;
    transition: width 0.3s;
}

.progress-status {
    text-align: center;
    font-size: 12px;
    color: #666;
}

/* Loading Animation */
.rotating {
    animation: spin 1.5s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Grid Layout Improvements */
.printful-products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin: 0;
    padding: 0;
    list-style: none;
}

/* Table Layout Improvements */
.printful-products-table {
    width: 100%;
    border-collapse: collapse;
}

.printful-products-table th,
.printful-products-table td {
    padding: 10px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid #e5e5e5;
}

.printful-products-table .product-thumbnail img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
}

.printful-products-header,
.printful-filter-tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.printful-bulk-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 15px;
    background: #f9f9f9;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
}
</style>