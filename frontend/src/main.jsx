import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import { App } from './app';
import { buildStaticBootstrap } from './siteBootstrap';

const rootElement = document.getElementById('root');

async function startApplication() {
  if (!rootElement) {
    return;
  }

  let bootstrap = {};

  try {
    bootstrap = await buildStaticBootstrap();
  } catch (error) {
    bootstrap = {
      currentPath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      i18n: {},
      lang: 'zh-CN',
      languageOptions: [],
      pageProps: {},
      pageType: 'frontend-router',
      siteName: 'NO CONVERSION THERAPY'
    };
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App bootstrap={bootstrap} />
    </React.StrictMode>
  );
}

void startApplication();
