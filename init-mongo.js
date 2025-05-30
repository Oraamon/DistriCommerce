// mongodb-seeder.js
db = db.getSiblingDB('ecommerce');

// Limpando a coleção de produtos antes de inserir
db.products.drop();

// Inserindo produtos com mais detalhes
db.products.insertMany([
    {
        "id": "1",
        "name": "Smartphone Premium",
        "description": "Smartphone de última geração com câmera de alta resolução",
        "price": 999.99,
        "quantity": 50,
        "categories": ["Electronics", "Mobile"],
        "images": [
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop"
        ],
        "rating": 4.8,
        "reviewCount": 120
    },
    {
        "id": "2",
        "name": "Laptop Pro",
        "description": "Laptop potente para trabalho e jogos",
        "price": 1299.99,
        "quantity": 30,
        "categories": ["Electronics", "Computers"],
        "images": [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop"
        ],
        "rating": 4.7,
        "reviewCount": 85
    },
    {
        "id": "3",
        "name": "Wireless Headphones",
        "description": "Fones de ouvido sem fio com cancelamento de ruído",
        "price": 199.99,
        "quantity": 100,
        "categories": ["Electronics", "Audio"],
        "images": [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop"
        ],
        "rating": 4.6,
        "reviewCount": 200
    },
    {
        "id": "4",
        "name": "Smartwatch",
        "description": "Relógio inteligente com monitor de saúde",
        "price": 249.99,
        "quantity": 40,
        "categories": ["Electronics", "Wearables"],
        "images": [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop"
        ],
        "rating": 4.5,
        "reviewCount": 150
    },
    {
        "id": "5",
        "name": "Coffee Maker",
        "description": "Máquina de café automática",
        "price": 79.99,
        "quantity": 25,
        "categories": ["Home", "Kitchen"],
        "images": [
            "https://images.unsplash.com/photo-1570088935863-4a0075d1c8f4?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1570088935863-4a0075d1c8f4?w=500&h=500&fit=crop"
        ],
        "rating": 4.4,
        "reviewCount": 90
    },
    {
        "id": "6",
        "name": "Blender",
        "description": "Liquidificador potente para smoothies",
        "price": 49.99,
        "quantity": 60,
        "categories": ["Home", "Kitchen"],
        "images": [
            "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&h=500&fit=crop"
        ],
        "rating": 4.3,
        "reviewCount": 75
    },
    {
        "id": "7",
        "name": "Toaster",
        "description": "Torradeira com múltiplas funções",
        "price": 29.99,
        "quantity": 80,
        "categories": ["Home", "Kitchen"],
        "images": [
            "https://images.unsplash.com/photo-1585232004428-244e0e6904e3?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1585232004428-244e0e6904e3?w=500&h=500&fit=crop"
        ],
        "rating": 4.2,
        "reviewCount": 60
    },
    {
        "id": "8",
        "name": "Running Shoes",
        "description": "Tênis para corrida com amortecimento",
        "price": 129.99,
        "quantity": 45,
        "categories": ["Sports", "Footwear"],
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop"
        ],
        "rating": 4.7,
        "reviewCount": 180
    },
    {
        "id": "9",
        "name": "Yoga Mat",
        "description": "Tapete de yoga antiderrapante",
        "price": 39.99,
        "quantity": 70,
        "categories": ["Sports", "Fitness"],
        "images": [
            "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&h=500&fit=crop"
        ],
        "rating": 4.6,
        "reviewCount": 95
    },
    {
        "id": "10",
        "name": "Dumbbell Set",
        "description": "Conjunto de halteres ajustáveis",
        "price": 149.99,
        "quantity": 35,
        "categories": ["Sports", "Fitness"],
        "images": [
            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=500&fit=crop"
        ],
        "rating": 4.5,
        "reviewCount": 110
    },
    {
        "id": "11",
        "name": "Smart TV 4K",
        "description": "TV 4K com tecnologia OLED e sistema smart",
        "price": 799.99,
        "quantity": 25,
        "categories": ["Electronics", "TVs"],
        "images": [
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop"
        ],
        "rating": 4.8,
        "reviewCount": 140
    },
    {
        "id": "12",
        "name": "Console de Games",
        "description": "Console de última geração com 1TB de armazenamento",
        "price": 499.99,
        "quantity": 30,
        "categories": ["Electronics", "Gaming"],
        "images": [
            "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=500&h=500&fit=crop"
        ],
        "rating": 4.9,
        "reviewCount": 210
    },
    {
        "id": "13",
        "name": "Câmera DSLR",
        "description": "Câmera profissional com lente intercambiável",
        "price": 899.99,
        "quantity": 20,
        "categories": ["Electronics", "Photography"],
        "images": [
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop"
        ],
        "rating": 4.7,
        "reviewCount": 95
    },
    {
        "id": "14",
        "name": "Tablet Ultrafino",
        "description": "Tablet leve com tela de alta resolução",
        "price": 399.99,
        "quantity": 40,
        "categories": ["Electronics", "Mobile"],
        "images": [
            "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop"
        ],
        "rating": 4.6,
        "reviewCount": 110
    },
    {
        "id": "15",
        "name": "Monitor Gamer",
        "description": "Monitor 27 polegadas com 144Hz e tempo de resposta de 1ms",
        "price": 349.99,
        "quantity": 35,
        "categories": ["Electronics", "Computers"],
        "images": [
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop"
        ],
        "rating": 4.8,
        "reviewCount": 85
    },
    {
        "id": "16",
        "name": "Teclado Mecânico",
        "description": "Teclado mecânico RGB para gamers",
        "price": 129.99,
        "quantity": 45,
        "categories": ["Electronics", "Computers"],
        "images": [
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&h=500&fit=crop"
        ],
        "rating": 4.5,
        "reviewCount": 65
    },
    {
        "id": "17",
        "name": "Mouse Gamer",
        "description": "Mouse com sensor de alta precisão e iluminação RGB",
        "price": 79.99,
        "quantity": 60,
        "categories": ["Electronics", "Computers"],
        "images": [
            "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop"
        ],
        "rating": 4.6,
        "reviewCount": 90
    },
    {
        "id": "18",
        "name": "Cadeira Ergonômica",
        "description": "Cadeira de escritório com design ergonômico",
        "price": 249.99,
        "quantity": 30,
        "categories": ["Home", "Office"],
        "images": [
            "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&h=500&fit=crop"
        ],
        "rating": 4.4,
        "reviewCount": 70
    },
    {
        "id": "19",
        "name": "Drone com Câmera",
        "description": "Drone com câmera HD e 30 minutos de voo",
        "price": 299.99,
        "quantity": 25,
        "categories": ["Electronics", "Photography"],
        "images": [
            "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500&h=500&fit=crop"
        ],
        "rating": 4.7,
        "reviewCount": 55
    },
    {
        "id": "20",
        "name": "Caixa de Som Bluetooth",
        "description": "Caixa de som portátil à prova d'água",
        "price": 89.99,
        "quantity": 50,
        "categories": ["Electronics", "Audio"],
        "images": [
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop"
        ],
        "rating": 4.5,
        "reviewCount": 120
    },
    {
        "id": "21",
        "name": "Aspirador Robô",
        "description": "Aspirador inteligente com mapeamento automático",
        "price": 299.99,
        "quantity": 20,
        "categories": ["Home", "Appliances"],
        "images": [
            "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500&h=500&fit=crop"
        ],
        "rating": 4.7,
        "reviewCount": 85
    },
    {
        "id": "22",
        "name": "Fritadeira Elétrica",
        "description": "Fritadeira sem óleo com controle digital",
        "price": 99.99,
        "quantity": 40,
        "categories": ["Home", "Kitchen"],
        "images": [
            "https://images.unsplash.com/photo-1585232004428-244e0e6904e3?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1585232004428-244e0e6904e3?w=500&h=500&fit=crop"
        ],
        "rating": 4.8,
        "reviewCount": 150
    },
    {
        "id": "23",
        "name": "Mochila para Notebook",
        "description": "Mochila resistente à água com compartimento acolchoado",
        "price": 59.99,
        "quantity": 65,
        "categories": ["Accessories", "Travel"],
        "images": [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop"
        ],
        "rating": 4.5,
        "reviewCount": 95
    },
    {
        "id": "24",
        "name": "Relógio de Luxo",
        "description": "Relógio de pulso com pulseira de couro",
        "price": 199.99,
        "quantity": 30,
        "categories": ["Fashion", "Accessories"],
        "images": [
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&h=500&fit=crop"
        ],
        "rating": 4.6,
        "reviewCount": 80
    },
    {
        "id": "25",
        "name": "Bicicleta Mountain Bike",
        "description": "Bicicleta off-road com 21 marchas",
        "price": 349.99,
        "quantity": 15,
        "categories": ["Sports", "Outdoor"],
        "images": [
            "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&h=500&fit=crop"
        ],
        "rating": 4.7,
        "reviewCount": 65
    },
    {
        "id": "26",
        "name": "Kit de Ferramentas",
        "description": "Kit completo com 100 peças para manutenção doméstica",
        "price": 79.99,
        "quantity": 40,
        "categories": ["Tools", "Home"],
        "images": [
            "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&h=500&fit=crop"
        ],
        "rating": 4.5,
        "reviewCount": 75
    },
    {
        "id": "27",
        "name": "Perfume Importado",
        "description": "Fragrância premium de longa duração",
        "price": 119.99,
        "quantity": 50,
        "categories": ["Beauty", "Personal Care"],
        "images": [
            "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&h=500&fit=crop"
        ],
        "rating": 4.8,
        "reviewCount": 110
    },
    {
        "id": "28",
        "name": "Conjunto de Panelas",
        "description": "Kit com 5 panelas de aço inoxidável",
        "price": 149.99,
        "quantity": 25,
        "categories": ["Home", "Kitchen"],
        "images": [
            "https://images.unsplash.com/photo-1584990347449-a2d4c2c044c9?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1584990347449-a2d4c2c044c9?w=500&h=500&fit=crop"
        ],
        "rating": 4.6,
        "reviewCount": 90
    },
    {
        "id": "29",
        "name": "Óculos de Sol",
        "description": "Óculos com proteção UV e design moderno",
        "price": 89.99,
        "quantity": 60,
        "categories": ["Fashion", "Accessories"],
        "images": [
            "https://images.unsplash.com/photo-1577803645773-f96470509666?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1577803645773-f96470509666?w=500&h=500&fit=crop"
        ],
        "rating": 4.4,
        "reviewCount": 70
    },
    {
        "id": "30",
        "name": "Ventilador de Teto",
        "description": "Ventilador com iluminação e controle remoto",
        "price": 129.99,
        "quantity": 35,
        "categories": ["Home", "Appliances"],
        "images": [
            "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500&h=500&fit=crop"
        ],
        "rating": 4.3,
        "reviewCount": 60
    }
]);

// Confirmar a inserção
print("MongoDB inicializado com sucesso: " + db.products.count() + " produtos inseridos!");