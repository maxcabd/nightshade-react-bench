// app/lib/places/hooks.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Hours } from "@/app/lib/places/hours";

// Base API URL

const API_URL = 'http://localhost:8000';


const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60 seconds
    headers: {
        'Content-Type': 'application/json',

    },
});

type RestrictionBadge = {
    id: string;
    status: "verified" | "likely" | "unknown";
};

export interface HourSlot {
    start: string; // "08:30"
    end: string;   // "16:30"
}


export interface Card {
    place_id: string;
    name: string;

    address?: string;
    street_name?: string;
    city?: string;
    neighborhood?: string;

    lat: number;
    lng: number;
    distance_m?: number;

    price_tier?: number;
    photos?: string[];
    amenities?: string[];
    cuisines?: string[];
    categories?: string[];

    quality_score?: number;
    trend_score?: number;

    // OLD: Static status (calculated once by backend)
    open_now?: boolean | null;
    closes_at_local?: string | null;


    hours?: Hours;

    restriction_badges?: RestrictionBadge[];

    why?: string | null;
    mismatch_reasons?: string[];
    matches?: {
        category?: string | null;
        cuisine?: string | null;
        dish?: string | null;
    };
}

export interface SearchResponse {
    title: string;
    intent?: string;
    plan: any;
    cards: Card[];
    pins: { place_id: string; lat: number; lng: number }[];
    followups: string[];
    mode: string;
    model_used?: string;
    warnings: string[];
    cached: boolean;
}

interface SearchParams {
    text: string; // Your backend uses "text" not "query"
}

// API Functions
const searchRestaurants = async (params: SearchParams): Promise<SearchResponse> => {
    console.log('🔍 Sending search request:', params);
    const startTime = Date.now();

    try {
        const { data } = await apiClient.post('/v1/search', params); // Changed to /v1/search
        const endTime = Date.now();
        console.log(`✅ Search completed in ${endTime - startTime}ms`);
        console.log(`📊 Found ${data.cards?.length || 0} restaurants`);

        console.log('====== RAW RESPONSE DEBUG ======');
        console.log('Response status:', data.status);
        console.log('Response data type:', typeof data.data);
        if (data.cards && data.cards.length > 0) {
            console.log('====== HOURS DETAILED DEBUG ======');
            console.log('First card name:', data.cards[0].name);
            console.log('First card hours (stringified):', JSON.stringify(data.cards[0].hours, null, 2));
            console.log('Type of hours:', typeof data.cards[0].hours);
            console.log('Is hours an object?', typeof data.cards[0].hours === 'object');
            console.log('Is hours null?', data.cards[0].hours === null);
            console.log('Is hours undefined?', data.cards[0].hours === undefined);
            console.log('All card keys:', Object.keys(data.cards[0]));
            console.log('==================================');
        }
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('❌ Axios error:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
            });
        }
        throw error;
    }
};

// React Query Hooks

export const useSearchRestaurants = (
    params: SearchParams,
    enabled: boolean = true
) => {
    return useQuery({
        queryKey: ['restaurants', 'search', params],
        queryFn: () => searchRestaurants(params),
        enabled: enabled && !!params.text,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: 1,
    });
};

export const useSearchRestaurantsMutation = () => {
    return useMutation({
        mutationFn: searchRestaurants,
        onSuccess: (data) => {
            /*console.log('✅ Search successful!');
            console.log('📍 Title:', data.title);
            console.log('🎯 Intent:', data.intent);
            console.log('🍽️  Restaurants:', data.cards);
            console.log('====== HOURS CHECK ======');
            console.log('First card:', data.cards[0]);
            console.log('Has hours?', 'hours' in data.cards[0]);
            console.log('Hours:', data.cards[0].hours);
            console.log('========================');
            console.log('💡 Follow-ups:', data.followups);*/
        },
        onError: (error) => {
            console.error('❌ Search failed:', error);
        },
    });
};