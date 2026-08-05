'use client';
import React, { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import axios from "axios";
import { Search, MapPin, Clock, Star, Navigation, Info, Utensils, ChevronDown } from 'lucide-react';
import "leaflet/dist/leaflet.css";
import styles from "../component-css/FoodStall.module.css";

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
// Fix Leaflet marker icon issue
if (typeof window !== 'undefined') {
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Inner component to handle map centering
function ChangeView({ center, zoom }) {
    const { useMap } = require('react-leaflet');
    const map = useMap();

    useEffect(() => {
        if (center && center.length === 2) {
            console.log("Map moving to:", center, "at zoom:", zoom);
            map.flyTo(center, zoom || 16, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);

    return null;
}

const FoodStall = () => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStall, setSelectedStall] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [mapReady, setMapReady] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

    useEffect(() => {
        setMapReady(true);
    }, []);

    useEffect(() => {
        const fetchStalls = async () => {
            if (page === 1) setLoading(true);
            try {
                // Sử dụng params để tận dụng Indexing ở Backend nếu có searchQuery
                const response = await axios.get(`${API_URL}/check-FoodStall`, {
                    params: {
                        query: searchQuery,
                        page: page,
                        pageSize: 20
                    }
                });

                // Backend mới trả về { source, data }, Backend cũ trả về Array
                const data = response.data.data || (Array.isArray(response.data) ? response.data : []);

                if (data.length < 20) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                setStalls(prev => page === 1 ? data : [...prev, ...data]);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching food stalls:", err);
                setError("Failed to load food stalls data.");
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchStalls();
        }, 300); // Đợi 300ms sau khi gõ mới gọi API

        return () => clearTimeout(debounceTimer);
    }, [API_URL, searchQuery, page]);

    const filteredStalls = useMemo(() => {
        return stalls.filter(stall =>
            stall.foodStallName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (stall.dish && stall.dish.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [stalls, searchQuery]);

    // Reset page when search query changes
    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const handleStallClick = (stall) => {
        setSelectedStall(stall);
    };

    // Auto-select stall on mobile swipe/scroll
    useEffect(() => {
        if (typeof window === 'undefined' || window.innerWidth > 768) return;

        const observerOptions = {
            root: document.querySelector(`.${styles.stallList}`),
            threshold: 0.7
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stallId = entry.target.getAttribute('data-id');
                    const stall = stalls.find(s => s.id === stallId);
                    if (stall && selectedStall?.id !== stall.id) {
                        setSelectedStall(stall);
                    }
                }
            });
        }, observerOptions);

        const cards = document.querySelectorAll(`.${styles.stallCard}`);
        cards.forEach(card => observer.observe(card));

        return () => observer.disconnect();
    }, [filteredStalls, stalls, selectedStall]);

    const parseCoords = (coordStr) => {
        const defaultResult = { center: [10.762622, 106.660172], zoom: 13 };
        if (!coordStr) return defaultResult;
        try {
            const parts = coordStr.split(',').map(p => parseFloat(p.trim()));
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return {
                    center: [parts[0], parts[1]],
                    zoom: parts[2] || 16
                };
            }
        } catch (e) {
            console.error("Error parsing coords:", coordStr, e);
        }
        return defaultResult;
    };

    return (
        <>
            <div style={{ textAlign: 'center', margin: '1.5rem auto' }}>
                <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Khám phá ẩm thực</h1>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '0 1.5rem' }}>Khám phá những món ăn ngon và địa điểm ăn uống tuyệt vời xung quanh bạn</p>
            </div>
            <div className={styles.foodStallContainer} id="foodstallCont">
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>

                        <div className={styles.searchContainer}>
                            <Search className={styles.searchIcon} size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm quán ăn, món ăn..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.stallList}>
                        {loading && page === 1 ? (
                            <div className={styles.loadingState}>Đang tải dữ liệu...</div>
                        ) : error ? (
                            <div className={styles.errorState}>{error}</div>
                        ) : filteredStalls.length === 0 ? (
                            <div className={styles.emptyState}>Không tìm thấy quán ăn nào.</div>
                        ) : (
                            <>
                                {filteredStalls.map(stall => (
                                    <div
                                        key={stall.id}
                                        data-id={stall.id}
                                        className={`${styles.stallCard} ${selectedStall?.id === stall.id ? styles.active : ''}`}
                                        onClick={() => handleStallClick(stall)}
                                    >
                                        <span className={styles.stallName}>{stall.foodStallName}</span>
                                        <span className={styles.stallDish}>
                                            <Utensils size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            {stall.dish || "Món ăn đa dạng"}
                                        </span>
                                        <div className={styles.stallInfo}>
                                            <span><MapPin size={14} /> {stall.city || "TP. HCM"}</span>
                                            {stall.feedbackVote && (
                                                <span className={styles.rating}><Star size={14} fill="#fbbf24" /> {stall.feedbackVote}</span>
                                            )}
                                        </div>
                                        <div className={styles.stallInfo}>
                                            <span><Clock size={14} /> {stall.workingTime || "Mở cửa cả ngày"}</span>
                                        </div>
                                    </div>
                                ))}
                                {hasMore && (
                                    <button
                                        className={styles.loadMoreButton}
                                        onClick={() => setPage(prev => prev + 1)}
                                        disabled={loading}
                                        style={loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                                    >
                                        {loading ? 'Đang tải...' : 'Xem thêm'} <ChevronDown size={18} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </aside>

                <main className={styles.mapContainer}>
                    {mapReady && (
                        <MapContainer
                            center={[10.762622, 106.660172]}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />

                            {filteredStalls.map(stall => {
                                const { center } = parseCoords(stall.longLat);
                                return (
                                    <Marker
                                        key={stall.id}
                                        position={center}
                                        eventHandlers={{
                                            click: () => setSelectedStall(stall),
                                        }}
                                    >
                                        <Popup>
                                            <div className="custom-popup">
                                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#38bdf8' }}>{stall.foodStallName}</h3>
                                                <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>{stall.fullAddress}</p>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Navigation size={12} /> {stall.city}
                                                    </span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                            {selectedStall && (
                                <ChangeView
                                    center={parseCoords(selectedStall.longLat).center}
                                    zoom={parseCoords(selectedStall.longLat).zoom}
                                />
                            )}
                        </MapContainer>
                    )}
                </main>
            </div>
        </>
    );
};

export default FoodStall;
