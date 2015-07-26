/*!
 * WooCommerce Custom Scripts
 *
 * Functions used to add custom functionality to WooCommerce integration
 *
 */

 /*!
  * Variations Plugin
  */
 ;(function ( $, window, document, undefined ) {

 	jQuery.fn.wc_variation_form = function () {

 		jQuery.fn.wc_variation_form.find_matching_variations = function( product_variations, settings ) {
 			var matching = [];

 			for ( var i = 0; i < product_variations.length; i++ ) {
 				var variation = product_variations[i];
 				var variation_id = variation.variation_id;

 				if ( jQuery.fn.wc_variation_form.variations_match( variation.attributes, settings ) ) {
 					matching.push( variation );
 				}
 			}

 			return matching;
 		};

 		jQuery.fn.wc_variation_form.variations_match = function( attrs1, attrs2 ) {
 			var match = true;

 			for ( var attr_name in attrs1 ) {
 				if ( attrs1.hasOwnProperty( attr_name ) ) {
 					var val1 = attrs1[ attr_name ];
 					var val2 = attrs2[ attr_name ];

 					if ( val1 !== undefined && val2 !== undefined && val1.length !== 0 && val2.length !== 0 && val1 !== val2 ) {
 						match = false;
 					}
 				}
 			}

 			return match;
 		};

 		// Unbind any existing events
 		this.unbind( 'check_variations update_variation_values found_variation' );
 		this.find( '.reset_variations' ).unbind( 'click' );
 		this.find( '.variations select' ).unbind( 'change focusin' );

 		// Bind events
 		$form = this

 			// On clicking the reset variation button
 			.on( 'click', '.reset_variations', function( event ) {

 				jQuery( this ).closest( '.variations_form' ).find( '.variations select' ).val( '' ).change();

 				var $sku = jQuery( this ).closest( '.product' ).find( '.sku' ),
 					$weight = jQuery( this ).closest( '.product' ).find( '.product_weight' ),
 					$dimensions = jQuery( this ).closest( '.product' ).find( '.product_dimensions' );

 				if ( $sku.attr( 'data-o_sku' ) )
 					$sku.text( $sku.attr( 'data-o_sku' ) );

 				if ( $weight.attr( 'data-o_weight' ) )
 					$weight.text( $weight.attr( 'data-o_weight' ) );

 				if ( $dimensions.attr( 'data-o_dimensions' ) )
 					$dimensions.text( $dimensions.attr( 'data-o_dimensions' ) );

 				return false;
 			} )

 			// Upon changing an option
 			.on( 'change', '.variations select', function( event ) {

 				$variation_form = jQuery( this ).closest( '.variations_form' );
 				$variation_form.find( 'input[name=variation_id]' ).val( '' ).change();

 				$variation_form
 					.trigger( 'woocommerce_variation_select_change' )
 					.trigger( 'check_variations', [ '', false ] );

 				jQuery( this ).blur();

 				if( jQuery().uniform && jQuery.isFunction( jQuery.uniform.update ) ) {
 					jQuery.uniform.update();
 				}

 			} )

 			// Upon gaining focus
 			.on( 'focusin touchstart', '.variations select', function( event ) {

 				$variation_form = jQuery( this ).closest( '.variations_form' );

 				$variation_form
 					.trigger( 'woocommerce_variation_select_focusin' )
 					.trigger( 'check_variations', [ jQuery( this ).attr( 'name' ), true ] );

 			} )

 			// Check variations
 			.on( 'check_variations', function( event, exclude, focus ) {
 				var all_set = true,
 					any_set = false,
 					showing_variation = false,
 					current_settings = {},
 					$variation_form = jQuery( this ),
 					$reset_variations = $variation_form.find( '.reset_variations' );

 				$variation_form.find( '.variations select' ).each( function() {

 					if ( jQuery( this ).val().length === 0 ) {
 						all_set = false;
 					} else {
 						any_set = true;
 					}

 					if ( exclude && jQuery( this ).attr( 'name' ) === exclude ) {

 						all_set = false;
 						current_settings[jQuery( this ).attr( 'name' )] = '';

 					} else {

 						// Encode entities
 						value = jQuery( this ).val();

 						// Add to settings array
 						current_settings[ jQuery( this ).attr( 'name' ) ] = value;
 					}

 				});

 				var product_id = parseInt( $variation_form.data( 'product_id' ) ),
 					all_variations = $variation_form.data( 'product_variations' );

 				// Fallback to window property if not set - backwards compat
 				if ( ! all_variations )
 					all_variations = window.product_variations.product_id;
 				if ( ! all_variations )
 					all_variations = window.product_variations;
 				if ( ! all_variations )
 					all_variations = window['product_variations_' + product_id ];

 				var matching_variations = jQuery.fn.wc_variation_form.find_matching_variations( all_variations, current_settings );

 				if ( all_set ) {

 					var variation = matching_variations.shift();

 					if ( variation ) {

 						// Found - set ID
 						$variation_form
 							.find( 'input[name=variation_id]' )
 							.val( variation.variation_id )
 							.change();

 						$variation_form.trigger( 'found_variation', [ variation ] );

 					} else {

 						// Nothing found - reset fields
 						$variation_form.find( '.variations select' ).val( '' );

 						if ( ! focus )
 							$variation_form.trigger( 'reset_image' );

 						alert( wc_add_to_cart_variation_params.i18n_no_matching_variations_text );

 					}

 				} else {

 					$variation_form.trigger( 'update_variation_values', [ matching_variations ] );

 					if ( ! focus )
 						$variation_form.trigger( 'reset_image' );

 					if ( ! exclude ) {
 						$variation_form.find( '.single_variation_wrap' ).slideUp( 200 );
 					}

 				}

 				if ( any_set ) {

 					if ( $reset_variations.css( 'visibility' ) === 'hidden' )
 						$reset_variations.css( 'visibility', 'visible' ).hide().fadeIn();

 				} else {

 					$reset_variations.css( 'visibility', 'hidden' );

 				}

 			} )

 			// Reset product image
 			.on( 'reset_image', function( event ) {

 				var $product = jQuery(this).closest( '.product' ),
 					$product_img = $product.find( '.single-product-main-images img:eq(0)' ),
 					$product_link = $product.find( '.single-product-main-images a.zoom:eq(0)' ),
 					o_src = $product_img.attr( 'data-o_src' ),
 					o_title = $product_img.attr( 'data-o_title' ),
 					o_alt = $product_img.attr( 'data-o_alt' ),
 					o_href = $product_link.attr( 'data-o_href' ),
 					$product_slider = $product.find(".single-product-main-images").data('owlCarousel');

 				if ( o_src !== undefined ) {
 					$product_img
 						.attr( 'src', o_src );
 				}

 				if ( o_href !== undefined ) {
 					$product_link
 						.attr( 'href', o_href );
 				}

 				if ( o_title !== undefined ) {
 					$product_img
 						.attr( 'title', o_title );
 					$product_link
 						.attr( 'title', o_title );
 				}

 				if ( o_alt !== undefined ) {
 					$product_img
 						.attr( 'alt', o_alt );
 				}

 				// Restart Carousel Slide
 				if( $product_slider != undefined )
 					$product_slider.goTo( 0 );

 			} )

 			// Disable option fields that are unavaiable for current set of attributes
 			.on( 'update_variation_values', function( event, variations ) {

 				$variation_form = jQuery( this ).closest( '.variations_form' );

 				// Loop through selects and disable/enable options based on selections
 				$variation_form.find( '.variations select' ).each( function( index, el ) {

 					current_attr_select = jQuery( el );

 					// Reset options
 					if ( ! current_attr_select.data( 'attribute_options' ) )
 						current_attr_select.data( 'attribute_options', current_attr_select.find( 'option:gt(0)' ).get() );

 					current_attr_select.find( 'option:gt(0)' ).remove();
 					current_attr_select.append( current_attr_select.data( 'attribute_options' ) );
 					current_attr_select.find( 'option:gt(0)' ).removeClass( 'active' );

 					// Get name
 					var current_attr_name = current_attr_select.attr( 'name' );

 					// Loop through variations
 					for ( var num in variations ) {

 						if ( typeof( variations[ num ] ) != 'undefined' ) {

 							var attributes = variations[ num ].attributes;

 							for ( var attr_name in attributes ) {
 								if ( attributes.hasOwnProperty( attr_name ) ) {
 									var attr_val = attributes[ attr_name ];

 									if ( attr_name == current_attr_name ) {

 										if ( attr_val ) {

 											// Decode entities
 											attr_val = jQuery( '<div/>' ).html( attr_val ).text();

 											// Add slashes
 											attr_val = attr_val.replace( /'/g, "\\'" );
 											attr_val = attr_val.replace( /"/g, "\\\"" );

 											// Compare the meerkat
 											current_attr_select.find( 'option[value="' + attr_val + '"]' ).addClass( 'active' );

 										} else {

 											current_attr_select.find( 'option:gt(0)' ).addClass( 'active' );

 										}
 									}
 								}
 							}
 						}
 					}

 					// Detach inactive
 					current_attr_select.find( 'option:gt(0):not(.active)' ).remove();

 				});

 				// Custom event for when variations have been updated
 				$variation_form.trigger( 'woocommerce_update_variation_values' );

 			} )

 			// Show single variation details (price, stock, image)
 			.on( 'found_variation', function( event, variation ) {
 				var $variation_form = jQuery( this ),
 					$product = jQuery( this ).closest( '.product' ),
 					$product_img = $product.find( '.single-product-main-images img:eq(0)' ),
 					$product_link = $product.find( '.single-product-main-images a.zoom:eq(0)' ),
 					o_src = $product_img.attr( 'data-o_src' ),
 					o_title = $product_img.attr( 'data-o_title' ),
 					o_alt = $product_img.attr( 'data-o_alt' ),
 					o_href = $product_link.attr( 'data-o_href' ),
 					variation_image = variation.image_src,
 					variation_link  = variation.image_link,
 					variation_title = variation.image_title,
 					variation_alt = variation.image_alt,
 					$product_slider = $product.find(".single-product-main-images").data('owlCarousel');

 				$variation_form.find( '.variations_button' ).show();
 				$variation_form.find( '.single_variation' ).html( variation.price_html + variation.availability_html );

 				if ( o_src === undefined ) {
 					o_src = ( ! $product_img.attr( 'src' ) ) ? '' : $product_img.attr( 'src' );
 					$product_img.attr( 'data-o_src', o_src );
 				}

 				if ( o_href === undefined ) {
 					o_href = ( ! $product_link.attr( 'href' ) ) ? '' : $product_link.attr( 'href' );
 					$product_link.attr( 'data-o_href', o_href );
 				}

 				if ( o_title === undefined ) {
 					o_title = ( ! $product_img.attr( 'title' ) ) ? '' : $product_img.attr( 'title' );
 					$product_img.attr( 'data-o_title', o_title );
 				}

 				if ( o_alt === undefined ) {
 					o_alt = ( ! $product_img.attr( 'alt' ) ) ? '' : $product_img.attr( 'alt' );
 					$product_img.attr( 'data-o_alt', o_alt );
 				}

 				if ( variation_image && variation_image.length > 1 ) {
 					$product_img
 						.attr( 'src', variation_image )
 						.attr( 'alt', variation_alt )
 						.attr( 'title', variation_title );
 					$product_link
 						.attr( 'href', variation_link )
 						.attr( 'title', variation_title );
 				} else {
 					$product_img
 						.attr( 'src', o_src )
 						.attr( 'alt', o_alt )
 						.attr( 'title', o_title );
 					$product_link
 						.attr( 'href', o_href )
 						.attr( 'o_title', o_title );
 				}

 				// Restart Carousel Slide
 				if( $product_slider != undefined )
 					$product_slider.goTo( 0 );

 				var $single_variation_wrap = $variation_form.find( '.single_variation_wrap' ),
 					$sku = $product.find( '.product_meta' ).find( '.sku' ),
 					$weight = $product.find( '.product_weight' ),
 					$dimensions = $product.find( '.product_dimensions' );

 				if ( ! $sku.attr( 'data-o_sku' ) )
 					$sku.attr( 'data-o_sku', $sku.text() );

 				if ( ! $weight.attr( 'data-o_weight' ) )
 					$weight.attr( 'data-o_weight', $weight.text() );

 				if ( ! $dimensions.attr( 'data-o_dimensions' ) )
 					$dimensions.attr( 'data-o_dimensions', $dimensions.text() );

 				if ( variation.sku ) {
 					$sku.text( variation.sku );
 				} else {
 					$sku.text( $sku.attr( 'data-o_sku' ) );
 				}

 				if ( variation.weight ) {
 					$weight.text( variation.weight );
 				} else {
 					$weight.text( $weight.attr( 'data-o_weight' ) );
 				}

 				if ( variation.dimensions ) {
 					$dimensions.text( variation.dimensions );
 				} else {
 					$dimensions.text( $dimensions.attr( 'data-o_dimensions' ) );
 				}

 				$single_variation_wrap.find( '.quantity' ).show();

 				if ( ! variation.is_purchasable || ! variation.is_in_stock || ! variation.variation_is_visible ) {
 					$variation_form.find( '.variations_button' ).hide();
 				}

 				if ( ! variation.variation_is_visible ) {
 					$variation_form.find( '.single_variation' ).html( '<p>' + wc_add_to_cart_variation_params.i18n_unavailable_text + '</p>' );
 				}

 				if ( variation.min_qty )
 					$single_variation_wrap.find( 'input[name=quantity]' ).attr( 'min', variation.min_qty ).val( variation.min_qty );
 				else
 					$single_variation_wrap.find( 'input[name=quantity]' ).removeAttr( 'min' );

 				if ( variation.max_qty )
 					$single_variation_wrap.find( 'input[name=quantity]' ).attr( 'max', variation.max_qty );
 				else
 					$single_variation_wrap.find( 'input[name=quantity]' ).removeAttr( 'max' );

 				if ( variation.is_sold_individually === 'yes' ) {
 					$single_variation_wrap.find( 'input[name=quantity]' ).val( '1' );
 					$single_variation_wrap.find( '.quantity' ).hide();
 				}

 				$single_variation_wrap.slideDown( 200 ).trigger( 'show_variation', [ variation ] );

 			});

 		$form.trigger( 'wc_variation_form' );

 		return $form;
 	};

 	jQuery( function() {

 		// wc_add_to_cart_variation_params is required to continue, ensure the object exists
 		if ( typeof wc_add_to_cart_variation_params === 'undefined' ) {
 			return false;
 		}

 		jQuery( '.variations_form' ).wc_variation_form();
 		jQuery( '.variations_form .variations select' ).change();
 	});

 })( jQuery, window, document );

function ivan_woo_back_image() {
	"use strict";

	jQuery('li.product').hover( function() {
		"use strict";

		if( jQuery(this).find('.back-image').length > 0 ) {
			jQuery(this).find('.frontal-image').css('opacity', '0');
			jQuery(this).find('.back-image').css('opacity', '1');
		}

	}, function() {
		"use strict";

		if( jQuery(this).find('.back-image').length > 0 ) {
			jQuery(this).find('.back-image').css('opacity', '0');
			jQuery(this).find('.frontal-image').css('opacity', '1');
		}

	});
}

function ivan_quick_view() {
	"use strict";

	jQuery('li.product').hover( function() {
		"use strict";

		jQuery(this).find('.quick-view').animate({
			bottom: '10px'
		}, 300);

	}, function() {
		"use strict";

		jQuery(this).find('.quick-view').animate({
			bottom: '-30px'
		}, 300);

	});

	/*
	 * Tap event to be used in mobile devices
	 */
	jQuery('li.product').on("touchend", function (e) {
		"use strict"; //satisfy the code inspectors
		var link = jQuery(this); //preselect the link
		if (link.hasClass('hover')) {
			return true;
		} else {
			jQuery('li.product').removeClass("hover");
			link.addClass("hover");
			e.preventDefault();
			link.trigger('mouseenter');
			return false; //extra, and to make sure the function has consistent return points
	     }
	});

	// AJAXfy the loading process of quick view the item in a popup
	jQuery('.quick-view').on('click', function(e) {
		"use strict";

		e.preventDefault();

		var _this = jQuery(this);

		// Add loading status in product
		jQuery(this).after('<div class="quick-view-loader"><i class="fa fa-spinner fa-spin"></i></div>');

		// Get product ID to query
		var _prodID = jQuery(_this).attr('data-product-id');

		// Prepare data to send by AJAX
		var _data = { action: 'ivan_woo_quick_view', product: _prodID };

		// Use post method to get info by AJAX (code located at /woocommerce/configuration.php)
		jQuery.post( ivan_theme_scripts.ajaxurl, _data, function( response ) {

			// Open response in the popup

			jQuery.magnificPopup.open({
				mainClass: 'ivan-mfp-custom-zoom-in',
				items: {
					src: '<div class="ivan-product-popup">' + response + '</div>',
					type: 'inline'
				}
			});

			// Remove loading status...
			jQuery('.quick-view-loader').remove();

			setTimeout( function() {

				// Start the product slider properly
				jQuery('.ivan-product-popup .single-product-main-images').owlCarousel({
					theme: "style-outline-circle dark",
					singleItem: true,
					autoHeight: true,
					navigation: true,
					navigationText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
					pagination: false
				});

				// Call custom Woo Variant functions
				jQuery('.ivan-product-popup form').wc_variation_form();
				jQuery('.ivan-product-popup select').change();

			}, 650 );

		});

	});
}

function ivan_wishlist() {
	"use strict";

	jQuery('li.product').hover( function() {
		"use strict";

		jQuery(this).find('.yith-wcwl-add-to-wishlist').animate({
			opacity: 1
		}, 300);

	}, function() {
		"use strict";

		jQuery(this).find('.yith-wcwl-add-to-wishlist').animate({
			opacity: 0
		}, 300);

	});

}

function ivan_single_product_images() {
	"use strict";

	// Start Magnific Lightbox
	jQuery('.single-product-main-images a').magnificPopup({
		type: 'image',
		image: {
			verticalFit: false
		},
		gallery:{
			enabled:true
		}
	});

	var mainThumb = jQuery(".single-product-main-images");
	var smallThumb = jQuery(".single-product-thumb-images");

	mainThumb.owlCarousel({
		theme: "style-outline-circle dark arrows-at-hover",
		singleItem: true,
		autoHeight: true,
		navigation: true,
		navigationText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
		pagination: false,
		afterAction : syncPosition
	});

	smallThumb.owlCarousel({
		theme: "style-opaque-box arrows-at-hover",
		items : 4,
		itemsDesktopSmall: [979, 4],
		itemsTablet: [768, 4],
		itemsMobile: [479, 4],
		autoHeight: true,
		navigation: true,
		navigationText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
		pagination: false,
		afterInit : function(el){
			el.find(".owl-item").eq(0).addClass("synced");
		}
	});

	smallThumb.on("click", ".owl-item", function(e){
	    e.preventDefault();
	    var number = jQuery(this).data("owlItem");
	    mainThumb.trigger("owl.goTo",number);
	  });
}

function syncPosition(el){
	"use strict";

    var current = this.currentItem;
    jQuery(".single-product-thumb-images")
      .find(".owl-item")
      .removeClass("synced")
      .eq(current)
      .addClass("synced");
    if( jQuery(".single-product-thumb-images").data("owlCarousel") !== undefined){
      center(current);
    }
  }

 function center(number){
 	"use strict";

	var smallThumb = jQuery(".single-product-thumb-images");

    var smallThumbvisible = smallThumb.data("owlCarousel").owl.visibleItems;
    var num = number;
    var found = false;
    for(var i in smallThumbvisible){
      if(num === smallThumbvisible[i]){
        var found = true;
      }
    }
 
    if(found===false){
      if(num>smallThumbvisible[smallThumbvisible.length-1]){
        smallThumb.trigger("owl.goTo", num - smallThumbvisible.length+2)
      }else{
        if(num - 1 === -1){
          num = 0;
        }
        smallThumb.trigger("owl.goTo", num);
      }
    } else if(num === smallThumbvisible[smallThumbvisible.length-1]){
      smallThumb.trigger("owl.goTo", smallThumbvisible[1])
    } else if(num === smallThumbvisible[0]){
      smallThumb.trigger("owl.goTo", num-1)
    }
    
  }

// Related and Upsells Carousels
function ivan_single_product_related_upsells() {
	"use strict";

	// Related, Up Sells Carousel
	jQuery('.related-carousel ul, .upsells-carousel ul, .cross-sells-carousel ul').owlCarousel({
			theme: "style-opaque-box arrows-at-hover",
			items : 4,
			itemsDesktopSmall: [979, 3],
			itemsTablet: [768, 3],
			itemsMobile: [479, 1],
			autoHeight: false,
			navigation: true,
			navigationText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
			pagination: false
		});
}

/*
// AJAX Add Variation Product to Cart
function ivan_wc_ajax_quick_view_add_cart() {

	var ajax_url = ivan_theme_scripts.ajaxurl;
	
	jQuery(document).on('submit', '.ivan-product-popup form', function(e){

		var _formData = jQuery(this).serialize();

		// Adds action name to it
		_formData += '&action=ivan_wc_add_to_cart';

		console.log(_formData);

		jQuery.post( ajax_url, _formData, function(response) {

			console.log('Got this from the server: ' + response);

		}, "html");

		// If AJAX works, return false
		e.preventDefault();
		return false;
	});
	
}
*/

jQuery(window).load( function() {

});

jQuery(document).ready( function() {
	"use strict";
	
	// Back Image effect in Woo Products
	ivan_woo_back_image();

	// AJAX Quick View Add to Cart
	//ivan_wc_ajax_quick_view_add_cart();

	// Quick View button in Woo Products
	ivan_quick_view();

	// Add to Wishlist in Woo Products
	ivan_wishlist();

	// Carousel to Single Product Images
	ivan_single_product_images();

	// Init Related and Upsells carousels
	ivan_single_product_related_upsells();

});