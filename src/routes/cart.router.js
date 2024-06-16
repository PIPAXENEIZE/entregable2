import { Router } from "express";
import fs from 'fs';
import path from 'path';
import __dirname from "../utils.js";

const router = Router();
const productsPath = path.resolve(__dirname, 'src/products.json');
const cartsPath = path.resolve(__dirname, 'src/carts.json');

// Función para obtener los ids de los productos de products.json
const getProductIds = () => {
    const data = fs.readFileSync(productsPath, 'utf-8');
    const products = JSON.parse(data);
    return products.map(product => product.id);
};

// Función para obtener todos los carritos
const getCarts = () => {
    if (!fs.existsSync(cartsPath)) {
        return [];
    }
    const data = fs.readFileSync(cartsPath, 'utf-8');
    return JSON.parse(data);
};

// Función para guardar los carritos
const saveCarts = (carts) => {
    fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));
};

// Ruta GET para verificar el funcionamiento del componente
router.get('/', (req, res) => {
    res.send("cart component STARTED");
});

// Ruta POST para crear un nuevo carrito
router.post('/', (req, res) => {
    const productIds = getProductIds();
    const carts = getCarts();

    // Generar un id único que no duplique los ids de los carritos
    let newCartId;
    do {
        newCartId = Math.floor(Math.random() * 1000000); // Genera un id aleatorio
    } while (carts.some(cart => cart.id === newCartId));

    const newCart = {
        id: newCartId,
        products: [] // Array vacío que contendrá los objetos de productos
    };

    carts.push(newCart);
    saveCarts(carts);

    res.status(201).json(newCart);
});

// Ruta POST para agregar un producto a un carrito
router.post('/:cid/product/:pid', (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const carts = getCarts();
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

    const cart = carts.find(c => c.id === parseInt(cid));
    if (!cart) {
        return res.status(404).send("Carrito no encontrado");
    }

    const product = products.find(p => p.id === parseInt(pid));
    if (!product) {
        return res.status(404).send("Producto no encontrado");
    }

    const existingProduct = cart.products.find(p => p.product === parseInt(pid));
    if (existingProduct) {
        existingProduct.quantity += quantity ? parseInt(quantity) : 1;
    } else {
        cart.products.push({
            product: parseInt(pid),
            quantity: quantity ? parseInt(quantity) : 1
        });
    }

    saveCarts(carts);

    res.status(201).json(cart);
});

// Ruta GET para obtener un carrito por su ID
router.get('/:cid', (req, res) => {
    const { cid } = req.params;
    const carts = getCarts();

    const cart = carts.find(c => c.id === parseInt(cid));
    if (!cart) {
        return res.status(404).send("Carrito no encontrado");
    }

    res.json(cart);
});

export default router;
