
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../components/Button';
import { Home, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | DogePump</title>
        <meta name="description" content="The page you are looking for has been rugpulled (or never existed). Return home or launch a new memecoin on DogePump." />
        <link rel="canonical" href="https://dogepump.com" />
        <meta property="og:title" content="404 - Page Not Found | DogePump" />
        <meta property="og:description" content="The page you are looking for has been rugpulled (or never existed). Return home or launch a new memecoin on DogePump." />
        <meta property="og:url" content="https://dogepump.com" />
        <meta name="twitter:title" content="404 - Page Not Found | DogePump" />
        <meta name="twitter:description" content="The page you are looking for has been rugpulled (or never existed). Return home or launch a new memecoin on DogePump." />
      </Helmet>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className="relative mb-8">
         <div className="absolute inset-0 bg-doge/20 blur-[60px] rounded-full"></div>
         <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-8 shadow-2xl flex items-center justify-center w-40 h-40 mx-auto perspective-1000">
           <div className="absolute inset-0 bg-doge rounded-2xl rotate-6 opacity-20 blur-[2px]"></div>
           <div className="relative w-20 h-20 bg-gradient-to-br from-[#F4C430] to-[#D4AF37] rounded-2xl flex items-center justify-center text-black font-bold text-4xl shadow-[0_0_15px_rgba(212,175,55,0.3)] border border-white/20">
             Ð
           </div>
         </div>
      </div>
      
      <h1 className="text-6xl font-comic font-bold text-white mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Lost Doge</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
        The page you are looking for has been rugpulled (or never existed). 
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
         <Link to="/">
            <Button size="lg" className="rounded-full px-8 gap-2">
               <Home size={18} /> Return Home
            </Button>
         </Link>
         <Link to="/launch">
            <Button size="lg" variant="secondary" className="rounded-full px-8 gap-2">
               <Search size={18} /> Launch a Coin
            </Button>
         </Link>
      </div>
    </div>
   </>
  );
};

export default NotFound;
