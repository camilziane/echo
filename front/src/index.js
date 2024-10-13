import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Importation des polices Bungee, Pixelify et Poppins
const preconnect1 = document.createElement('link');
preconnect1.rel = 'preconnect';
preconnect1.href = 'https://fonts.googleapis.com';
document.head.appendChild(preconnect1);

const preconnect2 = document.createElement('link');
preconnect2.rel = 'preconnect';
preconnect2.href = 'https://fonts.gstatic.com';
preconnect2.crossOrigin = 'anonymous';
document.head.appendChild(preconnect2);

const link1 = document.createElement('link');
link1.href = 'https://fonts.googleapis.com/css2?family=Bungee&family=Pixelify+Sans:wght@400..700&display=swap';
link1.rel = 'stylesheet';
document.head.appendChild(link1);

const link2 = document.createElement('link');
link2.href = 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';
link2.rel = 'stylesheet';
document.head.appendChild(link2);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
