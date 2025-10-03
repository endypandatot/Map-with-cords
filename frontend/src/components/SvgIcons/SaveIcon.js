// src/components/SvgIcons/SaveIcon.js
import React from 'react';

const SaveIcon = ({ className = '', onClick, disabled = false, fillColor = '#536C45' }) => (
    <button onClick={onClick} disabled={disabled} style={{ background: 'none', border: 'none', padding: 0, cursor: disabled ? 'default' : 'pointer' }}>
        <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="14" fill={disabled ? '#DCDAD6' : fillColor}/>
            <path d="M9 14.5L12.5 18L19 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </button>
);

export default SaveIcon;
