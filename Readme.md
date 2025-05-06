printful-resources/
├── README.md
├── printful-resources.php                    # Main plugin file
├── uninstall.php                             # Uninstall script
├── includes/
│   ├── class-printful-api.php                # API handler class
│   ├── class-printful-product-sync.php       # Product synchronization class
│   ├── class-printful-order-sync.php         # Order synchronization class
│   ├── class-printful-shipping.php           # Shipping class
│   └── class-printful-shipping-method.php    # WooCommerce shipping method
├── admin/
│   ├── class-printful-admin.php              # Admin interface class
│   ├── css/
│   │   └── admin.css                         # Admin styles
│   ├── js/
│   │   └── admin.js                          # Admin JavaScript
│   └── views/
│       ├── dashboard.php                     # Dashboard page view
│       ├── products.php                      # Products page view
│       ├── orders.php                        # Orders page view
│       ├── settings.php                      # Settings page view
│       └── order-meta-box.php                # Order meta box view
└── languages/                                # Translation files (empty)
    └── printful-resources.pot                # POT file for translations