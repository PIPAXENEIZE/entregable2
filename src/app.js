import express from 'express';
import handlebars from 'express-handlebars';
import __dirname from './utils.js';
import pepe from './routes/views.router.js';
import { Server } from 'socket.io';
import ProductsRouter from './routes/products.router.js';
import CartRouter from './routes/cart.router.js';
import realtime from './routes/realtimeproducts.js';
import { getProductsData, setProductsData } from './data.js';
import { v4 as uuidv4 } from 'uuid'; // generador de IDS UNICAS

const app = express();
const PORT = process.env.PORT || 8080;

app.engine('handlebars', handlebars.engine());
app.set('views', `${__dirname}/views`);
app.set('view engine', 'handlebars');

app.use(express.static(`${__dirname}/public`));
app.use(express.json());
app.use('/chat', pepe);
app.use('/api/products', ProductsRouter);
app.use('/api/cart', CartRouter);
app.use('/realtimeproducts', realtime);

app.get('/p', (req, res) => {
    res.render('home', { products: getProductsData() });
});

const server = app.listen(PORT, () => console.log(`listening on ${PORT}`));
const socketServer = new Server(server);

const messages = [];

socketServer.on('connection', (socketClient) => {
    console.log("client connected ID: ", socketClient.id);
    socketServer.emit('log', messages);

    socketClient.on('message', data => {
        messages.push(data);
        socketServer.emit('log', messages);
    });

    socketClient.on('addProduct', (product) => {
        const newProduct = {
            id: uuidv4(),
            title: product.title,
            description: product.description,
            code: product.code,
            price: product.price,
            quantity: product.quantity,
            category: product.category,
            status: product.status
        };
        const productsData = getProductsData();
        productsData.push(newProduct);
        setProductsData(productsData);
        socketServer.emit('updateProducts', productsData);
    });

    socketClient.on('deleteProduct', (productId) => {
        let productsData = getProductsData();
        productsData = productsData.filter(product => product.id !== productId);
        setProductsData(productsData);
        socketServer.emit('updateProducts', productsData);
    });

    socketClient.on('authenticated', data => {
        socketClient.broadcast.emit('newUserConnected', data);
    });
});
