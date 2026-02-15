import React, { useMemo } from 'react';
import lifecycleMapImg from '../assets/lifecycle_map.png';

// Approximate positions (in percentage) for each phase node on the diagram.
// Center of the number box/icon.
const NODE_POSITIONS = {
    0: { left: '5%', top: '78%' },     // 0 Aware
    1: { left: '5%', top: '38%' },     // 1 Sourced
    2: { left: '33%', top: '12%' },    // 2 Selected
    3: { left: '78%', top: '12%' },    // 3 Ordered
    4: { left: '92%', top: '22%' },    // 4 Use
    5: { left: '92%', top: '48%' },    // 5 Adopt
    6: { left: '70%', top: '78%' },    // 6 Assess
    7: { left: '49%', top: '50%' },    // 7 Renew
    8: { left: '39%', top: '50%' },    // 8 Add
    9: { left: '29%', top: '50%' },    // 9 Expand
};

// Map the dropdown "Specific View" values to the list of active nodes.
const VIEW_MAPPING = {
    // 1. Strategic Overview
    "Full Map (0-9)": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],

    // 2. Phased Lifecycle
    "First Order (0-3)": [0, 1, 2, 3],
    "Order to Use (3-4)": [3, 4],
    "Use & Assess (4 & 6)": [4, 6], // Note: 5 is implicit between 4 and 6 usually?
    "Renew / Expand (7-9)": [7, 8, 9],

    // 3. Deep Dive (Granular)
    "Aware-Source (0-1)": [0, 1],
    "Source-Select (1-2)": [1, 2],
    "Select-Order (2-3)": [2, 3],
    "Order-Use (3-4)": [3, 4],
    "Order-Assess (4-6)": [4, 6], // Skipping 5?
    "Assess-Renew (6-7)": [6, 7],
    "Assess-Add (6-8)": [6, 8],
    "Assess-Expand (6-9)": [6, 9]
};

const LifecycleMap = ({ currentView }) => {

    const activeNodes = useMemo(() => {
        return VIEW_MAPPING[currentView] || [];
    }, [currentView]);

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <img
                src={lifecycleMapImg}
                alt="Customer Decision Lifecycle Map"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            {/* Overlay Container */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}>
                {Object.entries(NODE_POSITIONS).map(([nodeId, pos]) => {
                    const isActive = activeNodes.includes(parseInt(nodeId));
                    return (
                        <div
                            key={nodeId}
                            style={{
                                position: 'absolute',
                                left: pos.left,
                                top: pos.top,
                                width: '6%', // Responsive size relative to container
                                height: '8%', // Aspect ratio might be an issue, better to use fixed aspects or padding hack
                                aspectRatio: '1 / 1',
                                transform: 'translate(-50%, -50%)',
                                borderRadius: '50%',
                                backgroundColor: isActive ? 'rgba(34, 197, 94, 0.5)' : 'transparent',
                                border: isActive ? '2px solid #22c55e' : 'none',
                                boxShadow: isActive ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                opacity: isActive ? 1 : 0
                            }}
                        >
                            {/* Only show number if active? Or mostly for debug? */}
                            {isActive && nodeId}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LifecycleMap;
