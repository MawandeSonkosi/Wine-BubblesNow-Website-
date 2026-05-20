// /cart/cart-utils.js - SINGLE SOURCE OF TRUTH FOR CART
(function() {
    'use strict';

    console.log('🛒 Loading CartUtils...');

    class CartUtils {
        constructor() {
            this.CART_KEY = 'wine_cart';
            this.DELIVERY_FEE = 40; // Always R40 - no free delivery
            this.initCart();
            this.setupEventListeners();
            console.log('✅ CartUtils initialized');
        }

        initCart() {
            // Create empty cart if it doesn't exist
            if (!localStorage.getItem(this.CART_KEY)) {
                const emptyCart = {
                    items: [],
                    subtotal: 0,
                    deliveryFee: this.DELIVERY_FEE,
                    total: 0,
                    updatedAt: new Date().toISOString()
                };
                this.saveCartToStorage(emptyCart);
                console.log('🆕 Created new empty cart');
            }
        }

        setupEventListeners() {
            // Listen for storage events from other tabs
            window.addEventListener('storage', (event) => {
                if (event.key === this.CART_KEY) {
                    console.log('🔄 Cart updated from another tab');
                    this.updateCartBadge();
                    this.triggerCartUpdate();
                }
            });
        }

        // ========== PUBLIC METHODS ==========

        getCart() {
            try {
                const cartJson = localStorage.getItem(this.CART_KEY);
                if (cartJson) {
                    const cart = JSON.parse(cartJson);
                    // Ensure items array exists
                    if (!cart.items) {
                        cart.items = [];
                    }
                    return cart;
                }
            } catch (error) {
                console.error('❌ Error parsing cart:', error);
            }
            
            // Return empty cart if anything fails
            return {
                items: [],
                subtotal: 0,
                deliveryFee: this.DELIVERY_FEE,
                total: 0,
                updatedAt: new Date().toISOString()
            };
        }

        addItem(item) {
            console.log('➕ Adding item to cart:', item);
            const cart = this.getCart();
            
            // Check if item already exists
            const existingIndex = cart.items.findIndex(cartItem => 
                cartItem.id === item.id && cartItem.type === item.type
            );

            if (existingIndex > -1) {
                // Update quantity
                cart.items[existingIndex].quantity += item.quantity || 1;
                console.log(`✅ Updated quantity to: ${cart.items[existingIndex].quantity}`);
            } else {
                // Add new item
                const cartItem = {
                    ...item,
                    quantity: item.quantity || 1,
                    addedAt: new Date().toISOString()
                };
                cart.items.push(cartItem);
                console.log(`✅ Added new item: ${item.name}`);
            }

            this.recalculateTotals(cart);
            this.saveCart(cart);
            return cart;
        }

        removeItem(itemId, itemType) {
            console.log(`🗑️ Removing item: ${itemId}, type: ${itemType}`);
            const cart = this.getCart();
            const initialLength = cart.items.length;
            
            cart.items = cart.items.filter(item => 
                !(item.id === itemId && item.type === itemType)
            );

            if (cart.items.length < initialLength) {
                console.log('✅ Item removed successfully');
                this.recalculateTotals(cart);
                this.saveCart(cart);
                return true;
            } else {
                console.log('❌ Item not found in cart');
                return false;
            }
        }

        updateQuantity(itemId, itemType, newQuantity) {
            console.log(`🔄 Updating quantity: ${itemId}, ${itemType} to ${newQuantity}`);
            const cart = this.getCart();
            const itemIndex = cart.items.findIndex(item => 
                item.id === itemId && item.type === itemType
            );

            if (itemIndex > -1) {
                if (newQuantity <= 0) {
                    // Remove item if quantity is 0
                    cart.items.splice(itemIndex, 1);
                    console.log('✅ Item removed (quantity <= 0)');
                } else {
                    // Update quantity
                    cart.items[itemIndex].quantity = newQuantity;
                    console.log(`✅ Quantity updated to: ${newQuantity}`);
                }
                
                this.recalculateTotals(cart);
                this.saveCart(cart);
                return true;
            }
            
            console.log('❌ Item not found for quantity update');
            return false;
        }

        clearCart() {
            console.log('🧹 Clearing cart');
            const emptyCart = {
                items: [],
                subtotal: 0,
                deliveryFee: this.DELIVERY_FEE,
                total: 0,
                updatedAt: new Date().toISOString()
            };
            this.saveCart(emptyCart);
        }

        getCartCount() {
            const cart = this.getCart();
            const count = cart.items.reduce((total, item) => total + item.quantity, 0);
            console.log(`🛒 Cart count: ${count} items`);
            return count;
        }

        updateCartBadge() {
            const count = this.getCartCount();
            console.log(`📱 Updating cart badge to: ${count}`);
            
            // Update all cart badges on the page
            const cartBadges = document.querySelectorAll('.cart-badge');
            
            cartBadges.forEach((badge, index) => {
                if (badge && badge instanceof HTMLElement) {
                    if (count > 0) {
                        badge.textContent = count > 99 ? '99+' : count.toString();
                        badge.style.display = 'flex';
                        console.log(`✅ Updated badge ${index + 1} to: ${count}`);
                    } else {
                        badge.textContent = '0';
                        badge.style.display = 'none';
                        console.log(`✅ Hid badge ${index + 1} (empty cart)`);
                    }
                }
            });
            
            return count;
        }

        // ========== PRIVATE METHODS ==========

        recalculateTotals(cart) {
            let subtotal = 0;
            
            cart.items.forEach(item => {
                if (item.type === 'wine' && item.isCase) {
                    // Wine case: price * 6 bottles * quantity
                    subtotal += (item.pricePerBottle || item.price) * 6 * item.quantity;
                } else {
                    // Regular item: price * quantity
                    subtotal += item.price * item.quantity;
                }
            });
            
            // Always R40 delivery fee - no free delivery
            const deliveryFee = this.DELIVERY_FEE;
            const total = subtotal + deliveryFee;
            
            cart.subtotal = parseFloat(subtotal.toFixed(2));
            cart.deliveryFee = parseFloat(deliveryFee.toFixed(2));
            cart.total = parseFloat(total.toFixed(2));
        }

        saveCart(cart) {
            cart.updatedAt = new Date().toISOString();
            this.saveCartToStorage(cart);
            this.updateCartBadge();
            this.triggerCartUpdate();
        }

        saveCartToStorage(cart) {
            try {
                localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
                console.log('💾 Cart saved to localStorage');
            } catch (error) {
                console.error('❌ Error saving cart to localStorage:', error);
            }
        }

        triggerCartUpdate() {
            // Trigger custom event for same tab
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            
            // Trigger storage event for other tabs
            window.dispatchEvent(new StorageEvent('storage', {
                key: this.CART_KEY,
                newValue: localStorage.getItem(this.CART_KEY)
            }));
            
            console.log('📢 Cart update event triggered');
        }

        // Helper methods
        fixImageUrl(url) {
            if (!url) return '../assets/categories/Icons.png';
            
            if (url.startsWith('http')) return url;
            if (url.startsWith('/')) return url;
            if (url.startsWith('../')) return url;
            if (url.startsWith('assets/')) return '../' + url;
            if (url.startsWith('data:image')) return url;
            
            return '../assets/' + url;
        }

        isEmpty() {
            const cart = this.getCart();
            return cart.items.length === 0;
        }

        // Debug method
        debug() {
            const cart = this.getCart();
            console.log('=== CART DEBUG ===');
            console.log(`Items: ${cart.items.length}`);
            console.log(`Total quantity: ${this.getCartCount()}`);
            console.log(`Subtotal: R${cart.subtotal}`);
            console.log(`Delivery: R${cart.deliveryFee}`);
            console.log(`Total: R${cart.total}`);
            console.log('Items list:');
            cart.items.forEach((item, index) => {
                console.log(`${index + 1}. ${item.name} (${item.type}) x${item.quantity}`);
            });
            console.log('==================');
        }
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        // Create global instance
        if (!window.CartUtils) {
            window.CartUtils = new CartUtils();
            
            // Update badge immediately
            window.CartUtils.updateCartBadge();
            
            // Add debug method to window
            window.debugCart = function() {
                window.CartUtils.debug();
            };
            
            console.log('✅ CartUtils ready and badge updated');
        }
    });

})();