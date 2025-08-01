// Oktong 위스키 추천 데모 앱 (src/frontend/OktongApp.tsx)
// 이 코드는 백엔드 서버나 실제 데이터베이스 없이 프론트엔드에서 바로 실행 가능한 데모 앱입니다.
// 모든 데이터와 로직이 이 파일 내부에 포함되어 있습니다.

import React, { useState, useEffect, useCallback } from 'react';

// --- 인메모리 데이터베이스 (database-oktong.ts 내용 통합) ---
// 위스키 데이터 모델 정의
export interface Whiskey {
    id: string;
    name: string;
    type: '싱글 몰트' | '블렌디드' | '버번' | '라이' | '기타';
    distillery: string;
    country: string;
    age?: number;
    price: number; // 가격대 카테고리 대신 정확한 숫자 가격으로 변경
    flavorProfile: string[];
    description: string;
    imageUrl?: string;
    reviews?: string[];
}

// 사용자 취향 선호도 모델 정의
export interface UserPreferences {
    bodyPreference: number;
    richnessPreference: number;
    smokinessPreference: number;
    sweetnessPreference: number;
    minPreferredPrice?: number; // 선호하는 최소 가격 (숫자)
    maxPreferredPrice?: number; // 선호하는 최대 가격 (숫자)
    experienceLevel?: '초보' | '중급' | '전문가';
    flavorKeywords: string[]; // 선호하는 맛/향 키워드 목록
}

// 사용자 상호작용 기록 모델 정의
export interface UserInteractionHistory {
    viewedWhiskeys: Array<{ whiskeyId: string; viewedAt: number }>;
    likedWhiskeys: string[];
    dislikedWhiskeys: string[];
    searches: string[];
}

// 사용자가 작성한 평가 노트 모델 정의
export interface TastingNote {
    id: string;
    userId: string;
    whiskeyId: string;
    rating: number; // 총점 (1-5)
    reviewText: string;
    bodyRating: number;
    richnessRating: number;
    smokinessRating: number;
    sweetnessRating: number;
    createdAt: number;
}

// 사용자 데이터 모델 정의
export interface User {
    id: string;
    preferences: UserPreferences;
    interactionHistory: UserInteractionHistory;
    evaluatedWhiskeyIds: string[]; // 사용자가 평가한 TastingNote ID 목록
}

// 데이터베이스 서비스 (Singleton Pattern)
class DatabaseService {
    private static instance: DatabaseService;

    private whiskeys: Whiskey[] = [];
    private users: User[] = [];
    private tastingNotes: TastingNote[] = [];

    private constructor() {
        this.loadInitialData();
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    private loadInitialData() {
        // priceRange 대신 price 속성 사용
        this.whiskeys = [
            { id: 'w001', name: '라프로익 10년', type: '싱글 몰트', distillery: '라프로익', country: '스코틀랜드', age: 10, price: 120000, flavorProfile: ['피트', '스모키', '요오드', '해조류'], description: '강렬한 피트향과 스모키함이 특징인 아일라 싱글 몰트 위스키입니다. 독특한 개성을 찾는 분들께 추천합니다.', imageUrl: 'https://placehold.co/150x250/aabbcc/ffffff?text=Laphroaig', reviews: ['피트향이 정말 강해서 좋아요.', '독특한 맛이 일품입니다.'] },
            { id: 'w002', name: '발렌타인 17년', type: '블렌디드', distillery: '발렌타인', country: '스코틀랜드', age: 17, price: 95000, flavorProfile: ['꿀', '바닐라', '과일', '부드러움'], description: '부드러운 목넘김과 균형 잡힌 맛이 특징인 블렌디드 위스키입니다. 선물용으로도 인기가 많습니다.', imageUrl: 'https://placehold.co/150x250/ccbbaa/ffffff?text=Ballantines', reviews: ['부드럽고 마시기 편해요.', '선물용으로 좋습니다.'] },
            { id: 'w003', name: '맥캘란 12년 쉐리 오크', type: '싱글 몰트', distillery: '맥캘란', country: '스코틀랜드', age: 12, price: 250000, flavorProfile: ['쉐리', '건포도', '오렌지', '스파이스'], description: '쉐리 오크 숙성으로 인한 풍부한 과일향과 스파이시함이 매력적인 위스키입니다. 깊고 복합적인 맛을 선사합니다.', imageUrl: 'https://placehold.co/150x250/bbaacc/ffffff?text=Macallan', reviews: ['쉐리향이 정말 좋아요.', '부드럽고 깊은 맛입니다.'] },
            { id: 'w004', name: '아벨라워 12년 더블 캐스크', type: '싱글 몰트', distillery: '아벨라워', country: '스코틀랜드', age: 12, price: 110000, flavorProfile: ['과일', '꿀', '스파이스', '초콜릿'], description: '버번과 쉐리 캐스크의 더블 숙성으로 복합적인 맛과 향을 선사합니다. 균형 잡힌 맛으로 많은 사랑을 받습니다.', imageUrl: 'https://placehold.co/150x250/ccbbaa/ffffff?text=Aberlour', reviews: ['균형 잡힌 맛이 좋습니다.', '가성비 좋은 싱글몰트.'] },
            { id: 'w005', name: '글렌피딕 12년', type: '싱글 몰트', distillery: '글렌피딕', country: '스코틀랜드', age: 12, price: 80000, flavorProfile: ['과일', '배', '크리미', '오크'], description: '신선한 배와 섬세한 오크 향이 조화를 이루는 세계에서 가장 많이 팔리는 싱글 몰트 위스키 중 하나입니다. 입문용으로도 좋습니다.', imageUrl: 'https://placehold.co/150x250/cbaabc/ffffff?text=Glenfiddich', reviews: ['입문용으로 최고입니다.', '깔끔하고 부드러워요.'] },
            { id: 'w006', name: '히비키 하모니', type: '블렌디드', distillery: '산토리', country: '일본', price: 180000, flavorProfile: ['꿀', '오렌지 껍질', '화이트 초콜릿'], description: '다양한 몰트와 그레인 위스키를 섬세하게 블렌딩하여 조화로운 맛을 선사하는 일본 위스키입니다. 부드럽고 우아한 향이 특징입니다.', imageUrl: 'https://placehold.co/150x250/ddccbb/ffffff?text=Hibiki', reviews: ['정말 부드럽고 향이 좋아요.', '고급스러운 맛입니다.'] },
            { id: 'w007', name: '메이커스 마크', type: '버번', distillery: '메이커스 마크', country: '미국', age: 6, price: 65000, flavorProfile: ['바닐라', '카라멜', '오크', '스파이스'], description: '밀을 사용하여 부드럽고 달콤한 맛이 특징인 버번 위스키입니다. 손으로 밀봉한 붉은 왁스 캡이 상징적입니다.', imageUrl: 'https://placehold.co/150x250/eeddcc/ffffff?text=MakersMark', reviews: ['버번 입문으로 좋아요.', '달콤하고 부드럽습니다.'] }
        ];

        this.users = [
            { id: 'user001', preferences: { bodyPreference: 3, richnessPreference: 4, smokinessPreference: 5, sweetnessPreference: 1, minPreferredPrice: 50000, maxPreferredPrice: 200000, experienceLevel: '중급', flavorKeywords: ['피트', '스모키'] }, interactionHistory: { viewedWhiskeys: [{ whiskeyId: 'w001', viewedAt: Date.now() - 3600000 }], likedWhiskeys: ['w001'], dislikedWhiskeys: [], searches: [] }, evaluatedWhiskeyIds: [] },
            { id: 'user002', preferences: { bodyPreference: 4, richnessPreference: 3, smokinessPreference: 1, sweetnessPreference: 5, minPreferredPrice: 0, maxPreferredPrice: 100000, experienceLevel: '초보', flavorKeywords: ['바닐라', '꿀'] }, interactionHistory: { viewedWhiskeys: [{ whiskeyId: 'w002', viewedAt: Date.now() - 7200000 }, { whiskeyId: 'w007', viewedAt: Date.now() - 1800000 }], likedWhiskeys: ['w002'], dislikedWhiskeys: [], searches: [] }, evaluatedWhiskeyIds: [] },
            { id: 'user003', preferences: { bodyPreference: 5, richnessPreference: 5, smokinessPreference: 2, sweetnessPreference: 3, minPreferredPrice: 150000, maxPreferredPrice: 500000, experienceLevel: '전문가', flavorKeywords: ['쉐리', '과일'] }, interactionHistory: { viewedWhiskeys: [{ whiskeyId: 'w003', viewedAt: Date.now() - 5400000 }], likedWhiskeys: ['w003'], dislikedWhiskeys: [], searches: [] }, evaluatedWhiskeyIds: [] }
        ];

        this.tastingNotes = [
            { id: 'tn001', userId: 'user001', whiskeyId: 'w001', rating: 5, reviewText: '정말 강렬한 피트향이 인상적입니다. 아일라 위스키의 정수!', bodyRating: 5, richnessRating: 4, smokinessRating: 5, sweetnessRating: 1, createdAt: Date.now() - 86400000 }
        ];
        const user001 = this.users.find(u => u.id === 'user001');
        if (user001) {
            user001.evaluatedWhiskeyIds.push('tn001');
        }
    }

    getAllWhiskeys(): Whiskey[] { return this.whiskeys; }
    getWhiskeyById(id: string): Whiskey | undefined { return this.whiskeys.find(w => w.id === id); }
    getUserById(id: string): User | undefined { return this.users.find(u => u.id === id); }
    updateUser(userId: string, updateData: Partial<User>): User | undefined {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            this.users[userIndex] = {
                ...this.users[userIndex],
                ...updateData,
                preferences: updateData.preferences ? { ...this.users[userIndex].preferences, ...updateData.preferences } : this.users[userIndex].preferences,
                interactionHistory: updateData.interactionHistory ? { ...this.users[userIndex].interactionHistory, ...updateData.interactionHistory } : this.users[userIndex].interactionHistory,
            };
            return this.users[userIndex];
        }
        return undefined;
    }
    addUser(newUser: User): User { this.users.push(newUser); return newUser; }
    getAllTastingNotes(): TastingNote[] { return this.tastingNotes; }
    getTastingNotesByWhiskeyId(whiskeyId: string): TastingNote[] { return this.tastingNotes.filter(tn => tn.whiskeyId === whiskeyId); }
    getTastingNotesByUserId(userId: string): TastingNote[] { return this.tastingNotes.filter(tn => tn.userId === userId); }
    addTastingNote(newNote: TastingNote): TastingNote {
        this.tastingNotes.push(newNote);
        const user = this.getUserById(newNote.userId);
        if (user && !user.evaluatedWhiskeyIds.includes(newNote.id)) {
            user.evaluatedWhiskeyIds.push(newNote.id);
            this.updateUser(user.id, { evaluatedWhiskeyIds: user.evaluatedWhiskeyIds });
        }
        return newNote;
    }
    updateTastingNote(noteId: string, updateData: Partial<TastingNote>): TastingNote | undefined {
        const noteIndex = this.tastingNotes.findIndex(tn => tn.id === noteId);
        if (noteIndex > -1) {
            this.tastingNotes[noteIndex] = { ...this.tastingNotes[noteIndex], ...updateData };
            return this.tastingNotes[noteIndex];
        }
        return undefined;
    }
}
const dbService = DatabaseService.getInstance();

// --- Oktong 추천 서비스 (oktong-recommendation-service.ts 내용 통합) ---
// 추천 결과 모델 정의
interface RecommendationResult {
    whiskey: Whiskey;
    reason: string;
}

// 필터링 옵션 인터페이스
interface WhiskeyFilterOptions {
    type?: Whiskey['type'];
    // priceRange?: Whiskey['priceRange']; // 가격대 카테고리 필터 제거
    minPrice?: number; // 숫자 범위 필터링을 위한 최소 가격
    maxPrice?: number; // 숫자 범위 필터링을 위한 최대 가격
    country?: string;
    flavorKeywords?: string[];
}

// 정렬 기준 타입
type WhiskeySortBy = 'name' | 'price' | 'age';
type SortOrder = 'asc' | 'desc';

class OktongRecommendationService {
    constructor() {}

    // getPriceValue 헬퍼 함수는 더 이상 필요 없으므로 제거

    async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<User | null> {
        const user = dbService.getUserById(userId);
        if (user) {
            const updatedUser = dbService.updateUser(userId, { preferences });
            if (updatedUser) { return updatedUser; } else { throw new Error("저장 실패: 데이터베이스 업데이트 중 오류가 발생했습니다."); }
        } else { throw new Error("사용자를 찾을 수 없습니다."); }
    }

    async recommendWhiskeys(
        userQuery: string,
        userId?: string,
        options?: { flavorKeywords?: string[]; minPreferredPrice?: number; maxPreferredPrice?: number; type?: '싱글 몰트' | '블렌디드' | '버번' | '라이' | '기타'; }
    ): Promise<RecommendationResult[]> {
        let filteredWhiskeys = dbService.getAllWhiskeys();
        const currentUser = userId ? dbService.getUserById(userId) : undefined;

        if (options?.type) { filteredWhiskeys = filteredWhiskeys.filter(w => w.type === options.type); }
        if (options?.flavorKeywords && options.flavorKeywords.length > 0) {
            filteredWhiskeys = filteredWhiskeys.filter(w => options.flavorKeywords!.some((keyword: string) => w.flavorProfile.includes(keyword)));
        }
        // min/maxPreferredPrice 필터링 적용
        if (options?.minPreferredPrice !== undefined && options.minPreferredPrice >= 0) {
            filteredWhiskeys = filteredWhiskeys.filter(w => w.price >= options.minPreferredPrice!);
        }
        if (options?.maxPreferredPrice !== undefined && options.maxPreferredPrice >= 0) {
            filteredWhiskeys = filteredWhiskeys.filter(w => w.price <= options.maxPreferredPrice!);
        }


        const lowerCaseQuery = userQuery.toLowerCase();
        if (lowerCaseQuery.includes('피트') || lowerCaseQuery.includes('스모키')) { filteredWhiskeys = filteredWhiskeys.filter(w => w.flavorProfile.includes('피트') || w.flavorProfile.includes('스모키')); }
        if (lowerCaseQuery.includes('달콤') || lowerCaseQuery.includes('바닐라') || lowerCaseQuery.includes('꿀') || lowerCaseQuery.includes('과일')) { filteredWhiskeys = filteredWhiskeys.filter(w => w.flavorProfile.some(f => ['바닐라', '꿀', '과일', '쉐리'].includes(f))); }
        if (lowerCaseQuery.includes('싱글몰트')) { filteredWhiskeys = filteredWhiskeys.filter(w => w.type === '싱글 몰트'); }
        if (lowerCaseQuery.includes('블렌디드')) { filteredWhiskeys = filteredWhiskeys.filter(w => w.type === '블렌디드'); }
        if (lowerCaseQuery.includes('버번')) { filteredWhiskeys = filteredWhiskeys.filter(w => w.type === '버번'); }
        // 쿼리에서 가격 필터링 (예: 10만원 이하, 5만원 이상)
        const minPriceQueryMatch = lowerCaseQuery.match(/(\d+)만원 이상/);
        const maxPriceQueryMatch = lowerCaseQuery.match(/(\d+)만원 이하/);
        if (minPriceQueryMatch) {
            const queryMinPrice = parseInt(minPriceQueryMatch[1]) * 10000;
            filteredWhiskeys = filteredWhiskeys.filter(w => w.price >= queryMinPrice);
        }
        if (maxPriceQueryMatch) {
            const queryMaxPrice = parseInt(maxPriceQueryMatch[1]) * 10000;
            filteredWhiskeys = filteredWhiskeys.filter(w => w.price <= queryMaxPrice);
        }

        if (lowerCaseQuery.includes('고가') || lowerCaseQuery.includes('비싼')) { filteredWhiskeys = filteredWhiskeys.filter(w => w.price >= 150000); } // 고가 기준 변경
        if (lowerCaseQuery.includes('입문')) { filteredWhiskeys = filteredWhiskeys.filter(w => w.flavorProfile.includes('부드러움') || w.flavorProfile.includes('크리미')); }

        if (currentUser) {
            const userPref = currentUser.preferences;
            // 사용자 선호 최소/최대 가격 필터링
            if (userPref.minPreferredPrice !== undefined && userPref.minPreferredPrice >= 0) {
                filteredWhiskeys = filteredWhiskeys.filter(w => w.price >= userPref.minPreferredPrice!);
            }
            if (userPref.maxPreferredPrice !== undefined && userPref.maxPreferredPrice >= 0) {
                filteredWhiskeys = filteredWhiskeys.filter(w => w.price <= userPref.maxPreferredPrice!);
            }

            const likedWhiskeyProfiles = currentUser.interactionHistory.likedWhiskeys.map(id => dbService.getWhiskeyById(id)?.flavorProfile || []).flat();
            if (likedWhiskeyProfiles.length > 0) { filteredWhiskeys.sort((a, b) => { const aMatch = a.flavorProfile.filter(f => likedWhiskeyProfiles.includes(f)).length; const bMatch = b.flavorProfile.filter(f => likedWhiskeyProfiles.includes(f)).length; return bMatch - aMatch; }); }
            filteredWhiskeys = filteredWhiskeys.filter(w => !currentUser.interactionHistory.dislikedWhiskeys.includes(w.id));
        }

        filteredWhiskeys.sort((a, b) => a.name.localeCompare(b.name)); // 이름으로 기본 정렬

        const finalRecommendations = filteredWhiskeys.slice(0, 3);

        if (finalRecommendations.length === 0) { throw new Error("추천 시스템 오류가 발생했습니다. 다른 질문을 해주시거나 나중에 다시 시도해주세요."); }

        const results: RecommendationResult[] = finalRecommendations.map(whiskey => ({ whiskey: whiskey, reason: this.generateRecommendationReason(whiskey, userQuery, currentUser) }));
        return results;
    }

    async getEvaluatedWhiskeys(userId: string): Promise<{ whiskey: Whiskey; tastingNote: TastingNote }[]> {
        const user = dbService.getUserById(userId);
        if (!user) { throw new Error("사용자 정보를 찾을 수 없습니다."); }
        const evaluatedNotes = dbService.getTastingNotesByUserId(userId);
        if (evaluatedNotes.length === 0) { throw new Error("평가한 위스키가 없습니다."); }
        const result = evaluatedNotes.map(note => { const whiskey = dbService.getWhiskeyById(note.whiskeyId); return whiskey ? { whiskey, tastingNote: note } : null; }).filter(Boolean) as { whiskey: Whiskey; tastingNote: TastingNote }[];
        return result;
    }

    async getRecentlyViewedWhiskeys(userId: string): Promise<{ whiskey: Whiskey; viewedAt: number }[]> {
        const user = dbService.getUserById(userId);
        if (!user) { throw new Error("사용자 정보를 찾을 수 없습니다."); }
        let viewedHistory = user.interactionHistory.viewedWhiskeys;
        if (viewedHistory.length === 0) { throw new Error("최근 조회한 위스키가 없습니다."); }
        viewedHistory.sort((a, b) => b.viewedAt - a.viewedAt);
        const result = viewedHistory.map(entry => { const whiskey = dbService.getWhiskeyById(entry.whiskeyId); return whiskey ? { whiskey, viewedAt: entry.viewedAt } : null; }).filter(Boolean) as { whiskey: Whiskey; viewedAt: number }[];
        return result;
    }

    async getAllWhiskies(): Promise<Whiskey[]> {
        const whiskies = dbService.getAllWhiskeys();
        if (whiskies.length === 0) { throw new Error("위스키 데이터를 불러올 수 없습니다."); }
        return whiskies;
    }

    async filterWhiskies(whiskies: Whiskey[], filters: WhiskeyFilterOptions): Promise<Whiskey[]> {
        let filtered = [...whiskies];
        if (filters.type) { filtered = filtered.filter(w => w.type === filters.type); }
        // if (filters.priceRange) { filtered = filtered.filter(w => w.priceRange === filters.priceRange); } // 가격대 카테고리 필터 제거
        if (filters.country) { filtered = filtered.filter(w => w.country === filters.country); }
        if (filters.flavorKeywords && filters.flavorKeywords.length > 0) { filtered = filtered.filter(w => filters.flavorKeywords!.some((keyword: string) => w.flavorProfile.includes(keyword))); }
        // 숫자 범위 가격 필터링
        if (filters.minPrice !== undefined && filters.minPrice >= 0) {
            filtered = filtered.filter(w => w.price >= filters.minPrice!);
        }
        if (filters.maxPrice !== undefined && filters.maxPrice >= 0) {
            filtered = filtered.filter(w => w.price <= filters.maxPrice!);
        }
        if (filtered.length === 0) { throw new Error("필터링 조건에 맞는 위스키를 찾을 수 없습니다."); }
        return filtered;
    }

    async sortWhiskies(whiskies: Whiskey[], sortBy: WhiskeySortBy, order: SortOrder = 'asc'): Promise<Whiskey[]> {
        const sorted = [...whiskies];
        sorted.sort((a, b) => {
            let valA: any, valB: any;
            switch (sortBy) {
                case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'price':
                    valA = a.price; // 직접 숫자 가격 사용
                    valB = b.price; // 직접 숫자 가격 사용
                    break;
                case 'age': valA = a.age || 0; valB = b.age || 0; break;
                default: return 0;
            }
            return order === 'asc' ? valA - valB : valB - valA;
        });
        if (sorted.length === 0) { throw new Error("정렬 조건에 맞는 위스키를 찾을 수 없습니다."); }
        return sorted;
    }

    async submitTastingNote(
        userId: string, whiskeyId: string, rating: number, reviewText: string,
        bodyRating: number, richnessRating: number, smokinessRating: number, sweetnessRating: number
    ): Promise<TastingNote> {
        const user = dbService.getUserById(userId);
        const whiskey = dbService.getWhiskeyById(whiskeyId);
        if (!user || !whiskey) { throw new Error("사용자 또는 위스키 정보를 찾을 수 없습니다."); }
        if (rating < 1 || rating > 5 || bodyRating < 0 || bodyRating > 5 || richnessRating < 0 || richnessRating > 5 || smokinessRating < 0 || smokinessRating > 5 || sweetnessRating < 0 || sweetnessRating > 5) { throw new Error("유효하지 않은 평가 점수입니다. 점수는 0-5 (총점은 1-5) 범위여야 합니다."); }
        const newNote: TastingNote = { id: `tn${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId, whiskeyId, rating, reviewText, bodyRating, richnessRating, smokinessRating, sweetnessRating, createdAt: Date.now() };
        try { dbService.addTastingNote(newNote); return newNote; } catch (error) { throw new Error("평가 노트를 작성할 수 없습니다. 오류가 발생하였습니다."); }
    }

    async getSimilarWhiskies(whiskeyId: string, userId?: string): Promise<Whiskey[]> {
        const targetWhiskey = dbService.getWhiskeyById(whiskeyId);
        if (!targetWhiskey) { throw new Error("기준 위스키를 찾을 수 없습니다."); }
        const allWhiskies = dbService.getAllWhiskeys();
        const similarWhiskies: Whiskey[] = [];

        allWhiskies.forEach((whiskey: Whiskey) => {
            if (whiskey.id === whiskeyId) return;
            let similarityScore = 0;
            const commonFlavors = whiskey.flavorProfile.filter((f: string) => targetWhiskey.flavorProfile.includes(f));
            similarityScore += commonFlavors.length * 10;
            if (whiskey.type === targetWhiskey.type) { similarityScore += 20; }
            // 가격 유사성 (숫자 값으로 직접 비교)
            if (Math.abs(whiskey.price - targetWhiskey.price) < 50000) { // 예시 임계값 (5만원 이내 차이)
                similarityScore += 15;
            }
            if (similarityScore > 30) { similarWhiskies.push(whiskey); }
        });
        // 유사 위스키를 가격 오름차순으로 정렬
        similarWhiskies.sort((a, b) => a.price - b.price);
        if (similarWhiskies.length === 0) { throw new Error("유사한 위스키를 찾을 수 없습니다."); }
        return similarWhiskies.slice(0, 3);
    }

    async getWhiskeyDetails(whiskeyId: string, userId?: string): Promise<Whiskey | null> {
        const whiskey = dbService.getWhiskeyById(whiskeyId);
        if (userId && whiskey) {
            const user = dbService.getUserById(userId);
            if (user) {
                const updatedViewedHistory = user.interactionHistory.viewedWhiskeys.filter(entry => entry.whiskeyId !== whiskeyId);
                updatedViewedHistory.push({ whiskeyId, viewedAt: Date.now() });
                dbService.updateUser(userId, { interactionHistory: { ...user.interactionHistory, viewedWhiskeys: updatedViewedHistory } });
            }
        }
        if (!whiskey) { throw new Error("정보 없음: 해당 위스키를 찾을 수 없습니다."); }
        return whiskey;
    }

    private generateRecommendationReason(whiskey: Whiskey, userQuery: string, currentUser?: User): string {
        let reason = `${whiskey.name}은(는) ${whiskey.description.split('.')[0]} 특징이 있습니다.`;
        const lowerCaseQuery = userQuery.toLowerCase();
        if ((lowerCaseQuery.includes('달콤') || lowerCaseQuery.includes('과일')) && whiskey.flavorProfile.some(f => ['꿀', '바닐라', '과일', '쉐리'].includes(f))) { reason += ` 고객님께서 달콤하고 과일향을 선호하셔서 ${whiskey.flavorProfile.filter(f => ['꿀', '바닐라', '과일', '쉐리'].includes(f)).join(', ')}과 같은 향이 두드러지는 이 위스키를 추천합니다.`; }
        if ((lowerCaseQuery.includes('피트') || lowerCaseQuery.includes('스모키')) && whiskey.flavorProfile.some(f => ['피트', '스모키'].includes(f))) { reason += ` 강렬한 ${whiskey.flavorProfile.filter(f => ['피트', '스모키'].includes(f)).join(', ')} 향을 좋아하신다면 이 위스키는 탁월한 선택이 될 것입니다.`; }
        if (lowerCaseQuery.includes('입문') && (whiskey.flavorProfile.includes('부드러움') || whiskey.flavorProfile.includes('크리미'))) { reason += ` 위스키 입문자분들도 부담 없이 즐길 수 있는 부드러운 맛이 특징입니다.`; }
        if (lowerCaseQuery.includes('고가') && whiskey.price >= 150000) { reason += ` 고급 위스키를 찾으시는 고객님께 이 위스키는 훌륭한 선택이 될 것입니다.`; } // 고가 기준을 숫자로 변경
        if (currentUser) {
            if (currentUser.preferences.experienceLevel === '초보' && (whiskey.flavorProfile.includes('부드러움') || whiskey.flavorProfile.includes('크리미'))) { reason += ` 초보자분들도 쉽게 접근할 수 있는 부드러운 위스키입니다.`; }
            if (currentUser.preferences.flavorKeywords && currentUser.preferences.flavorKeywords.some((f: string) => whiskey.flavorProfile.includes(f))) { reason += ` 고객님의 선호 맛/향인 ${currentUser.preferences.flavorKeywords.filter((f: string) => whiskey.flavorProfile.includes(f)).join(', ')}과 잘 맞습니다.`; }
            // 사용자 선호 최소/최대 가격 기반 이유 추가
            if (currentUser.preferences.minPreferredPrice !== undefined || currentUser.preferences.maxPreferredPrice !== undefined) {
                let priceReason = ' 고객님의 선호 가격대 ';
                if (currentUser.preferences.minPreferredPrice !== undefined) priceReason += `${currentUser.preferences.minPreferredPrice.toLocaleString()}원 이상`;
                if (currentUser.preferences.minPreferredPrice !== undefined && currentUser.preferences.maxPreferredPrice !== undefined) priceReason += ' ~ ';
                if (currentUser.preferences.maxPreferredPrice !== undefined) priceReason += `${currentUser.preferences.maxPreferredPrice.toLocaleString()}원 이하`;
                reason += priceReason + '에서 선택되었습니다.';
            }
        }
        return reason;
    }
}
const oktongService = new OktongRecommendationService();

// --- UI 컴포넌트 ---
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-gray-700">로딩 중...</p>
    </div>
);

const WhiskeyCard: React.FC<{ whiskey: Whiskey; onClick?: (whiskeyId: string) => void; showReason?: boolean; reason?: string }> = ({ whiskey, onClick, showReason = false, reason }) => (
    <div
        className="bg-white rounded-lg shadow-md p-4 m-2 flex flex-col items-center border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={() => onClick && onClick(whiskey.id)}
    >
        <img
            src={whiskey.imageUrl || `https://placehold.co/100x150/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`}
            alt={whiskey.name}
            className="w-24 h-36 object-cover rounded-md mb-3"
            onError={(e) => { e.currentTarget.src = `https://placehold.co/150x250/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`; }}
        />
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-1">{whiskey.name}</h3>
        <p className="text-sm text-gray-600 text-center mb-2">{whiskey.type} | {whiskey.price.toLocaleString()}원</p> {/* 가격 표시를 숫자로 변경 */}
        {showReason && reason && (
            <div className="text-sm text-gray-700 text-center mt-2">
                <p className="font-medium">추천 이유:</p>
                <p className="text-sm text-gray-600">{reason}</p>
            </div>
        )}
        <div className="mt-3 flex flex-wrap justify-center">
            {whiskey.flavorProfile.map((flavor, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium mr-1 mb-1 px-2.5 py-0.5 rounded-full">
                    {flavor}
                </span>
            ))}
        </div>
    </div>
);

const WhiskeyDetailModal: React.FC<{ whiskey: Whiskey | null; onClose: () => void; userId: string; onTastingNoteSubmit: (note: TastingNote) => void }> = ({ whiskey, onClose, userId, onTastingNoteSubmit }) => {
    const [showTastingNoteForm, setShowTastingNoteForm] = useState(false);
    const [rating, setRating] = useState(3);
    const [reviewText, setReviewText] = useState('');
    const [bodyRating, setBodyRating] = useState(3);
    const [richnessRating, setRichnessRating] = useState(3);
    const [smokinessRating, setSmokinessRating] = useState(3);
    const [sweetnessRating, setSweetnessRating] = useState(3);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [similarWhiskies, setSimilarWhiskies] = useState<Whiskey[]>([]);
    const [similarLoading, setSimilarLoading] = useState(false);
    const [similarError, setSimilarError] = useState<string | null>(null);

    useEffect(() => {
        if (!whiskey) {
            setShowTastingNoteForm(false);
            setSimilarWhiskies([]);
            setSimilarError(null);
        }
    }, [whiskey]);

    const handleTastingNoteSubmit = async () => {
        if (!whiskey) return;
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            const newNote = await oktongService.submitTastingNote(userId, whiskey.id, rating, reviewText, bodyRating, richnessRating, smokinessRating, sweetnessRating);
            onTastingNoteSubmit(newNote);
            setShowTastingNoteForm(false);
            alert('평가 노트가 성공적으로 저장되었습니다!');
        } catch (err: any) {
            setSubmitError(err.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const fetchSimilarWhiskies = useCallback(async () => {
        if (!whiskey) return;
        setSimilarLoading(true);
        setSimilarError(null);
        setSimilarWhiskies([]);
        try {
            const similar = await oktongService.getSimilarWhiskies(whiskey.id, userId);
            setSimilarWhiskies(similar);
        } catch (err: any) {
            setSimilarError(err.message);
        } finally {
            setSimilarLoading(false);
        }
    }, [whiskey, userId]);

    if (!whiskey) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold">
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-indigo-700 mb-4">{whiskey.name} 상세 정보</h2>
                <div className="flex flex-col md:flex-row items-center md:items-start mb-4">
                    <img
                        src={whiskey.imageUrl || `https://placehold.co/150x250/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`}
                        alt={whiskey.name}
                        className="w-32 h-48 object-cover rounded-md mr-4 mb-4 md:mb-0"
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/150x250/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`; }}
                    />
                    <div className="flex-1">
                        <p className="text-gray-700 mb-2"><strong>증류소:</strong> {whiskey.distillery || '정보 없음'}</p>
                        <p className="text-gray-700 mb-2"><strong>국가:</strong> {whiskey.country || '정보 없음'}</p>
                        <p className="text-gray-700 mb-2"><strong>종류:</strong> {whiskey.type || '정보 없음'}</p>
                        <p className="text-gray-700 mb-2"><strong>숙성 연수:</strong> {whiskey.age ? `${whiskey.age}년` : '정보 없음'}</p>
                        <p className="text-gray-700 mb-2"><strong>가격:</strong> {whiskey.price.toLocaleString()}원</p> {/* 가격 표시를 숫자로 변경 */}
                        <p className="text-gray-700 mb-2"><strong>맛/향 프로필:</strong> {whiskey.flavorProfile.length > 0 ? whiskey.flavorProfile.join(', ') : '정보 없음'}</p>
                        <p className="text-gray-700 mb-2"><strong>설명:</strong> {whiskey.description || '정보 없음'}</p>
                    </div>
                </div>

                <div className="flex justify-around mt-4">
                    <button
                        onClick={() => setShowTastingNoteForm(!showTastingNoteForm)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-md"
                    >
                        평가 노트 작성 {showTastingNoteForm ? '닫기' : '열기'}
                    </button>
                    <button
                        onClick={fetchSimilarWhiskies}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow-md"
                    >
                        유사한 위스키 보기
                    </button>
                </div>

                {showTastingNoteForm && (
                    <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">평가 노트 작성</h3>
                        <div className="mb-3">
                            <label className="block text-gray-700 text-sm font-bold mb-1">총점 (1-5):</label>
                            <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(parseInt(e.target.value))}
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="mb-3">
                            <label className="block text-gray-700 text-sm font-bold mb-1">바디감 (0-5):</label>
                            <input type="number" min="0" max="5" value={bodyRating} onChange={(e) => setBodyRating(parseInt(e.target.value))}
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="mb-3">
                            <label className="block text-gray-700 text-sm font-bold mb-1">풍미 (0-5):</label>
                            <input type="number" min="0" max="5" value={richnessRating} onChange={(e) => setRichnessRating(parseInt(e.target.value))}
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="mb-3">
                            <label className="block text-gray-700 text-sm font-bold mb-1">스모키함 (0-5):</label>
                            <input type="number" min="0" max="5" value={smokinessRating} onChange={(e) => setSmokinessRating(parseInt(e.target.value))}
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="mb-3">
                            <label className="block text-gray-700 text-sm font-bold mb-1">단맛 (0-5):</label>
                            <input type="number" min="0" max="5" value={sweetnessRating} onChange={(e) => setSweetnessRating(parseInt(e.target.value))}
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-1">코멘트:</label>
                            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                                className="w-full p-2 border rounded-md resize-y min-h-[60px]" rows={3}></textarea>
                        </div>
                        {submitError && <p className="text-red-500 text-sm mb-3">{submitError}</p>}
                        <button
                            onClick={handleTastingNoteSubmit}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
                            disabled={submitLoading}
                        >
                            {submitLoading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                )}

                {similarLoading && <LoadingSpinner />}
                {similarError && <p className="text-red-500 text-sm mt-4">{similarError}</p>}
                {similarWhiskies.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">유사한 위스키</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {similarWhiskies.map(simWhiskey => (
                                <WhiskeyCard key={simWhiskey.id} whiskey={simWhiskey} onClick={onClose} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [userQuery, setUserQuery] = useState<string>('');
    const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('user001');

    const [activeTab, setActiveTab] = useState<'recommend' | 'preferences' | 'evaluated' | 'recent' | 'all' | 'detail'>('recommend');

    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
    const [evaluatedWhiskies, setEvaluatedWhiskies] = useState<{ whiskey: Whiskey; tastingNote: TastingNote }[]>([]);
    const [recentViews, setRecentViews] = useState<{ whiskey: Whiskey; viewedAt: number }[]>([]);
    const [allWhiskies, setAllWhiskies] = useState<Whiskey[]>([]);
    const [filteredWhiskies, setFilteredWhiskies] = useState<Whiskey[]>([]);
    // 전체 위스키 목록 필터링을 위한 상태
    const [allWhiskeyFilterOptions, setAllWhiskeyFilterOptions] = useState<WhiskeyFilterOptions>({
        minPrice: 0, // 초기 최소 가격
        maxPrice: 500000 // 초기 최대 가격
    });
    const [sortBy, setSortBy] = useState<WhiskeySortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [detailWhiskey, setDetailWhiskey] = useState<Whiskey | null>(null);

    const [bodyPref, setBodyPref] = useState(3);
    const [richnessPref, setRichnessPref] = useState(3);
    const [smokinessPref, setSmokinessPref] = useState(3);
    const [sweetnessPref, setSweetnessPref] = useState(3);
    const [minPricePref, setMinPricePref] = useState<number>(0);
    const [maxPricePref, setMaxPricePref] = useState<number>(500000); // 데모용 최대값 설정
    const [flavorKeywordsInput, setFlavorKeywordsInput] = useState<string>('');

    const [prefSaveLoading, setPrefSaveLoading] = useState(false);
    const [prefSaveError, setPrefSaveError] = useState<string | null>(null);

    // 사이드바 상태
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);

    useEffect(() => {
        const user = dbService.getUserById(currentUserId);
        if (user) {
            setUserPreferences(user.preferences);
            setBodyPref(user.preferences.bodyPreference);
            setRichnessPref(user.preferences.richnessPreference);
            setSmokinessPref(user.preferences.smokinessPreference);
            setSweetnessPref(user.preferences.sweetnessPreference);
            setMinPricePref(user.preferences.minPreferredPrice || 0);
            setMaxPricePref(user.preferences.maxPreferredPrice || 500000);
            setFlavorKeywordsInput(user.preferences.flavorKeywords.join(', '));
        }
    }, [currentUserId]);

    const fetchDataForTab = useCallback(async (tab: string) => {
        setLoading(true);
        setError(null);
        try {
            if (tab === 'evaluated') {
                const data = await oktongService.getEvaluatedWhiskeys(currentUserId);
                setEvaluatedWhiskies(data);
            } else if (tab === 'recent') {
                const data = await oktongService.getRecentlyViewedWhiskeys(currentUserId);
                setRecentViews(data);
            } else if (tab === 'all') {
                const data = await oktongService.getAllWhiskies();
                setAllWhiskies(data);
                // 초기 필터 적용 (사이드바 상태와 동기화)
                const initialFiltered = await oktongService.filterWhiskies(data, allWhiskeyFilterOptions);
                setFilteredWhiskies(initialFiltered);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, allWhiskeyFilterOptions]); // allWhiskeyFilterOptions를 의존성 배열에 추가

    useEffect(() => {
        fetchDataForTab(activeTab);
    }, [activeTab, fetchDataForTab]);

    const handleRecommend = async () => {
        if (!userQuery.trim()) {
            setError('추천받고 싶은 내용을 입력해주세요.');
            return;
        }
        setLoading(true);
        setError(null);
        setRecommendations([]);

        try {
            // LLM 시뮬레이션: 사용자 쿼리에서 가격 및 맛/향 정보 추출
            let options: { flavorKeywords?: string[]; minPreferredPrice?: number; maxPreferredPrice?: number; type?: Whiskey['type']; } = {};
            const minPriceMatch = userQuery.match(/(\d+)만원 이상/);
            const maxPriceMatch = userQuery.match(/(\d+)만원 이하/);
            if (minPriceMatch) { options.minPreferredPrice = parseInt(minPriceMatch[1]) * 10000; }
            if (maxPriceMatch) { options.maxPreferredPrice = parseInt(maxPriceMatch[1]) * 10000; }

            const flavorMatch = userQuery.match(/(피트|스모키|달콤|바닐라|꿀|과일|쉐리)(?:향)?/g);
            if (flavorMatch) { options.flavorKeywords = Array.from(new Set(flavorMatch.map(f => f.replace('향', '')))); }
            const typeMatch = userQuery.match(/(싱글몰트|블렌디드|버번|라이)/);
            if (typeMatch) { options.type = typeMatch[0] as Whiskey['type']; }

            const results = await oktongService.recommendWhiskeys(userQuery, currentUserId, options);
            setRecommendations(results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        setPrefSaveLoading(true);
        setPrefSaveError(null);
        try {
            const preferences: UserPreferences = {
                bodyPreference: bodyPref,
                richnessPreference: richnessPref,
                smokinessPreference: smokinessPref,
                sweetnessPreference: sweetnessPref,
                minPreferredPrice: minPricePref,
                maxPreferredPrice: maxPricePref,
                experienceLevel: userPreferences?.experienceLevel,
                flavorKeywords: flavorKeywordsInput.split(',').map(s => s.trim()).filter(s => s !== '')
            };
            if (preferences.minPreferredPrice! > preferences.maxPreferredPrice!) {
                throw new Error("최소 가격은 최대 가격보다 클 수 없습니다.");
            }

            const updatedUser = await oktongService.saveUserPreferences(currentUserId, preferences);
            if (updatedUser) {
                setUserPreferences(updatedUser.preferences);
                alert('취향 정보가 성공적으로 저장되었습니다!');
            } else {
                throw new Error("취향 정보 저장 실패: 사용자 업데이트 오류");
            }
        } catch (err: any) {
            setPrefSaveError(err.message);
        } finally {
            setPrefSaveLoading(false);
        }
    };

    // 사이드바에서 필터/정렬 적용 버튼 클릭 시
    const handleApplyFilterAndSort = async () => {
        setLoading(true);
        setError(null);
        try {
            // 필터 적용
            let currentFiltered = await oktongService.filterWhiskies(allWhiskies, allWhiskeyFilterOptions);
            // 정렬 적용
            const finalSorted = await oktongService.sortWhiskies(currentFiltered, sortBy, sortOrder);
            setFilteredWhiskies(finalSorted);
            setShowFilterSidebar(false); // 적용 후 사이드바 닫기
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (whiskeyId: string) => {
        setLoading(true);
        setError(null);
        try {
            const details = await oktongService.getWhiskeyDetails(whiskeyId, currentUserId);
            setDetailWhiskey(details);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTastingNoteSubmitted = (newNote: TastingNote) => {
        fetchDataForTab('evaluated');
        setDetailWhiskey(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-4 font-sans text-gray-800 flex">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>

            {/* 사이드바 */}
            <div className={`fixed top-0 left-0 h-full bg-gray-50 shadow-lg p-6 transform transition-transform duration-300 ease-in-out z-40
                        ${showFilterSidebar ? 'translate-x-0' : '-translate-x-full'} w-80 overflow-y-auto`}>
                <button onClick={() => setShowFilterSidebar(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold">
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-indigo-600 mb-6">필터 및 정렬</h2>

                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3 text-gray-700">필터링</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">종류:</label>
                            <select value={allWhiskeyFilterOptions.type || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, type: e.target.value as Whiskey['type'] })}
                                className="w-full p-2 border rounded-md">
                                <option value="">모두</option>
                                <option value="싱글 몰트">싱글 몰트</option>
                                <option value="블렌디드">블렌디드</option>
                                <option value="버번">버번</option>
                                <option value="라이">라이</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>
                        {/* 가격대 카테고리 필터 제거 */}
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">최소 가격 (원):</label>
                            <input type="number" min="0" value={allWhiskeyFilterOptions.minPrice || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, minPrice: parseInt(e.target.value) || undefined })}
                                className="w-full p-2 border rounded-md" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">최대 가격 (원):</label>
                            <input type="number" min="0" value={allWhiskeyFilterOptions.maxPrice || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, maxPrice: parseInt(e.target.value) || undefined })}
                                className="w-full p-2 border rounded-md" placeholder="500000" />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">생산 국가:</label>
                            <input type="text" value={allWhiskeyFilterOptions.country || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, country: e.target.value })}
                                className="w-full p-2 border rounded-md" placeholder="예: 스코틀랜드" />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">맛/향 키워드:</label>
                            <input type="text" value={allWhiskeyFilterOptions.flavorKeywords?.join(', ') || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, flavorKeywords: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                                className="w-full p-2 border rounded-md" placeholder="예: 피트, 바닐라" />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3 text-gray-700">정렬</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">정렬 기준:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as WhiskeySortBy)}
                                className="w-full p-2 border rounded-md">
                                <option value="name">이름</option>
                                <option value="price">가격</option>
                                <option value="age">숙성 연수</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-1">정렬 순서:</label>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                className="w-full p-2 border rounded-md">
                                <option value="asc">오름차순</option>
                                <option value="desc">내림차순</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button onClick={handleApplyFilterAndSort} className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                    필터 및 정렬 적용
                </button>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className={`flex-1 transition-all duration-300 ease-in-out ${showFilterSidebar ? 'ml-80' : 'ml-0'}`}>
                <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8">
                    <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
                        🥃 Oktong 위스키 추천 데모 시스템 🥃
                    </h1>

                    <div className="flex justify-center border-b border-gray-200 mb-6">
                        <button
                            className={`py-2 px-4 text-lg font-medium ${activeTab === 'recommend' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                            onClick={() => setActiveTab('recommend')}
                        >
                            위스키 추천받기
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${activeTab === 'preferences' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            위스키 취향 입력
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${activeTab === 'evaluated' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                            onClick={() => setActiveTab('evaluated')}
                        >
                            내가 평가한 위스키
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${activeTab === 'recent' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                            onClick={() => setActiveTab('recent')}
                        >
                            최근 본 위스키
                        </button>
                        <button
                            className={`py-2 px-4 text-lg font-medium ${activeTab === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                            onClick={() => setActiveTab('all')}
                        >
                            전체 위스키 목록
                        </button>
                    </div>

                    {loading && <LoadingSpinner />}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                            <strong className="font-bold">오류!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    {activeTab === 'recommend' && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-indigo-600 mb-4">AI 위스키 추천받기</h2>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[80px]"
                                placeholder="어떤 위스키를 찾으시나요? (예: '부드럽고 달콤한 위스키 추천해줘', '피트향 강한 싱글몰트 10만원 이하로 찾아줘')"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                rows={3}
                            ></textarea>
                            <button
                                onClick={handleRecommend}
                                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg mt-3 hover:bg-indigo-700 transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? '추천 중...' : '위스키 추천받기'}
                            </button>

                            {recommendations.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-indigo-600 mb-5 text-center">✨ 추천 위스키 ✨</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {recommendations.map((rec, index) => (
                                            <WhiskeyCard key={index} whiskey={rec.whiskey} showReason reason={rec.reason} onClick={handleViewDetails} />
                                        ))}
                                    </div>
                                    <p className="text-center text-gray-500 text-sm mt-6">
                                        추천 결과에 대한 피드백을 주시면 더 정확한 추천을 제공해 드릴 수 있습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-indigo-600 mb-4">위스키 취향 입력</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">바디감 (0-5):</label>
                                    <input type="range" min="0" max="5" value={bodyPref} onChange={(e) => setBodyPref(parseInt(e.target.value))} className="w-full" />
                                    <span className="text-gray-600">{bodyPref}</span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">풍미 (0-5):</label>
                                    <input type="range" min="0" max="5" value={richnessPref} onChange={(e) => setRichnessPref(parseInt(e.target.value))} className="w-full" />
                                    <span className="text-gray-600">{richnessPref}</span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">스모키함 (0-5):</label>
                                    <input type="range" min="0" max="5" value={smokinessPref} onChange={(e) => setSmokinessPref(parseInt(e.target.value))} className="w-full" />
                                    <span className="text-gray-600">{smokinessPref}</span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">단맛 (0-5):</label>
                                    <input type="range" min="0" max="5" value={sweetnessPref} onChange={(e) => setSweetnessPref(parseInt(e.target.value))} className="w-full" />
                                    <span className="text-gray-600">{sweetnessPref}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">선호 최소 가격 (원):</label>
                                    <input type="range" min="0" max="500000" step="10000" value={minPricePref} onChange={(e) => setMinPricePref(parseInt(e.target.value))} className="w-full" />
                                    <span className="text-gray-600">{minPricePref.toLocaleString()}원</span>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">선호 최대 가격 (원):</label>
                                    <input type="range" min="0" max="500000" step="10000" value={maxPricePref} onChange={(e) => setMaxPricePref(parseInt(e.target.value))} className="w-full" />
                                    <span className="text-gray-600">{maxPricePref.toLocaleString()}원</span>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">선호 맛/향 키워드 (쉼표로 구분):</label>
                                    <textarea
                                        value={flavorKeywordsInput}
                                        onChange={(e) => setFlavorKeywordsInput(e.target.value)}
                                        className="w-full p-2 border rounded-md resize-y min-h-[60px]"
                                        placeholder="예: 피트, 스모키, 바닐라, 꿀"
                                    ></textarea>
                                </div>
                            </div>
                            {prefSaveError && <p className="text-red-500 text-sm mt-3">{prefSaveError}</p>}
                            <button
                                onClick={handleSavePreferences}
                                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg mt-6 hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                                disabled={prefSaveLoading}
                            >
                                {prefSaveLoading ? '저장 중...' : '취향 저장'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'evaluated' && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-indigo-600 mb-4">내가 평가한 위스키</h2>
                            {evaluatedWhiskies.length === 0 ? (
                                <p className="text-gray-600">아직 평가한 위스키가 없습니다.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {evaluatedWhiskies.map((item, index) => (
                                        <div key={index} className="bg-white rounded-lg shadow-md p-4 m-2 border border-gray-200">
                                            <WhiskeyCard whiskey={item.whiskey} onClick={handleViewDetails} />
                                            <div className="mt-3 text-sm text-gray-700">
                                                <p><strong>총점:</strong> {item.tastingNote.rating}/5</p>
                                                <p><strong>바디감:</strong> {item.tastingNote.bodyRating}/5</p>
                                                <p><strong>풍미:</strong> {item.tastingNote.richnessRating}/5</p>
                                                <p><strong>스모키함:</strong> {item.tastingNote.smokinessRating}/5</p>
                                                <p><strong>단맛:</strong> {item.tastingNote.sweetnessRating}/5</p>
                                                <p><strong>코멘트:</strong> {item.tastingNote.reviewText}</p>
                                                <p className="text-xs text-gray-500 mt-1">작성일: {new Date(item.tastingNote.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'recent' && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-indigo-600 mb-4">최근 본 위스키</h2>
                            {recentViews.length === 0 ? (
                                <p className="text-gray-600">최근 조회한 위스키가 없습니다.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recentViews.map((item, index) => (
                                        <div key={index} className="bg-white rounded-lg shadow-md p-4 m-2 border border-gray-200">
                                            <WhiskeyCard whiskey={item.whiskey} onClick={handleViewDetails} />
                                            <p className="text-xs text-gray-500 mt-2">조회 시간: {new Date(item.viewedAt).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'all' && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-indigo-600 mb-4 flex items-center">
                                전체 위스키 목록
                                <button
                                    onClick={() => setShowFilterSidebar(true)}
                                    className="ml-4 bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-base hover:bg-gray-300 transition-colors shadow-sm"
                                >
                                    필터/정렬 열기
                                </button>
                            </h2>

                            {filteredWhiskies.length === 0 ? (
                                <p className="text-gray-600">위스키 목록이 비어 있거나 필터링/정렬 조건에 맞는 위스키가 없습니다.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredWhiskies.map((whiskey) => (
                                        <WhiskeyCard key={whiskey.id} whiskey={whiskey} onClick={handleViewDetails} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <WhiskeyDetailModal
                        whiskey={detailWhiskey}
                        onClose={() => setDetailWhiskey(null)}
                        userId={currentUserId}
                        onTastingNoteSubmit={handleTastingNoteSubmitted}
                    />

                    <div className="mt-8 text-center text-sm text-gray-500">
                        현재 사용자 ID: <span className="font-mono">{currentUserId}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
