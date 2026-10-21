import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/zcool-kuaile/400.css';
import App from './app/App';
import './styles/app.css';
import './styles/upgrade.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
