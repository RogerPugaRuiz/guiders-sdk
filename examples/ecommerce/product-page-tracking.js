// ================================
// E-COMMERCE TRACKING - PÁGINA DE PRODUCTO
// Ejemplo completo de tracking para páginas de producto
// ================================

/**
 * Configuración de tracking para páginas de producto e-commerce
 * Incluye: Vista de producto, añadir al carrito, wishlist, comparar, etc.
 */
class ProductPageTracking {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.sdk = null;
        this.productData = null;
        this.viewStartTime = Date.now();
        this.scrollDepth = 0;
        this.imageViews = new Set();
        this.init();
    }

    async init() {
        try {
            // Importar y configurar SDK
            const { TrackingPixelSDK } = await import('guiders-pixel');
            
            this.sdk = new TrackingPixelSDK({
                apiKey: this.apiKey,
                heuristicDetection: {
                    enabled: true,
                    confidenceThreshold: 0.7
                },
                ecommerce: {
                    enabled: true,
                    trackProductViews: true,
                    trackCartEvents: true,
                    trackWishlistEvents: true
                }
            });

            await this.sdk.init();
            this.sdk.enableAutomaticTracking();

            // Inicializar tracking
            this.setupProductData();
            this.setupEventListeners();
            this.trackProductView();
            this.startEngagementTracking();

            console.log('✅ Product Page Tracking inicializado');

        } catch (error) {
            console.error('❌ Error inicializando Product Page Tracking:', error);
        }
    }

    setupProductData() {
        // Extraer datos del producto de la página
        this.productData = {
            id: this.getProductId(),
            name: this.getProductName(),
            price: this.getProductPrice(),
            currency: this.getProductCurrency(),
            category: this.getProductCategory(),
            brand: this.getProductBrand(),
            sku: this.getProductSKU(),
            availability: this.getProductAvailability(),
            rating: this.getProductRating(),
            reviewCount: this.getReviewCount(),
            images: this.getProductImages(),
            variants: this.getProductVariants()
        };

        console.log('📦 Datos del producto:', this.productData);
    }

    async trackProductView() {
        if (!this.sdk || !this.productData) return;

        await this.sdk.track({
            event: 'view_item',
            data: {
                item_id: this.productData.id,
                item_name: this.productData.name,
                currency: this.productData.currency,
                value: this.productData.price,
                item_category: this.productData.category,
                item_brand: this.productData.brand,
                
                // Datos adicionales para analytics avanzados
                page_type: 'product_detail',
                product_sku: this.productData.sku,
                product_availability: this.productData.availability,
                product_rating: this.productData.rating,
                product_reviews: this.productData.reviewCount,
                
                // Datos de contexto
                referrer: document.referrer,
                user_agent: navigator.userAgent,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                page_load_time: Date.now() - this.viewStartTime
            }
        });

        console.log('👁️ Vista de producto trackeada');
    }

    setupEventListeners() {
        // Trackear añadir al carrito
        this.setupAddToCartTracking();
        
        // Trackear cambios de variante
        this.setupVariantTracking();
        
        // Trackear interacciones con imágenes
        this.setupImageTracking();
        
        // Trackear wishlist
        this.setupWishlistTracking();
        
        // Trackear comparación
        this.setupComparisonTracking();
        
        // Trackear scroll depth
        this.setupScrollTracking();
        
        // Trackear tiempo en página
        this.setupTimeTracking();
        
        // Trackear salida de página
        this.setupExitTracking();
    }

    setupAddToCartTracking() {
        // Interceptar todos los métodos de añadir al carrito
        const addToCartSelectors = [
            'button[name="add-to-cart"]',
            '.add-to-cart-button',
            '.btn-add-to-cart',
            '[data-product-action="add-to-cart"]'
        ];

        addToCartSelectors.forEach(selector => {
            document.addEventListener('click', async (e) => {
                if (e.target.matches(selector)) {
                    await this.trackAddToCart(e.target);
                }
            });
        });

        // Para WooCommerce específicamente
        document.addEventListener('added_to_cart', async (e) => {
            await this.trackAddToCart(null, e.detail);
        });
    }

    async trackAddToCart(button, wooCommerceData = null) {
        if (!this.sdk) return;

        const quantity = this.getSelectedQuantity();
        const variant = this.getSelectedVariant();
        
        const eventData = {
            event: 'add_to_cart',
            data: {
                currency: this.productData.currency,
                value: this.productData.price * quantity,
                items: [{
                    item_id: this.productData.id,
                    item_name: this.productData.name,
                    item_category: this.productData.category,
                    item_brand: this.productData.brand,
                    price: this.productData.price,
                    quantity: quantity
                }],
                
                // Datos de variante si aplica
                ...(variant && {
                    variant_id: variant.id,
                    variant_name: variant.name,
                    variant_price: variant.price
                }),
                
                // Datos adicionales
                page_type: 'product_detail',
                time_on_page: Date.now() - this.viewStartTime,
                scroll_depth: this.scrollDepth,
                images_viewed: this.imageViews.size,
                
                // Datos de WooCommerce si están disponibles
                ...(wooCommerceData && wooCommerceData)
            }
        };

        await this.sdk.track(eventData);
        console.log('🛒 Añadido al carrito trackeado:', eventData);

        // Trackear para analytics de conversión
        this.trackConversionFunnel('add_to_cart');
    }

    setupVariantTracking() {
        // Trackear cambios de variante (color, talla, etc.)
        const variantSelectors = [
            'select[name*="attribute"]',
            '.product-variants select',
            '.variant-selector',
            'input[name*="variation"]'
        ];

        variantSelectors.forEach(selector => {
            document.addEventListener('change', async (e) => {
                if (e.target.matches(selector)) {
                    await this.trackVariantChange(e.target);
                }
            });
        });
    }

    async trackVariantChange(element) {
        if (!this.sdk) return;

        const variant = this.getSelectedVariant();
        
        await this.sdk.track({
            event: 'select_item_variant',
            data: {
                item_id: this.productData.id,
                item_name: this.productData.name,
                variant_id: variant?.id,
                variant_name: variant?.name,
                variant_type: element.name || element.className,
                variant_value: element.value,
                variant_price: variant?.price || this.productData.price
            }
        });

        console.log('🎨 Cambio de variante trackeado');
    }

    setupImageTracking() {
        // Trackear clicks en imágenes del producto
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.product-image, .product-gallery img, .woocommerce-product-gallery img')) {
                await this.trackImageView(e.target);
            }
        });

        // Trackear zoom de imagen
        document.addEventListener('mouseenter', (e) => {
            if (e.target.matches('.product-image[data-zoom], .zoomable')) {
                this.trackImageZoom(e.target);
            }
        });
    }

    async trackImageView(image) {
        if (!this.sdk) return;

        const imageUrl = image.src || image.dataset.src;
        const imageIndex = Array.from(image.parentElement.children).indexOf(image);
        
        this.imageViews.add(imageUrl);

        await this.sdk.track({
            event: 'view_product_image',
            data: {
                item_id: this.productData.id,
                image_url: imageUrl,
                image_index: imageIndex,
                total_images_viewed: this.imageViews.size,
                view_method: 'click'
            }
        });

        console.log('🖼️ Vista de imagen trackeada');
    }

    async trackImageZoom(image) {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'zoom_product_image',
            data: {
                item_id: this.productData.id,
                image_url: image.src,
                zoom_trigger: 'hover'
            }
        });
    }

    setupWishlistTracking() {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.add-to-wishlist, .wishlist-button, [data-action="wishlist"]')) {
                await this.trackWishlist(e.target);
            }
        });
    }

    async trackWishlist(button) {
        if (!this.sdk) return;

        const action = button.classList.contains('added') ? 'remove' : 'add';

        await this.sdk.track({
            event: `${action}_to_wishlist`,
            data: {
                item_id: this.productData.id,
                item_name: this.productData.name,
                item_category: this.productData.category,
                value: this.productData.price,
                currency: this.productData.currency
            }
        });

        console.log(`💖 ${action} wishlist trackeado`);
    }

    setupComparisonTracking() {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.add-to-compare, .compare-button, [data-action="compare"]')) {
                await this.trackComparison(e.target);
            }
        });
    }

    async trackComparison(button) {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'add_to_comparison',
            data: {
                item_id: this.productData.id,
                item_name: this.productData.name,
                item_category: this.productData.category,
                value: this.productData.price,
                currency: this.productData.currency,
                comparison_count: this.getComparisonCount()
            }
        });

        console.log('⚖️ Comparación trackeada');
    }

    setupScrollTracking() {
        let maxScroll = 0;
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.scrollDepth = maxScroll;
            }
        });

        // Trackear milestones de scroll
        const scrollMilestones = [25, 50, 75, 90];
        scrollMilestones.forEach(milestone => {
            let tracked = false;
            window.addEventListener('scroll', async () => {
                if (!tracked && this.scrollDepth >= milestone) {
                    tracked = true;
                    await this.trackScrollMilestone(milestone);
                }
            });
        });
    }

    async trackScrollMilestone(percentage) {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'scroll_depth',
            data: {
                page_type: 'product_detail',
                item_id: this.productData.id,
                scroll_depth: percentage,
                time_to_scroll: Date.now() - this.viewStartTime
            }
        });

        console.log(`📜 Scroll ${percentage}% trackeado`);
    }

    setupTimeTracking() {
        // Trackear tiempo en página cada 30 segundos
        setInterval(async () => {
            if (!document.hidden) {
                await this.trackTimeOnPage();
            }
        }, 30000);
    }

    async trackTimeOnPage() {
        if (!this.sdk) return;

        const timeOnPage = Date.now() - this.viewStartTime;

        await this.sdk.track({
            event: 'time_on_product_page',
            data: {
                item_id: this.productData.id,
                time_on_page: timeOnPage,
                scroll_depth: this.scrollDepth,
                images_viewed: this.imageViews.size,
                engagement_score: this.calculateEngagementScore()
            }
        });
    }

    setupExitTracking() {
        window.addEventListener('beforeunload', async () => {
            if (this.sdk) {
                await this.trackPageExit();
            }
        });
    }

    async trackPageExit() {
        const timeOnPage = Date.now() - this.viewStartTime;

        // Usar sendBeacon para eventos de salida
        navigator.sendBeacon('/api/guiders/track', JSON.stringify({
            event: 'exit_product_page',
            data: {
                item_id: this.productData.id,
                total_time_on_page: timeOnPage,
                max_scroll_depth: this.scrollDepth,
                total_images_viewed: this.imageViews.size,
                engagement_score: this.calculateEngagementScore(),
                exit_intent: this.detectExitIntent()
            }
        }));
    }

    startEngagementTracking() {
        // Trackear engagement en tiempo real
        setInterval(() => {
            this.updateEngagementScore();
        }, 10000);
    }

    calculateEngagementScore() {
        let score = 0;
        
        // Tiempo en página (max 40 puntos)
        const timeMinutes = (Date.now() - this.viewStartTime) / 60000;
        score += Math.min(timeMinutes * 10, 40);
        
        // Scroll depth (max 25 puntos)
        score += (this.scrollDepth / 100) * 25;
        
        // Imágenes vistas (max 20 puntos)
        score += Math.min(this.imageViews.size * 5, 20);
        
        // Interacciones adicionales (max 15 puntos)
        // Este puntaje se actualiza desde otros métodos
        
        return Math.round(score);
    }

    async trackConversionFunnel(step) {
        if (!this.sdk) return;

        await this.sdk.track({
            event: 'conversion_funnel',
            data: {
                funnel_name: 'product_to_purchase',
                funnel_step: step,
                item_id: this.productData.id,
                step_value: this.productData.price,
                currency: this.productData.currency
            }
        });
    }

    // ================================
    // MÉTODOS DE EXTRACCIÓN DE DATOS
    // ================================

    getProductId() {
        return (
            document.querySelector('[data-product-id]')?.dataset.productId ||
            document.querySelector('.product')?.dataset.id ||
            this.extractFromURL('product') ||
            'unknown'
        );
    }

    getProductName() {
        return (
            document.querySelector('.product-title')?.textContent ||
            document.querySelector('h1.entry-title')?.textContent ||
            document.querySelector('.woocommerce-product-details__short-description')?.textContent ||
            document.title
        )?.trim();
    }

    getProductPrice() {
        const priceElement = document.querySelector('.price .amount, .price, .woocommerce-price-amount');
        if (priceElement) {
            return parseFloat(priceElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
        }
        return 0;
    }

    getProductCurrency() {
        const currencyElement = document.querySelector('.woocommerce-price-currencySymbol');
        return currencyElement?.textContent || 'EUR';
    }

    getProductCategory() {
        return (
            document.querySelector('.product-category')?.textContent ||
            document.querySelector('.breadcrumb')?.textContent?.split('/').pop() ||
            'uncategorized'
        )?.trim();
    }

    getProductBrand() {
        return (
            document.querySelector('[data-brand]')?.dataset.brand ||
            document.querySelector('.product-brand')?.textContent ||
            'unknown'
        )?.trim();
    }

    getProductSKU() {
        return (
            document.querySelector('.sku')?.textContent ||
            document.querySelector('[data-sku]')?.dataset.sku ||
            this.getProductId()
        );
    }

    getProductAvailability() {
        const stockElement = document.querySelector('.stock, .availability');
        if (stockElement) {
            return stockElement.textContent.toLowerCase().includes('stock') ? 'in_stock' : 'out_of_stock';
        }
        return 'unknown';
    }

    getProductRating() {
        const ratingElement = document.querySelector('.star-rating, .rating');
        if (ratingElement) {
            const width = ratingElement.style.width || ratingElement.dataset.rating;
            return parseFloat(width) / 20; // Assuming 5-star system
        }
        return null;
    }

    getReviewCount() {
        const reviewElement = document.querySelector('.review-count, .woocommerce-review-link');
        if (reviewElement) {
            const match = reviewElement.textContent.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }
        return 0;
    }

    getProductImages() {
        const images = document.querySelectorAll('.product-image img, .woocommerce-product-gallery img');
        return Array.from(images).map(img => img.src || img.dataset.src);
    }

    getProductVariants() {
        const variants = {};
        document.querySelectorAll('select[name*="attribute"], .variation-selector').forEach(select => {
            const name = select.name || select.className;
            const options = Array.from(select.options).map(option => ({
                value: option.value,
                text: option.text,
                price: option.dataset.price
            }));
            variants[name] = options;
        });
        return variants;
    }

    getSelectedQuantity() {
        const qtyInput = document.querySelector('input[name="quantity"], .qty');
        return qtyInput ? parseInt(qtyInput.value) : 1;
    }

    getSelectedVariant() {
        const selectedOptions = {};
        document.querySelectorAll('select[name*="attribute"]:not([value=""]), input[name*="variation"]:checked').forEach(element => {
            selectedOptions[element.name] = element.value;
        });
        
        if (Object.keys(selectedOptions).length > 0) {
            return {
                id: Object.values(selectedOptions).join('-'),
                name: Object.values(selectedOptions).join(' / '),
                options: selectedOptions,
                price: this.getVariantPrice(selectedOptions)
            };
        }
        
        return null;
    }

    getVariantPrice(selectedOptions) {
        // Intentar obtener precio de variante específica
        const priceElement = document.querySelector('[data-variant-price]');
        return priceElement ? parseFloat(priceElement.dataset.variantPrice) : this.productData.price;
    }

    getComparisonCount() {
        const compareElement = document.querySelector('.compare-count, [data-compare-count]');
        return compareElement ? parseInt(compareElement.textContent) : 0;
    }

    extractFromURL(type) {
        const url = window.location.href;
        const patterns = {
            product: /\/product\/([^\/]+)/,
            id: /[\?&]id=([^&]+)/
        };
        const match = url.match(patterns[type]);
        return match ? match[1] : null;
    }

    detectExitIntent() {
        // Lógica simple para detectar intención de salida
        return document.activeElement?.tagName === 'BODY' && event?.clientY < 50;
    }

    updateEngagementScore() {
        // Actualizar score de engagement en tiempo real
        const score = this.calculateEngagementScore();
        document.dispatchEvent(new CustomEvent('engagementUpdate', { detail: { score } }));
    }
}

// ================================
// INICIALIZACIÓN AUTOMÁTICA
// ================================

// Auto-inicializar si estamos en una página de producto
document.addEventListener('DOMContentLoaded', () => {
    // Detectar si es página de producto
    const isProductPage = (
        document.querySelector('.single-product') ||
        document.querySelector('.product-detail') ||
        document.querySelector('[data-product-id]') ||
        window.location.href.includes('/product/')
    );

    if (isProductPage) {
        // Obtener API key de configuración global o data attribute
        const apiKey = window.guidersConfig?.apiKey || 
                      document.querySelector('[data-guiders-api-key]')?.dataset.guidersApiKey ||
                      'YOUR_API_KEY_HERE';

        if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
            new ProductPageTracking(apiKey);
            console.log('🚀 Product Page Tracking inicializado automáticamente');
        } else {
            console.warn('⚠️ API Key de Guiders no configurada para Product Page Tracking');
        }
    }
});

// Exportar para uso manual
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductPageTracking;
} else if (typeof window !== 'undefined') {
    window.ProductPageTracking = ProductPageTracking;
}

// ================================
// EJEMPLO DE USO MANUAL
// ================================

/*
// Usar manualmente:
const tracker = new ProductPageTracking('tu-api-key');

// Trackear eventos específicos:
await tracker.trackAddToCart();
await tracker.trackWishlist();
await tracker.trackComparison();

// Obtener datos del producto:
console.log(tracker.productData);

// Calcular engagement:
console.log('Engagement Score:', tracker.calculateEngagementScore());
*/