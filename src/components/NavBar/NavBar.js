import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  // Toggle the menu on mobile
  const toggleMenu = () => setIsOpen(!isOpen);

  // Sticky NavBar when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setSticky(true);
      } else {
        setSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${sticky ? 'sticky' : ''}`}>
      <div className="navbar-logo">
        <a href="#home">CronacheApp</a>
      </div>
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><Link to="/" onClick={() => setIsOpen(false)}>FullTime</Link></li>
        <li><Link to="/news" onClick={() => setIsOpen(false)}>News</Link></li>
        <li><a href="#services" onClick={() => setIsOpen(false)}>Coming Soon</a></li>
        <li><a href="#contact" onClick={() => setIsOpen(false)}>About Us</a></li>
      </ul>
      <button className="hamburger" aria-label="Toggle menu" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
    </nav>
  );
};

export default NavBar;