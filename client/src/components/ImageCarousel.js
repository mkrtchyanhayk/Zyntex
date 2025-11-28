import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { getImageUrl } from '../utils/imageUrl';

export default function ImageCarousel({ images }) {
    if (!images || images.length === 0) return null;

    // Sort by order
    const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (sortedImages.length === 1) {
        return (
            <div className="relative bg-black/20">
                <img
                    src={getImageUrl(sortedImages[0].url)}
                    alt="Post"
                    className="w-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div className="relative bg-black/20">
            <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="w-full"
            >
                {sortedImages.map((img, idx) => (
                    <SwiperSlide key={idx}>
                        <div className="relative aspect-square">
                            <img
                                src={getImageUrl(img.url)}
                                alt={`Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
            <div className="absolute top-4 right-4 z-10 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                1/{sortedImages.length}
            </div>
        </div>
    );
}
