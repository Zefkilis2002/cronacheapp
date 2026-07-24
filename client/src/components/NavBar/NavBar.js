import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  // Sottomenu "Grafiche": su desktop si apre in hover (via CSS), su mobile
  // con un tap (questo stato)
  const [graphicsOpen, setGraphicsOpen] = useState(false);

  // Toggle the menu on mobile
  const toggleMenu = () => setIsOpen(!isOpen);

  // Chiude tutto quando si clicca una voce (utile soprattutto su mobile)
  const closeAll = () => {
    setIsOpen(false);
    setGraphicsOpen(false);
  };

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
        <Link to="/">CronacheApp</Link>
      </div>
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><Link to="/" onClick={closeAll}>FullTime</Link></li>
        <li><Link to="/news" onClick={closeAll}>News</Link></li>
        <li><Link to="/classifica" onClick={closeAll}>Classifica</Link></li>
        <li><Link to="/bio-creator" onClick={closeAll}>Bio Creator</Link></li>
        <li className={`dropdown ${graphicsOpen ? 'open' : ''}`}>
          <button
            type="button"
            className="dropdown-trigger"
            aria-haspopup="true"
            aria-expanded={graphicsOpen}
            onClick={() => setGraphicsOpen(o => !o)}
          >
            Grafiche <span className="dropdown-caret" aria-hidden="true">▾</span>
          </button>
          <ul className="dropdown-menu">
            <li><Link to="/lineup" onClick={closeAll}>LineUp</Link></li>
            <li><Link to="/squad" onClick={closeAll}>Squad</Link></li>
            <li><Link to="/keyplayers" onClick={closeAll}>Key Players</Link></li>
            <li><Link to="/campionati" onClick={closeAll}>Campionati</Link></li>
          </ul>
        </li>
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