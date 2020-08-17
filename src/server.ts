import express, { response } from 'express';
import routes from './routes';
import cors from 'cors';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(PORT);
