// CSS modules type declaration
declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

// Leaflet CSS type declaration
declare module 'leaflet/dist/leaflet.css';

// Global types
declare global {
    interface Window {
        L?: any;
    }
}