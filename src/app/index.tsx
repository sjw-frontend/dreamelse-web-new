import 'reflect-metadata';
import './patch-reflect-metadata';
import './setup';
import './index.css';
import { createRoot } from 'react-dom/client';
import { ZoneProvider } from '$/view/zone-provider';
import { Routes } from './routes/routes';

const root = document.getElementById('root')!;

createRoot(root).render(
    <ZoneProvider>
        <Routes />
    </ZoneProvider>,
);
