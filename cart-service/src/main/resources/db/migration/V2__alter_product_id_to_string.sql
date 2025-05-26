-- Alterar o tipo da coluna product_id de BIGINT para VARCHAR
ALTER TABLE cart_items ALTER COLUMN product_id TYPE VARCHAR(255); 