<?php
// Enable error reporting at the top of the file
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Capture any potential errors in a buffer
$debug_output = '';
ob_start();
?>

<div class="wrap">
    <h1><?php echo esc_html__('Printful Products', 'printful-resources'); ?></h1>

    <?php 
    // Debug information display
    if (isset($_GET['debug']) || (defined('WP_DEBUG') && WP_DEBUG)) {
        echo '<div class="notice notice-info" style="padding: 10px; margin-bottom: 15px;">';
        echo '<h3>Debug Information</h3>';
        echo '<p>PHP Version: ' . phpversion() . '</p>';
        echo '<p>Memory Limit: ' . ini_get('memory_limit') . '</p>';
        echo '<p>WP_DEBUG: ' . (defined('WP_DEBUG') && WP_DEBUG ? 'Enabled' : 'Disabled') . '</p>';
        echo '<p>Products API Key: ' . (empty($products_api_key) ? 'Not set' : 'Set') . '</p>';
        
        // Check WooCommerce
        echo '<p>WooCommerce Active: ' . (class_exists('WooCommerce') ? 'Yes' : 'No') . '</p>';
        echo '<p>Products Array Type: ' . (isset($printful_products) ? gettype($printful_products) : 'Not set') . '</p>';
        echo '<p>Products Count: ' . (isset($printful_products) && is_array($printful_products) ? count($printful_products) : 'N/A') . '</p>';
        echo '</div>';
    }
    
    $products_api_key = get_option('printful_resources_api_key_products', '');
    if (empty($products_api_key)) : 
    ?>
        <div class="printful-notice notice notice-warning">
            <p>
                <?php echo esc_html__('Please set up your Printful Products API key in the Settings tab to start using product synchronization.', 'printful-resources'); ?>
                <a href="<?php echo admin_url('admin.php?page=printful-resources-settings'); ?>" class="button button-primary">
                    <?php echo esc_html__('Go to Settings', 'printful-resources'); ?>
                </a>
            </p>
        </div>
    <?php else : ?>
        <div class="printful-products-controls">
            <div class="printful-sync-controls">
                <button id="sync-products" class="button button-primary">
                    <?php echo esc_html__('Sync All Products', 'printful-resources'); ?>
                </button>
                <button id="sync-products-force" class="button">
                    <?php echo esc_html__('Force Sync (Update All)', 'printful-resources'); ?>
                </button>
                <span id="sync-status" class="sync-status"></span>
            </div>
            <div class="printful-sync-results" style="display: none;">
                <h3><?php echo esc_html__('Sync Results', 'printful-resources'); ?></h3>
                <div id="sync-results-content"></div>
            </div>
        </div>

        <div class="printful-debug-section" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9;">
            <h3><?php echo esc_html__('Debug Information', 'printful-resources'); ?></h3>
            <p><?php echo esc_html__('This section will help identify issues with the Printful API integration.', 'printful-resources'); ?></p>
            
            <div class="printful-debug-info">
                <h4><?php echo esc_html__('API Configuration', 'printful-resources'); ?></h4>
                <ul>
                    <li><strong><?php echo esc_html__('Products API Key Set:', 'printful-resources'); ?></strong> <?php echo !empty($products_api_key) ? '✓' : '✗'; ?></li>
                    <?php 
                    // Check if WooCommerce is active
                    $woocommerce_active = class_exists('WooCommerce');
                    ?>
                    <li><strong><?php echo esc_html__('WooCommerce Active:', 'printful-resources'); ?></strong> <?php echo $woocommerce_active ? '✓' : '✗'; ?></li>
                </ul>
                
                <h4><?php echo esc_html__('PHP Information', 'printful-resources'); ?></h4>
                <ul>
                    <li><strong><?php echo esc_html__('PHP Version:', 'printful-resources'); ?></strong> <?php echo esc_html(phpversion()); ?></li>
                    <li><strong><?php echo esc_html__('Memory Limit:', 'printful-resources'); ?></strong> <?php echo esc_html(ini_get('memory_limit')); ?></li>
                    <li><strong><?php echo esc_html__('Max Execution Time:', 'printful-resources'); ?></strong> <?php echo esc_html(ini_get('max_execution_time')); ?> seconds</li>
                </ul>
                
                <h4><?php echo esc_html__('WordPress Debug Log', 'printful-resources'); ?></h4>
                <?php
                $debug_file = WP_CONTENT_DIR . '/debug.log';
                if (file_exists($debug_file) && is_readable($debug_file)) {
                    $log_content = file_get_contents($debug_file, false, null, -10000); // Get last 10KB of the file
                    if ($log_content) {
                        echo '<div style="max-height: 300px; overflow-y: auto; background-color: #1e1e1e; color: #f1f1f1; padding: 10px; font-family: monospace;">';
                        echo nl2br(esc_html($log_content));
                        echo '</div>';
                    } else {
                        echo '<p>' . esc_html__('No recent log entries found.', 'printful-resources') . '</p>';
                    }
                } else {
                    echo '<p>' . esc_html__('Debug log not found or not readable. Check if WP_DEBUG and WP_DEBUG_LOG are enabled in wp-config.php.', 'printful-resources') . '</p>';
                }
                ?>
                
                <h4><?php echo esc_html__('Test API Connection', 'printful-resources'); ?></h4>
                <p><?php echo esc_html__('Click the button below to test the Products API connection:', 'printful-resources'); ?></p>
                <button id="test-api-connection" class="button">
                    <?php echo esc_html__('Test Products API Connection', 'printful-resources'); ?>
                </button>
                <span id="api-test-result" style="margin-left: 10px;"></span>
            </div>
        </div>

        <?php /* Debug section for tables */ ?>
        <div class="printful-table-debug" style="margin: 20px 0; padding: 10px; background: #f8f8f8; border: 1px solid #ddd; display: <?php 
        if (isset($_GET['debug']) || (defined('WP_DEBUG') && WP_DEBUG)) { 
            echo 'block'; 
        } else { 
            echo 'none'; 
        } 
        ?>">
            <h3>Table Debug Information</h3>
            <p>Product Data Structure:</p>
            <pre><?php 
                if (isset($printful_products) && is_array($printful_products) && !empty($printful_products)) {
                    // Print first product structure
                    $first_product = reset($printful_products);
                    print_r($first_product);
                } else {
                    echo "No products available or invalid data structure";
                }
            ?></pre>
        </div>

        <div class="printful-products-list">
            <h2><?php echo esc_html__('Printful Products', 'printful-resources'); ?></h2>
            <?php 
            // Check if printful_products is set and is array
            if (!isset($printful_products) || !is_array($printful_products)) {
                echo '<div class="notice notice-error"><p>';
                echo esc_html__('Error: Product data is not in the expected format.', 'printful-resources');
                echo '</p>';
                echo '<p>Debug: ' . (isset($printful_products) ? gettype($printful_products) : 'Variable not set') . '</p>';
                echo '</div>';
                
                // Try to display raw data
                if (isset($printful_products)) {
                    echo '<pre>';
                    print_r($printful_products);
                    echo '</pre>';
                }
            } elseif (empty($printful_products)) : 
            ?>
                <p><?php echo esc_html__('No products found in your Printful store. You can create products in Printful and sync them to your WooCommerce store.', 'printful-resources'); ?></p>
                <a href="https://www.printful.com/dashboard/products" target="_blank" class="button">
                    <?php echo esc_html__('Go to Printful Products', 'printful-resources'); ?>
                </a>
            <?php else : ?>
                <ul class="printful-products-grid">
                    <?php 
                    // Safety check before iterating
                    if (is_array($printful_products)) :
                        foreach ($printful_products as $product) : 
                            // Check if product is an array and has required fields
                            if (!is_array($product) || !isset($product['id'])) {
                                echo '<li class="product-error">Invalid product data: ';
                                echo is_array($product) ? 'Missing ID field' : 'Not an array';
                                echo '</li>';
                                continue;
                            }
                            
                            try {
                                // Get WooCommerce product ID by Printful ID safely
                                $wc_product_id = null;
                                if (isset($this->printful_get_wc_product_by_printful_id) && is_callable($this->printful_get_wc_product_by_printful_id)) {
                                    $wc_product_id = $this->printful_get_wc_product_by_printful_id($product['id']);
                                } elseif (method_exists($this, 'get_wc_product_by_printful_id')) {
                                    $wc_product_id = $this->get_wc_product_by_printful_id($product['id']);
                                } else {
                                    // Fallback - manually get the product ID
                                    global $wpdb;
                                    $query = $wpdb->prepare(
                                        "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_printful_product_id' AND meta_value = %s LIMIT 1",
                                        $product['id']
                                    );
                                    $wc_product_id = $wpdb->get_var($query);
                                    $wc_product_id = $wc_product_id ? (int) $wc_product_id : null;
                                }
                                
                                // Get sync status
                                $is_synced = (bool)$wc_product_id;
                                $sync_status_class = $is_synced ? 'synced' : 'not-synced';
                                $sync_status_icon = $is_synced ? 'dashicons-yes-alt' : 'dashicons-no-alt';
                                $sync_status_text = $is_synced ? esc_html__('Synced', 'printful-resources') : esc_html__('Not synced', 'printful-resources');
                                
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
                                <li class="printful-product-item <?php echo $sync_status_class; ?>">
                                    <div class="product-card">
                                        <div class="product-image">
                                            <?php if (!empty($product['thumbnail_url'])) : ?>
                                                <img src="<?php echo esc_url($product['thumbnail_url']); ?>" alt="<?php echo isset($product['name']) ? esc_attr($product['name']) : ''; ?>">
                                            <?php else : ?>
                                                <div class="no-image">
                                                    <span class="dashicons dashicons-format-image"></span>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <div class="product-details">
                                            <h3 class="product-title"><?php echo isset($product['name']) ? esc_html($product['name']) : 'No name'; ?></h3>
                                            
                                            <div class="product-meta">
                                                <div class="product-id">
                                                    <strong><?php echo esc_html__('ID:', 'printful-resources'); ?></strong> 
                                                    <?php echo esc_html($product['id']); ?>
                                                </div>
                                                
                                                <?php if (isset($product['external_id'])) : ?>
                                                    <div class="product-external-id">
                                                        <strong><?php echo esc_html__('External ID:', 'printful-resources'); ?></strong>
                                                        <?php echo esc_html($product['external_id']); ?>
                                                    </div>
                                                <?php endif; ?>
                                                
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
                                            
                                            <div class="sync-status-wrapper">
                                                <div class="sync-status <?php echo $sync_status_class; ?>">
                                                    <span class="dashicons <?php echo $sync_status_icon; ?>"></span>
                                                    <?php echo esc_html($sync_status_text); ?>
                                                </div>
                                                
                                                <?php if ($is_synced) : ?>
                                                    <div class="wc-product-info">
                                                        <span><?php echo esc_html__('WC Product:', 'printful-resources'); ?></span> 
                                                        <?php echo esc_html($wc_product_title); ?>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                            
                                            <div class="product-actions">
                                                <?php if ($is_synced) : ?>
                                                    <a href="<?php echo esc_url($wc_product_edit_link); ?>" class="button button-small" target="_blank">
                                                        <span class="dashicons dashicons-edit"></span> <?php echo esc_html__('Edit', 'printful-resources'); ?>
                                                    </a>
                                                    <a href="<?php echo esc_url($wc_product_view_link); ?>" class="button button-small" target="_blank">
                                                        <span class="dashicons dashicons-visibility"></span> <?php echo esc_html__('View', 'printful-resources'); ?>
                                                    </a>
                                                <?php else : ?>
                                                    <button type="button" class="button button-primary button-small sync-single-product" data-product-id="<?php echo esc_attr($product['id']); ?>">
                                                        <span class="dashicons dashicons-update"></span> <?php echo esc_html__('Sync Now', 'printful-resources'); ?>
                                                    </button>
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
                    else:
                        echo '<li class="product-error">Error: $printful_products is not an array</li>';
                    endif;
                    ?>
                </ul>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

<?php
// Capture any errors that occurred
$debug_output = ob_get_clean();
if (empty($debug_output)) {
    // If no errors, just show the page normally
    echo $debug_output;
} else {
    // If there were errors, show them in a debug section
    ?>
    <div class="wrap">
        <h1><?php echo esc_html__('Printful Products', 'printful-resources'); ?></h1>
        
        <div class="notice notice-error">
            <p><?php echo esc_html__('Errors occurred while rendering the page. See details below:', 'printful-resources'); ?></p>
        </div>
        
        <div style="padding: 15px; background: #fff; border: 1px solid #ccd0d4; margin-top: 15px;">
            <h2><?php echo esc_html__('Debug Output', 'printful-resources'); ?></h2>
            <pre style="background: #f8f8f8; padding: 10px; overflow: auto; max-height: 300px; border: 1px solid #e5e5e5;"><?php echo esc_html($debug_output); ?></pre>
        </div>
        
        <div style="margin-top: 20px;">
            <h3><?php echo esc_html__('Raw Products Data', 'printful-resources'); ?></h3>
            <pre style="background: #f8f8f8; padding: 10px; overflow: auto; max-height: 300px; border: 1px solid #e5e5e5;">
                <?php 
                if (isset($printful_products)) {
                    // Only show first two products to avoid overwhelming output
                    $display_products = array_slice($printful_products, 0, 2, true);
                    print_r($display_products); 
                    
                    if (count($printful_products) > 2) {
                        echo "\n... " . (count($printful_products) - 2) . " more products ...";
                    }
                } else {
                    echo "Products variable not set";
                }
                ?>
            </pre>
        </div>
    </div>
    <?php
}

// Add script for debugging
if (isset($_GET['debug']) || (defined('WP_DEBUG') && WP_DEBUG)) {
    ?>
    <script>
        console.log('Debug mode active for Printful Products');
        
        // Log products array to console
        <?php if (isset($printful_products) && is_array($printful_products)) : ?>
        console.log('Products array:', <?php echo json_encode($printful_products); ?>);
        <?php else : ?>
        console.log('Products array not available or invalid');
        <?php endif; ?>
        
        // Add error tracking for JavaScript errors
        window.addEventListener('error', function(e) {
            console.error('JavaScript error:', e.message, 'at', e.filename, 'line', e.lineno);
            
            // Add error to the page
            var errorDiv = document.createElement('div');
            errorDiv.className = 'notice notice-error';
            errorDiv.innerHTML = '<p><strong>JavaScript Error:</strong> ' + e.message + ' at ' + e.filename + ' line ' + e.lineno + '</p>';
            
            document.querySelector('.wrap').prepend(errorDiv);
        });
    </script>
    <?php
}
?> 