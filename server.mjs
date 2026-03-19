import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3100', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    global.io = io;

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('register_claw', async (data) => {
            const { clawId } = data;
            if (clawId) {
                socket.join(`claw_${clawId}`);
                console.log(`Socket ${socket.id} joined room claw_${clawId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    server.once('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
