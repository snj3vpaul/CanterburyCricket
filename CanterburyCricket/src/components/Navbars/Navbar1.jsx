import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar1.css";

export const Navbar1 = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollY } = window;
      if (scrollY > lastScrollTop.current) setIsVisible(false);
      else setIsVisible(true);
      lastScrollTop.current = scrollY <= 0 ? 0 : scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar-1 ${isVisible ? "visible" : ""}`}>
      <h1>F</h1>
      <div className="nav-items">
  <Link to="/">About</Link>
  <Link to="/Sponsors">Sponsors</Link>      
  <Link to="/Season">Season</Link>           
  <Link to="/Awards">Awards Night</Link>     
  <Link to="/Contact">Contact</Link>
</div>

    </nav>
  );
};
