import React from 'react';

const AddPointIcon = ({ className = '', onClick }) => (
    <svg className={className} onClick={onClick} width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 4V18" stroke="#30372D" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 11H18" stroke="#30372D" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export default AddPointIcon;
