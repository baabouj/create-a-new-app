import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const app = express();

app.use(helmet());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(compression());

app.use(cors());
app.options('*', cors());

app.get('/hello', (_req, res) => {
  res.send('Hello, World!');
});

export { app };
