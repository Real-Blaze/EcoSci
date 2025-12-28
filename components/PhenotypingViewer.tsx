import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Loader2, Box, Layers, Maximize, Palette, ScanLine, Flame, RefreshCw } from 'lucide-react';

interface PhenotypingViewerProps {
    imageSrc: string;
    onCapture?: (dataUrl: string) => void;
}

export const PhenotypingViewer: React.FC<PhenotypingViewerProps> = ({ imageSrc, onCapture }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const originalColorsRef = useRef<Float32Array | null>(null);
    const depthValuesRef = useRef<Float32Array | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [pointsCount, setPointsCount] = useState(0);
    const [renderMode, setRenderMode] = useState<'rgb' | 'heatmap' | 'xray'>('rgb');
    const [autoRotate, setAutoRotate] = useState(true);

    // Color mapping helper
    const getHeatmapColor = (t: number) => {
        // Simple Blue -> Cyan -> Green -> Yellow -> Red gradient
        // t is 0..1
        const r = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 4 - 3)));
        const g = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 4 - 2)));
        const b = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 4 - 1)));
        return [r, g, b];
    };

    const updateColors = useCallback(() => {
        if (!geometryRef.current || !originalColorsRef.current || !depthValuesRef.current) return;
        
        const count = pointsCount;
        const colors = geometryRef.current.attributes.color.array as Float32Array;
        const original = originalColorsRef.current;
        const depths = depthValuesRef.current;

        for (let i = 0; i < count; i++) {
            if (renderMode === 'rgb') {
                colors[i * 3] = original[i * 3];
                colors[i * 3 + 1] = original[i * 3 + 1];
                colors[i * 3 + 2] = original[i * 3 + 2];
            } else if (renderMode === 'heatmap') {
                // Normalize depth roughly 0..0.5 to 0..1
                const d = Math.min(1, Math.max(0, depths[i] * 2.0)); 
                const [r, g, b] = getHeatmapColor(d);
                colors[i * 3] = r;
                colors[i * 3 + 1] = g;
                colors[i * 3 + 2] = b;
            } else if (renderMode === 'xray') {
                const val = 0.8; // High brightness for x-ray
                colors[i * 3] = val;
                colors[i * 3 + 1] = val;
                colors[i * 3 + 2] = val;
            }
        }
        
        geometryRef.current.attributes.color.needsUpdate = true;
        
        if (materialRef.current) {
            // Adjust material properties based on mode
            if (renderMode === 'xray') {
                materialRef.current.blending = THREE.AdditiveBlending;
                materialRef.current.uniforms.opacity.value = 0.3;
            } else {
                materialRef.current.blending = THREE.NormalBlending;
                materialRef.current.uniforms.opacity.value = 1.0;
            }
        }

    }, [renderMode, pointsCount]);

    useEffect(() => {
        updateColors();
    }, [renderMode, updateColors]);

    useEffect(() => {
        if (!mountRef.current) return;

        // Cleanup previous scene if exists
        if (rendererRef.current) {
            mountRef.current.innerHTML = '';
        }

        // Scene Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x111827); // gray-900
        scene.fog = new THREE.FogExp2(0x111827, 0.05);

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        cameraRef.current = camera;
        camera.position.set(0, -1, 3);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        rendererRef.current = renderer;
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Process Image
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 300; // Increased resolution slightly
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, size, size);
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;

            const particleCount = size * size;
            setPointsCount(particleCount);

            const geometry = new THREE.BufferGeometry();
            geometryRef.current = geometry;

            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            
            // Storage for mode switching
            const originalColors = new Float32Array(particleCount * 3);
            const depthValues = new Float32Array(particleCount);

            const spread = 4.0; 

            for (let i = 0; i < particleCount; i++) {
                const x = (i % size) / size - 0.5;
                const y = 0.5 - Math.floor(i / size) / size; // Flip Y
                
                const r = data[i * 4] / 255;
                const g = data[i * 4 + 1] / 255;
                const b = data[i * 4 + 2] / 255;
                const a = data[i * 4 + 3] / 255;

                // Luminance for depth
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                const z = luminance * 0.5; 

                if (a > 0.1) {
                    positions[i * 3] = x * spread;
                    positions[i * 3 + 1] = y * spread;
                    positions[i * 3 + 2] = z;

                    colors[i * 3] = r;
                    colors[i * 3 + 1] = g;
                    colors[i * 3 + 2] = b;
                    
                    originalColors[i * 3] = r;
                    originalColors[i * 3 + 1] = g;
                    originalColors[i * 3 + 2] = b;
                    
                    depthValues[i] = z;

                    // Size variation: darker areas often recede, make them slightly smaller?
                    sizes[i] = (0.5 + luminance) * 0.04;
                } else {
                    positions[i * 3] = 99999;
                    positions[i * 3 + 1] = 99999;
                    positions[i * 3 + 2] = 99999;
                }
            }

            originalColorsRef.current = originalColors;
            depthValuesRef.current = depthValues;

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png') },
                    opacity: { value: 1.0 }
                },
                vertexShader: `
                    attribute float size;
                    varying vec3 vColor;
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform sampler2D pointTexture;
                    uniform float opacity;
                    varying vec3 vColor;
                    void main() {
                        gl_FragColor = vec4(vColor, opacity);
                        vec4 tex = texture2D(pointTexture, gl_PointCoord);
                        gl_FragColor = gl_FragColor * tex;
                        if (gl_FragColor.a < 0.1) discard;
                    }
                `,
                transparent: true,
                vertexColors: true,
                depthWrite: false, // Better for transparency
            });
            materialRef.current = material;

            const particles = new THREE.Points(geometry, material);
            particlesRef.current = particles;
            scene.add(particles);
            
            // Grid
            const gridHelper = new THREE.GridHelper(5, 20, 0x4b5563, 0x1f2937);
            gridHelper.position.y = -1.5;
            scene.add(gridHelper);

            setIsLoading(false);
        };

        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            controls.update();
            if (sceneRef.current && cameraRef.current && rendererRef.current) {
                if (autoRotate && particlesRef.current) {
                    particlesRef.current.rotation.y += 0.002;
                }
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            if (rendererRef.current && mountRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
            }
            if (geometryRef.current) geometryRef.current.dispose();
            if (materialRef.current) materialRef.current.dispose();
        };

    }, [imageSrc]); // autoRotate is handled in ref, not dep array to avoid re-init

    // Capture screenshot function for parent
    const takeScreenshot = () => {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
            if (onCapture) onCapture(dataUrl);
        }
    };

    return (
        <div className="relative w-full h-[400px] md:h-[500px] bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl group ring-1 ring-white/10">
            <div ref={mountRef} className="w-full h-full cursor-move" />
            
            {/* Top Toolbar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="flex items-center gap-2 text-green-400 font-mono text-xs font-bold uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-green-500/30 shadow-lg">
                        <Box size={12} />
                        Gaussian View
                    </div>
                </div>

                <div className="flex flex-col gap-2 pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-1 flex flex-col gap-1 border border-white/10">
                         <button 
                            onClick={() => setRenderMode('rgb')}
                            className={`p-2 rounded-md transition-all ${renderMode === 'rgb' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                            title="RGB Mode"
                        >
                            <Palette size={18} />
                        </button>
                        <button 
                            onClick={() => setRenderMode('heatmap')}
                            className={`p-2 rounded-md transition-all ${renderMode === 'heatmap' ? 'bg-indigo-500/50 text-indigo-200' : 'text-gray-400 hover:text-white'}`}
                            title="Depth Heatmap"
                        >
                            <Flame size={18} />
                        </button>
                        <button 
                            onClick={() => setRenderMode('xray')}
                            className={`p-2 rounded-md transition-all ${renderMode === 'xray' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                            title="X-Ray Structure"
                        >
                            <ScanLine size={18} />
                        </button>
                    </div>
                    
                    <button 
                         onClick={() => setAutoRotate(!autoRotate)}
                         className={`p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all ${autoRotate ? 'bg-green-500/20 text-green-400' : 'bg-black/60 text-gray-400'}`}
                         title="Auto Rotate"
                    >
                        <RefreshCw size={18} className={autoRotate ? "animate-spin-slow" : ""} />
                    </button>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-4 left-4 pointer-events-none text-white/50 text-[10px] font-mono space-y-1">
                <div className="flex items-center gap-2">
                    <Layers size={10} />
                    Cloud Density: {isLoading ? 'Calculating...' : `${(pointsCount/1000).toFixed(1)}k points`}
                </div>
                <div>Render: Three.js WebGL2</div>
                <div>Mode: {renderMode.toUpperCase()}</div>
            </div>
            
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                    <Loader2 size={32} className="text-green-500 animate-spin mb-4" />
                    <p className="text-gray-400 font-mono text-sm animate-pulse tracking-widest">BUILDING VOXEL OCTREE...</p>
                </div>
            )}
        </div>
    );
};