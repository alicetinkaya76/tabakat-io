import { useEffect, useRef, useState } from 'react';

/**
 * Scroll-triggered visibility hook using IntersectionObserver.
 * Returns [ref, isVisible] — attach ref to the element, isVisible triggers once.
 */
export function useInView(options = {}) {
  const { threshold = 0.12, rootMargin = '0px 0px -40px 0px', once = true } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
}

/**
 * Component wrapper for scroll-reveal sections.
 * Usage: <ScrollReveal className="..."><content/></ScrollReveal>
 */
export function ScrollReveal({ children, className = '', delay = 0, as: Tag = 'div', ...props }) {
  const [ref, isVisible] = useInView();

  return (
    <Tag
      ref={ref}
      className={`scroll-reveal ${isVisible ? 'scroll-reveal--visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
