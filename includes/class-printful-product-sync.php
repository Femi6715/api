<?php
/**
 * Printful Product Synchronization
 *
 * @package Printful_Resources
 */

if (!defined('WPINC')) {
    die;
}

/**
 * Class Printful_Product_Sync
 * Handles product synchronization from Printful to WooCommerce
 */
class Printful_Product_Sync {
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
        
        // Add hooks for product sync
        add_action('printful_resources_scheduled_sync', [$this, 'sync_all_products']);
        add_action('wp_ajax_printful_sync_products', [$this, 'ajax_sync_products']);
        
        // Hook to product modifications in WooCommerce
        add_action('woocommerce_update_product', [$this, 'product_updated'], 10, 2);
        add_action('woocommerce_delete_product', [$this, 'product_deleted'], 10);
        
        // Schedule regular sync if not already scheduled
        if (!wp_next_scheduled('printful_resources_scheduled_sync')) {
            wp_schedule_event(time(), 'daily', 'printful_resources_scheduled_sync');
        }
    }

    /**
     * Sync all products from Printful to WooCommerce
     *
     * @param bool $force Force update even if no changes detected.
     * @return array Result of the sync operation.
     */
    public function sync_all_products($force = false) {
        try {
            // Enable error reporting for debugging
            error_log('Printful_Product_Sync: Starting product sync. Force update: ' . ($force ? 'yes' : 'no'));
            
            $result = [
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'deleted' => 0,
                'errors' => [],
                'debug_info' => [],
            ];
            
            // Get all products from Printful
            error_log('Printful_Product_Sync: Fetching products from Printful API');
            $result['debug_info'][] = 'Fetching products from Printful API';
            $printful_products = $this->get_all_printful_products();
            
            if (is_wp_error($printful_products)) {
                $error_message = $printful_products->get_error_message();
                error_log('Printful_Product_Sync: Error getting products: ' . $error_message);
                $result['errors'][] = $error_message;
                $result['debug_info'][] = 'Error getting products: ' . $error_message;
                return $result;
            }
            
            error_log('Printful_Product_Sync: Found ' . count($printful_products) . ' products in Printful');
            $result['debug_info'][] = 'Found ' . count($printful_products) . ' products in Printful';
            
            // Get all products from WooCommerce with Printful metadata
            error_log('Printful_Product_Sync: Getting WooCommerce products with Printful metadata');
            $result['debug_info'][] = 'Getting WooCommerce products with Printful metadata';
            $wc_products = $this->get_all_wc_printful_products();
            
            error_log('Printful_Product_Sync: Found ' . count($wc_products) . ' products in WooCommerce with Printful metadata');
            $result['debug_info'][] = 'Found ' . count($wc_products) . ' products in WooCommerce with Printful metadata';
            
            // Create an lookup of WC products by Printful ID
            $wc_products_by_printful_id = [];
            foreach ($wc_products as $wc_product) {
                $printful_id = get_post_meta($wc_product->get_id(), '_printful_product_id', true);
                if ($printful_id) {
                    $wc_products_by_printful_id[$printful_id] = $wc_product->get_id();
                }
            }
            
            // Process each Printful product
            error_log('Printful_Product_Sync: Starting to process products');
            $result['debug_info'][] = 'Starting to process products';
            
            foreach ($printful_products as $printful_product) {
                $printful_id = $printful_product['id'];
                $product_name = isset($printful_product['name']) ? $printful_product['name'] : 'Unknown';
                
                error_log('Printful_Product_Sync: Processing product ' . $product_name . ' (ID: ' . $printful_id . ')');
                $result['debug_info'][] = 'Processing product ' . $product_name . ' (ID: ' . $printful_id . ')';
                
                // Check if product already exists in WooCommerce
                if (isset($wc_products_by_printful_id[$printful_id])) {
                    $wc_product_id = $wc_products_by_printful_id[$printful_id];
                    
                    error_log('Printful_Product_Sync: Product exists in WooCommerce (ID: ' . $wc_product_id . '). Updating...');
                    $result['debug_info'][] = 'Product exists in WooCommerce (ID: ' . $wc_product_id . '). Updating...';
                    
                    // Update product
                    try {
                        $update_result = $this->update_wc_product($wc_product_id, $printful_product);
                        
                        if (is_wp_error($update_result)) {
                            $error_message = sprintf(
                                'Error updating product %s: %s',
                                $product_name,
                                $update_result->get_error_message()
                            );
                            error_log('Printful_Product_Sync: ' . $error_message);
                            $result['errors'][] = $error_message;
                            $result['debug_info'][] = $error_message;
                        } else if ($update_result) {
                            error_log('Printful_Product_Sync: Product updated successfully');
                            $result['debug_info'][] = 'Product updated successfully';
                            $result['updated']++;
                        } else {
                            error_log('Printful_Product_Sync: Product skipped (no changes)');
                            $result['debug_info'][] = 'Product skipped (no changes)';
                            $result['skipped']++;
                        }
                    } catch (Exception $e) {
                        $error_message = sprintf(
                            'Exception updating product %s: %s',
                            $product_name,
                            $e->getMessage()
                        );
                        error_log('Printful_Product_Sync: ' . $error_message);
                        $result['errors'][] = $error_message;
                        $result['debug_info'][] = $error_message;
                    }
                    
                    // Remove from WC list to track which ones to delete later
                    unset($wc_products_by_printful_id[$printful_id]);
                } else {
                    // Create new product
                    error_log('Printful_Product_Sync: Product does not exist in WooCommerce. Creating...');
                    $result['debug_info'][] = 'Product does not exist in WooCommerce. Creating...';
                    
                    try {
                        $create_result = $this->create_wc_product($printful_product);
                        
                        if (is_wp_error($create_result)) {
                            $error_message = sprintf(
                                'Error creating product %s: %s',
                                $product_name,
                                $create_result->get_error_message()
                            );
                            error_log('Printful_Product_Sync: ' . $error_message);
                            $result['errors'][] = $error_message;
                            $result['debug_info'][] = $error_message;
                        } else {
                            error_log('Printful_Product_Sync: Product created successfully (ID: ' . $create_result . ')');
                            $result['debug_info'][] = 'Product created successfully (ID: ' . $create_result . ')';
                            $result['created']++;
                        }
                    } catch (Exception $e) {
                        $error_message = sprintf(
                            'Exception creating product %s: %s',
                            $product_name,
                            $e->getMessage()
                        );
                        error_log('Printful_Product_Sync: ' . $error_message);
                        $result['errors'][] = $error_message;
                        $result['debug_info'][] = $error_message;
                    }
                }
            }
            
            // Any remaining WC products with Printful IDs not found in Printful should be deleted
            if (!empty($wc_products_by_printful_id)) {
                error_log('Printful_Product_Sync: Found ' . count($wc_products_by_printful_id) . ' products to potentially delete');
                $result['debug_info'][] = 'Found ' . count($wc_products_by_printful_id) . ' products to potentially delete';
                
                foreach ($wc_products_by_printful_id as $printful_id => $wc_product_id) {
                    $delete_option = get_option('printful_resources_delete_products', 'no');
                    
                    if ($delete_option === 'yes') {
                        error_log('Printful_Product_Sync: Deleting product (ID: ' . $wc_product_id . ')');
                        $result['debug_info'][] = 'Deleting product (ID: ' . $wc_product_id . ')';
                        wp_delete_post($wc_product_id, true);
                        $result['deleted']++;
                    } else {
                        error_log('Printful_Product_Sync: Product deletion skipped (delete option not enabled)');
                        $result['debug_info'][] = 'Product deletion skipped (delete option not enabled)';
                    }
                }
            }
            
            update_option('printful_resources_last_sync', time());
            error_log('Printful_Product_Sync: Sync completed. Created: ' . $result['created'] . ', Updated: ' . $result['updated'] . ', Skipped: ' . $result['skipped'] . ', Deleted: ' . $result['deleted']);
            $result['debug_info'][] = 'Sync completed. Created: ' . $result['created'] . ', Updated: ' . $result['updated'] . ', Skipped: ' . $result['skipped'] . ', Deleted: ' . $result['deleted'];
            
            return $result;
        } catch (Exception $e) {
            $error_message = 'Printful_Product_Sync: Exception in sync_all_products - ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
            error_log($error_message);
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return [
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'deleted' => 0,
                'errors' => [$e->getMessage()],
                'debug_info' => ['Exception: ' . $error_message, 'Stack trace: ' . $e->getTraceAsString()],
            ];
        }
    }

    /**
     * Get all products from Printful
     *
     * @return array|WP_Error List of products or error.
     */
    private function get_all_printful_products() {
        $products = [];
        $offset = 0;
        $limit = 100;
        $continue = true;
        
        while ($continue) {
            $response = $this->api->get_products($offset, $limit);
            
            if (is_wp_error($response)) {
                return $response;
            }
            
            if (!isset($response['result']) || !is_array($response['result'])) {
                return new WP_Error('printful_sync_error', __('Invalid response from Printful API', 'printful-resources'));
            }
            
            $batch = $response['result'];
            $products = array_merge($products, $batch);
            
            if (count($batch) < $limit) {
                $continue = false;
            } else {
                $offset += $limit;
            }
        }
        
        return $products;
    }

    /**
     * Get all WooCommerce products with Printful metadata
     *
     * @return array List of WC_Product objects.
     */
    private function get_all_wc_printful_products() {
        $args = [
            'limit' => -1,
            'status' => 'publish',
            'meta_key' => '_printful_product_id',
            'meta_compare' => 'EXISTS',
        ];
        
        return wc_get_products($args);
    }

    /**
     * Create a new WooCommerce product from Printful data
     *
     * @param array $printful_product Printful product data.
     * @return int|WP_Error Product ID or error.
     */
    public function create_wc_product($printful_product) {
        // Get detailed product info including variants
        $response = $this->api->get_product($printful_product['id']);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        if (!isset($response['result']) || !is_array($response['result'])) {
            return new WP_Error('printful_sync_error', __('Invalid product data from Printful API', 'printful-resources'));
        }
        
        $product_data = $response['result'];
        $variants = $product_data['sync_variants'];
        
        // Determine if this should be a simple or variable product
        $product_type = count($variants) > 1 ? 'variable' : 'simple';
        
        // Create the product
        $product = new WC_Product_Variable();
        if ($product_type === 'simple') {
            $product = new WC_Product_Simple();
        }
        
        // Set product data
        $product->set_name($product_data['sync_product']['name']);
        $product->set_description($product_data['sync_product']['description'] ?? '');
        $product->set_status('publish');
        
        // Set main image if available
        if (!empty($product_data['sync_product']['thumbnail_url'])) {
            $thumbnail_id = $this->upload_image_from_url($product_data['sync_product']['thumbnail_url'], $product_data['sync_product']['name']);
            
            if ($thumbnail_id) {
                $product->set_image_id($thumbnail_id);
            }
        }
        
        // Set product gallery images if available
        if (!empty($product_data['sync_product']['files'])) {
            $gallery_image_ids = [];
            
            foreach ($product_data['sync_product']['files'] as $file) {
                if ($file['type'] === 'preview') {
                    $image_id = $this->upload_image_from_url($file['preview_url'], $product_data['sync_product']['name'] . ' - ' . $file['filename']);
                    
                    if ($image_id) {
                        $gallery_image_ids[] = $image_id;
                    }
                }
            }
            
            if (!empty($gallery_image_ids)) {
                $product->set_gallery_image_ids($gallery_image_ids);
            }
        }
        
        // Handle product variations
        if ($product_type === 'variable') {
            $product->save(); // Save first to get ID for variations
            
            // Get or create the product attributes
            $attributes = $this->prepare_product_attributes($variants);
            $product->set_attributes($attributes);
            $product->save();
            
            // Create the variations
            foreach ($variants as $variant) {
                $this->create_product_variation($product->get_id(), $variant);
            }
        } else {
            // For simple products, set price from the variant
            $variant = reset($variants);
            $product->set_regular_price($variant['retail_price']);
            $product->set_price($variant['retail_price']);
            
            // Set SKU, stock status etc.
            $product->set_sku($variant['sku']);
            $product->set_manage_stock(false);
            $product->set_stock_status('instock');
        }
        
        // Set Printful metadata
        $product->update_meta_data('_printful_product_id', $product_data['sync_product']['id']);
        $product->update_meta_data('_printful_product_data', $product_data);
        
        $product->save();
        
        // Add product to printful category if it exists
        $term = term_exists('printful', 'product_cat');
        if (!$term) {
            $term = wp_insert_term('Printful', 'product_cat');
        }
        
        if (!is_wp_error($term)) {
            wp_set_object_terms($product->get_id(), $term['term_id'], 'product_cat', true);
        }
        
        return $product->get_id();
    }

    /**
     * Update an existing WooCommerce product with Printful data
     *
     * @param int $wc_product_id WooCommerce product ID.
     * @param array $printful_product Printful product data.
     * @return bool|WP_Error True if updated, false if no changes, or error.
     */
    public function update_wc_product($wc_product_id, $printful_product) {
        $wc_product = wc_get_product($wc_product_id);
        
        if (!$wc_product) {
            return new WP_Error('printful_sync_error', __('WooCommerce product not found', 'printful-resources'));
        }
        
        // Get the stored Printful data
        $stored_printful_data = $wc_product->get_meta('_printful_product_data');
        
        // Get detailed product info from Printful
        $response = $this->api->get_product($printful_product['id']);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        if (!isset($response['result']) || !is_array($response['result'])) {
            return new WP_Error('printful_sync_error', __('Invalid product data from Printful API', 'printful-resources'));
        }
        
        $product_data = $response['result'];
        
        // Check if anything has changed
        if (isset($stored_printful_data['sync_product']['updated']) && 
            isset($product_data['sync_product']['updated']) && 
            $stored_printful_data['sync_product']['updated'] === $product_data['sync_product']['updated']) {
            
            // If the product hasn't been updated in Printful, skip it
            return false;
        }
        
        // Update product data
        $wc_product->set_name($product_data['sync_product']['name']);
        $wc_product->set_description($product_data['sync_product']['description'] ?? '');
        
        // Update main image if available
        if (!empty($product_data['sync_product']['thumbnail_url'])) {
            $thumbnail_id = $this->upload_image_from_url($product_data['sync_product']['thumbnail_url'], $product_data['sync_product']['name']);
            
            if ($thumbnail_id) {
                $wc_product->set_image_id($thumbnail_id);
            }
        }
        
        // Update product gallery images if available
        if (!empty($product_data['sync_product']['files'])) {
            $gallery_image_ids = [];
            
            foreach ($product_data['sync_product']['files'] as $file) {
                if ($file['type'] === 'preview') {
                    $image_id = $this->upload_image_from_url($file['preview_url'], $product_data['sync_product']['name'] . ' - ' . $file['filename']);
                    
                    if ($image_id) {
                        $gallery_image_ids[] = $image_id;
                    }
                }
            }
            
            if (!empty($gallery_image_ids)) {
                $wc_product->set_gallery_image_ids($gallery_image_ids);
            }
        }
        
        $variants = $product_data['sync_variants'];
        
        // Handle product variations
        if ($wc_product->is_type('variable')) {
            // Update attributes
            $attributes = $this->prepare_product_attributes($variants);
            $wc_product->set_attributes($attributes);
            $wc_product->save();
            
            // Get existing variations
            $variation_ids = $wc_product->get_children();
            $variations_by_sku = [];
            
            foreach ($variation_ids as $variation_id) {
                $variation = wc_get_product($variation_id);
                $variations_by_sku[$variation->get_sku()] = $variation_id;
            }
            
            // Update/create variations
            foreach ($variants as $variant) {
                if (isset($variations_by_sku[$variant['sku']])) {
                    // Update existing variation
                    $this->update_product_variation($variations_by_sku[$variant['sku']], $variant);
                } else {
                    // Create new variation
                    $this->create_product_variation($wc_product->get_id(), $variant);
                }
            }
            
            // Remove variations not present in Printful
            $printful_skus = array_map(function($variant) {
                return $variant['sku'];
            }, $variants);
            
            foreach ($variations_by_sku as $sku => $variation_id) {
                if (!in_array($sku, $printful_skus)) {
                    wp_delete_post($variation_id, true);
                }
            }
        } else if ($wc_product->is_type('simple')) {
            // For simple products, update price from the variant
            $variant = reset($variants);
            $wc_product->set_regular_price($variant['retail_price']);
            $wc_product->set_price($variant['retail_price']);
            $wc_product->set_sku($variant['sku']);
        }
        
        // Update Printful metadata
        $wc_product->update_meta_data('_printful_product_id', $product_data['sync_product']['id']);
        $wc_product->update_meta_data('_printful_product_data', $product_data);
        
        $wc_product->save();
        
        return true;
    }

    /**
     * Prepare product attributes from variant data
     *
     * @param array $variants Product variants.
     * @return array WooCommerce product attributes.
     */
    private function prepare_product_attributes($variants) {
        $attributes = [];
        $attribute_options = [];
        
        // Extract attribute names and values from variants
        foreach ($variants as $variant) {
            if (!empty($variant['options']) && is_array($variant['options'])) {
                foreach ($variant['options'] as $option_name => $option_value) {
                    // Ensure name and value are strings
                    $name = is_array($option_name) ? 'option-' . md5(serialize($option_name)) : $option_name;
                    $value = is_array($option_value) ? json_encode($option_value) : $option_value;
                    
                    if (!isset($attribute_options[$name])) {
                        $attribute_options[$name] = [];
                    }
                    $attribute_options[$name][] = $value;
                }
            }
        }
        
        // Create WooCommerce attributes
        foreach ($attribute_options as $name => $values) {
            $values = array_unique($values);
            
            $attribute = new WC_Product_Attribute();
            $attribute->set_name(wc_clean($name));
            $attribute->set_options($values);
            $attribute->set_position(sizeof($attributes));
            $attribute->set_visible(true);
            $attribute->set_variation(true);
            
            $attributes[] = $attribute;
        }
        
        return $attributes;
    }

    /**
     * Create a product variation
     *
     * @param int $product_id Parent product ID.
     * @param array $variant_data Variant data.
     * @return int Variation ID.
     */
    private function create_product_variation($product_id, $variant_data) {
        // Create new variation
        $variation = new WC_Product_Variation();
        $variation->set_parent_id($product_id);
        $variation->set_regular_price($variant_data['retail_price']);
        $variation->set_price($variant_data['retail_price']);
        $variation->set_sku($variant_data['sku']);
        $variation->set_manage_stock(false);
        $variation->set_stock_status('instock');
        
        // Set variation attributes
        $variation_attributes = [];
        
        if (!empty($variant_data['options']) && is_array($variant_data['options'])) {
            foreach ($variant_data['options'] as $name => $value) {
                // Ensure name and value are strings
                $option_name = is_array($name) ? 'option-' . md5(serialize($name)) : $name;
                $option_value = is_array($value) ? json_encode($value) : $value;
                
                $taxonomy = wc_attribute_taxonomy_name($option_name);
                $attribute_term_name = $option_value;
                
                if (taxonomy_exists($taxonomy)) {
                    $attribute_term = get_term_by('name', $attribute_term_name, $taxonomy);
                    if ($attribute_term) {
                        $attribute_term_name = $attribute_term->slug;
                    }
                    $variation_attributes[$taxonomy] = $attribute_term_name;
                } else {
                    // Make sure we're passing strings to sanitize_title
                    $sanitized_name = sanitize_title($option_name);
                    $sanitized_value = sanitize_title($option_value);
                    
                    $variation_attributes["attribute_" . $sanitized_name] = $sanitized_value;
                }
            }
        }
        
        $variation->set_attributes($variation_attributes);
        
        // Set variation image if available
        if (!empty($variant_data['files']) && is_array($variant_data['files'])) {
            foreach ($variant_data['files'] as $file) {
                if (!empty($file['preview_url']) && $file['type'] === 'preview') {
                    $image_id = $this->upload_image_from_url($file['preview_url'], $variant_data['name']);
                    
                    if ($image_id) {
                        $variation->set_image_id($image_id);
                        break;
                    }
                }
            }
        }
        
        // Save variation
        $variation_id = $variation->save();
        
        // Store Printful variant data
        update_post_meta($variation_id, '_printful_variant_id', $variant_data['id']);
        update_post_meta($variation_id, '_printful_variant_data', $variant_data);
        
        return $variation_id;
    }

    /**
     * Update a product variation
     *
     * @param int $variation_id Variation ID.
     * @param array $variant_data Variant data.
     * @return int Variation ID.
     */
    private function update_product_variation($variation_id, $variant_data) {
        $variation = wc_get_product($variation_id);
        
        if (!$variation) {
            return 0;
        }
        
        // Update variation data
        $variation->set_regular_price($variant_data['retail_price']);
        $variation->set_price($variant_data['retail_price']);
        $variation->set_sku($variant_data['sku']);
        
        // Update attributes if they exist
        if (!empty($variant_data['options']) && is_array($variant_data['options'])) {
            $variation_attributes = [];
            
            foreach ($variant_data['options'] as $name => $value) {
                // Ensure name and value are strings
                $option_name = is_array($name) ? 'option-' . md5(serialize($name)) : $name;
                $option_value = is_array($value) ? json_encode($value) : $value;
                
                $taxonomy = wc_attribute_taxonomy_name($option_name);
                $attribute_term_name = $option_value;
                
                if (taxonomy_exists($taxonomy)) {
                    $attribute_term = get_term_by('name', $attribute_term_name, $taxonomy);
                    if ($attribute_term) {
                        $attribute_term_name = $attribute_term->slug;
                    }
                    $variation_attributes[$taxonomy] = $attribute_term_name;
                } else {
                    // Make sure we're passing strings to sanitize_title
                    $sanitized_name = sanitize_title($option_name);
                    $sanitized_value = sanitize_title($option_value);
                    
                    $variation_attributes["attribute_" . $sanitized_name] = $sanitized_value;
                }
            }
            
            $variation->set_attributes($variation_attributes);
        }
        
        // Update variation image if available
        if (!empty($variant_data['files']) && is_array($variant_data['files'])) {
            foreach ($variant_data['files'] as $file) {
                if (!empty($file['preview_url']) && $file['type'] === 'preview') {
                    $image_id = $this->upload_image_from_url($file['preview_url'], $variant_data['name']);
                    
                    if ($image_id) {
                        $variation->set_image_id($image_id);
                        break;
                    }
                }
            }
        }
        
        // Save variation
        $variation_id = $variation->save();
        
        // Update Printful variant data
        update_post_meta($variation_id, '_printful_variant_id', $variant_data['id']);
        update_post_meta($variation_id, '_printful_variant_data', $variant_data);
        
        return $variation_id;
    }

    /**
     * Upload an image from a URL
     *
     * @param string $url Image URL.
     * @param string $title Image title.
     * @return int|false Attachment ID on success, false on failure.
     */
    private function upload_image_from_url($url, $title = '') {
        // Check if image already exists in the media library
        $existing_id = $this->get_existing_image_id($url);
        
        if ($existing_id) {
            return $existing_id;
        }
        
        // Get WP upload directory
        $upload_dir = wp_upload_dir();
        
        // Generate a unique filename
        $filename = wp_unique_filename($upload_dir['path'], basename($url));
        
        // Download image from URL
        $response = wp_remote_get($url, [
            'timeout' => 30,
            'sslverify' => false,
        ]);
        
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return false;
        }
        
        $image_data = wp_remote_retrieve_body($response);
        
        // Save image to upload directory
        $file_path = $upload_dir['path'] . '/' . $filename;
        file_put_contents($file_path, $image_data);
        
        // Check if file was saved
        if (!file_exists($file_path)) {
            return false;
        }
        
        // Get file type
        $file_type = wp_check_filetype($filename, null);
        
        // Prepare attachment data
        $attachment = [
            'post_mime_type' => $file_type['type'],
            'post_title' => $title ?: preg_replace('/\.[^.]+$/', '', $filename),
            'post_content' => '',
            'post_status' => 'inherit',
        ];
        
        // Insert attachment
        $attachment_id = wp_insert_attachment($attachment, $file_path);
        
        if (!$attachment_id) {
            return false;
        }
        
        // Include necessary file for wp_generate_attachment_metadata()
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        // Generate metadata for the attachment
        $attachment_data = wp_generate_attachment_metadata($attachment_id, $file_path);
        wp_update_attachment_metadata($attachment_id, $attachment_data);
        
        // Store the source URL as meta to check for duplicates later
        update_post_meta($attachment_id, '_printful_image_source', $url);
        
        return $attachment_id;
    }

    /**
     * Get existing image ID by source URL
     *
     * @param string $url Image URL.
     * @return int|false Attachment ID if exists, false otherwise.
     */
    private function get_existing_image_id($url) {
        global $wpdb;
        
        $attachment_id = $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_printful_image_source' AND meta_value = %s LIMIT 1",
            $url
        ));
        
        return $attachment_id ? (int) $attachment_id : false;
    }

    /**
     * Handle product update in WooCommerce
     *
     * @param int $product_id WooCommerce product ID.
     * @param WC_Product $product WooCommerce product.
     */
    public function product_updated($product_id, $product) {
        // Check if this is a Printful product
        $printful_id = $product->get_meta('_printful_product_id');
        
        if (!$printful_id) {
            return;
        }
        
        // Get current Printful data
        $printful_data = $product->get_meta('_printful_product_data');
        
        if (!$printful_data) {
            return;
        }
        
        // Get sync settings
        $sync_to_printful = get_option('printful_resources_sync_to_printful', 'no');
        
        if ($sync_to_printful !== 'yes') {
            return;
        }
        
        // Update product in Printful
        // This is a placeholder for the actual implementation to update Printful
        // based on the WooCommerce changes
    }

    /**
     * Handle product deletion in WooCommerce
     *
     * @param int $product_id WooCommerce product ID.
     */
    public function product_deleted($product_id) {
        $printful_id = get_post_meta($product_id, '_printful_product_id', true);
        
        if (!$printful_id) {
            return;
        }
        
        // Get sync settings
        $delete_from_printful = get_option('printful_resources_delete_from_printful', 'no');
        
        if ($delete_from_printful !== 'yes') {
            return;
        }
        
        // Delete product from Printful
        $this->api->delete_product($printful_id);
    }

    /**
     * AJAX handler for product synchronization
     */
    public function ajax_sync_products() {
        try {
            // Check nonce
            if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'printful_resources_nonce')) {
                wp_send_json_error(['message' => __('Security check failed', 'printful-resources')]);
                return;
            }
            
            // Check user capability
            if (!current_user_can('manage_woocommerce')) {
                wp_send_json_error(['message' => __('You do not have permission to do this', 'printful-resources')]);
                return;
            }
            
            // Check if this is a single product sync
            if (isset($_POST['single']) && $_POST['single'] && isset($_POST['product_id'])) {
                $product_id = intval($_POST['product_id']);
                
                // Log the start of the sync for debugging
                error_log('Printful: Starting single product sync for product ID: ' . $product_id);
                
                // Get the product data from Printful
                $response = $this->api->get_product($product_id);
                
                if (is_wp_error($response)) {
                    $error_message = $response->get_error_message();
                    error_log('Printful: Error getting product from API: ' . $error_message);
                    wp_send_json_error([
                        'message' => __('Error getting product from Printful', 'printful-resources'),
                        'error' => $error_message
                    ]);
                    return;
                }
                
                if (!isset($response['result']) || !is_array($response['result'])) {
                    error_log('Printful: Invalid product data received from API: ' . print_r($response, true));
                    wp_send_json_error([
                        'message' => __('Invalid product data from Printful API', 'printful-resources'),
                        'data' => $response
                    ]);
                    return;
                }
                
                $product_data = $response['result'];
                
                // Check if product exists in WooCommerce
                $wc_product_id = $this->get_wc_product_by_printful_id($product_id);
                error_log('Printful: WC product ID for Printful ID ' . $product_id . ' is: ' . ($wc_product_id ? $wc_product_id : 'not found'));
                
                $result = [];
                
                if ($wc_product_id) {
                    // Update existing product
                    error_log('Printful: Updating existing WC product ID: ' . $wc_product_id);
                    
                    // Make sure we're passing the correct data structure
                    if (!isset($product_data['sync_product']) || !is_array($product_data['sync_product'])) {
                        error_log('Printful: Product data missing sync_product field: ' . print_r($product_data, true));
                        wp_send_json_error([
                            'message' => __('Invalid product data structure from Printful API', 'printful-resources'),
                            'error' => 'Missing sync_product data'
                        ]);
                        return;
                    }
                    
                    $update_result = $this->update_wc_product($wc_product_id, $product_data['sync_product']);
                    
                    if (is_wp_error($update_result)) {
                        $error_message = $update_result->get_error_message();
                        error_log('Printful: Error updating product: ' . $error_message);
                        wp_send_json_error([
                            'message' => __('Error updating product', 'printful-resources'),
                            'error' => $error_message
                        ]);
                        return;
                    }
                    
                    $result = [
                        'updated' => 1,
                        'created' => 0,
                        'product_id' => $wc_product_id
                    ];
                    error_log('Printful: Product update successful for WC product ID: ' . $wc_product_id);
                } else {
                    // Create new product
                    error_log('Printful: Creating new product from Printful ID: ' . $product_id);
                    
                    // Make sure we're passing the correct data structure
                    if (!isset($product_data['sync_product']) || !is_array($product_data['sync_product'])) {
                        error_log('Printful: Product data missing sync_product field: ' . print_r($product_data, true));
                        wp_send_json_error([
                            'message' => __('Invalid product data structure from Printful API', 'printful-resources'),
                            'error' => 'Missing sync_product data'
                        ]);
                        return;
                    }
                    
                    $create_result = $this->create_wc_product($product_data['sync_product']);
                    
                    if (is_wp_error($create_result)) {
                        $error_message = $create_result->get_error_message();
                        error_log('Printful: Error creating product: ' . $error_message);
                        wp_send_json_error([
                            'message' => __('Error creating product', 'printful-resources'),
                            'error' => $error_message
                        ]);
                        return;
                    }
                    
                    $result = [
                        'updated' => 0,
                        'created' => 1,
                        'product_id' => $create_result
                    ];
                    error_log('Printful: Product creation successful, new WC product ID: ' . $create_result);
                }
                
                wp_send_json_success([
                    'message' => __('Product synced successfully', 'printful-resources'),
                    'result' => $result
                ]);
                return;
            }
            
            // Force update for bulk syncs
            $force = isset($_POST['force']) && $_POST['force'] === 'true';
            error_log('Printful: Starting bulk product sync. Force update: ' . ($force ? 'yes' : 'no'));
            
            // Sync all products
            $result = $this->sync_all_products($force);
            
            if (!empty($result['errors'])) {
                error_log('Printful: Bulk sync completed with errors: ' . print_r($result['errors'], true));
                wp_send_json_error([
                    'message' => __('Sync completed with errors', 'printful-resources'),
                    'result' => $result,
                ]);
            } else {
                error_log('Printful: Bulk sync completed successfully. Created: ' . $result['created'] . ', Updated: ' . $result['updated']);
                wp_send_json_success([
                    'message' => __('Sync completed successfully', 'printful-resources'),
                    'result' => $result,
                ]);
            }
        } catch (Exception $e) {
            // Catch any unexpected exceptions
            $error_message = 'Printful AJAX Exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
            error_log($error_message);
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            wp_send_json_error([
                'message' => __('An unexpected error occurred', 'printful-resources'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    /**
     * Get WooCommerce product ID by Printful ID
     *
     * @param int $printful_id Printful product ID.
     * @return int|null WooCommerce product ID or null if not found.
     */
    public function get_wc_product_by_printful_id($printful_id) {
        global $wpdb;
        
        $query = $wpdb->prepare(
            "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_printful_product_id' AND meta_value = %s LIMIT 1",
            $printful_id
        );
        
        $wc_product_id = $wpdb->get_var($query);
        
        return $wc_product_id ? intval($wc_product_id) : null;
    }
} 