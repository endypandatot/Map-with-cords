// src/components/CustomScrollbar.js
import React, { useState, useEffect, useCallback, useRef } from 'react';

const CustomScrollbar = ({ scrollableRef, listLength, visibilityThreshold }) => {
    const [thumbHeight, setThumbHeight] = useState(20);
    const [thumbTop, setThumbTop] = useState(0);
    const trackRef = useRef(null);
    const thumbRef = useRef(null);

    const handleScroll = useCallback(() => {
        const el = scrollableRef.current;
        if (!el || !trackRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        const trackHeight = trackRef.current.clientHeight;

        const newThumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, 20); // min height 20px
        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = trackHeight - newThumbHeight;

        setThumbHeight(newThumbHeight);
        setThumbTop((scrollTop / maxScrollTop) * maxThumbTop);
    }, [scrollableRef]);

    useEffect(() => {
        const el = scrollableRef.current;
        if (!el) return;

        // Initial calculation
        handleScroll();

        el.addEventListener('scroll', handleScroll);
        // Recalculate on window resize
        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(el);

        return () => {
            el.removeEventListener('scroll', handleScroll);
            resizeObserver.unobserve(el);
        };
    }, [scrollableRef, listLength, handleScroll]);

    if (listLength <= visibilityThreshold) {
        return null; // Don't render scrollbar if not needed
    }

    return (
        <div className="custom-scrollbar-track" ref={trackRef}>
            <div
                className="custom-scrollbar-thumb-dynamic"
                ref={thumbRef}
                style={{ height: `${thumbHeight}px`, top: `${thumbTop}px` }}
            />
        </div>
    );
};

export default CustomScrollbar;
