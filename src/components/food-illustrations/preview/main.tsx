import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/zcool-kuaile/400.css';
import { FoodIllustrationGallery } from './FoodIllustrationGallery';
import './gallery.css';
createRoot(document.getElementById('food-gallery-root')!).render(<React.StrictMode><FoodIllustrationGallery/></React.StrictMode>);
