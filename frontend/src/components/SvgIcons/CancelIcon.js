// src/components/SvgIcons/CancelIcon.js
import React from 'react';

const CancelIcon = ({ className = '', onClick }) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="14" fill="#536C45"/>
            <path d="M9 9L19 19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M19 9L9 19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    </button>
);

export default CancelIcon;
