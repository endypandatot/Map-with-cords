import React from 'react';

const PointDeleteIcon = ({ className = '', onClick }) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12" stroke="#C33939" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M4 4L12 12" stroke="#C33939" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    </button>
);

export default PointDeleteIcon;
