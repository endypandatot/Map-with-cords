// src/components/SvgIcons/AddRouteIcon.js
import React from 'react';

const AddRouteIcon = ({ className = '', onClick }) => (
    <svg className={className} onClick={onClick} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="14" fill="#536C45"/>
        <path d="M14 9V19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 14H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export default AddRouteIcon;

