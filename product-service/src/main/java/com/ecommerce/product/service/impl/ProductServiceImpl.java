package com.ecommerce.product.service.impl;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.exception.ProductNotFoundException;
import com.ecommerce.product.model.Product;
import com.ecommerce.product.repository.ProductRepository;
import com.ecommerce.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public ProductResponse createProduct(ProductRequest productRequest) {
        Product product = Product.builder()
                .name(productRequest.getName())
                .description(productRequest.getDescription())
                .price(productRequest.getPrice())
                .quantity(productRequest.getQuantity())
                .categories(productRequest.getCategories())
                .images(productRequest.getImages())
                .rating(0.0)
                .reviewCount(0)
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToProductResponse(savedProduct);
    }

    @Override
    public ProductResponse getProductById(String id) {
        log.info("Buscando produto com ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Produto não encontrado com ID: {}", id);
                    return new ProductNotFoundException("Produto não encontrado com ID: " + id);
                });
        log.info("Produto encontrado: {}", product.getName());
        return mapToProductResponse(product);
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll(Sort.by(Sort.Direction.DESC, "rating"));
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> searchProducts(String query) {
        List<Product> products = productRepository.findByNameContainingIgnoreCase(query);
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getProductsByCategory(String category) {
        List<Product> products = productRepository.findByCategoriesContaining(category);
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ProductResponse> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        List<Product> products = productRepository.findByPriceRange(minPrice, maxPrice);
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ProductResponse> getRelatedProducts(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Produto não encontrado com id: " + productId));
                
        List<Product> relatedProducts = productRepository.findRelatedProducts(product.getCategories());
        return relatedProducts.stream()
                .filter(p -> !p.getId().equals(productId))
                .limit(4)
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse updateProduct(String id, ProductRequest productRequest) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Produto não encontrado com id: " + id));

        product.setName(productRequest.getName());
        product.setDescription(productRequest.getDescription());
        product.setPrice(productRequest.getPrice());
        product.setQuantity(productRequest.getQuantity());
        product.setCategories(productRequest.getCategories());
        product.setImages(productRequest.getImages());

        Product updatedProduct = productRepository.save(product);
        return mapToProductResponse(updatedProduct);
    }

    @Override
    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException("Produto não encontrado com id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Override
    @Transactional
    public boolean decreaseStock(String productId, int quantity) {
        log.info("Diminuindo estoque para o produto {} em {} unidades", productId, quantity);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Produto não encontrado com id: " + productId));
        
        if (product.getQuantity() < quantity) {
            log.warn("Estoque insuficiente para o produto {}: disponível {}, solicitado {}", 
                    productId, product.getQuantity(), quantity);
            return false;
        }
        
        product.setQuantity(product.getQuantity() - quantity);
        productRepository.save(product);
        log.info("Estoque atualizado para o produto {}: novo estoque {}", productId, product.getQuantity());
        return true;
    }
    
    @Override
    @Transactional
    public boolean increaseStock(String productId, int quantity) {
        log.info("Aumentando estoque para o produto {} em {} unidades", productId, quantity);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Produto não encontrado com id: " + productId));
        
        product.setQuantity(product.getQuantity() + quantity);
        productRepository.save(product);
        log.info("Estoque atualizado para o produto {}: novo estoque {}", productId, product.getQuantity());
        return true;
    }

    private ProductResponse mapToProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .categories(product.getCategories())
                .images(product.getImages())
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .build();
    }
} 