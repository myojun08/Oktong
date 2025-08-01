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

// 사용자 데이터 모델 정의 (username 및 password 추가)
export interface User {
    id: string;
    username: string; // 사용자 이름 (로그인용)
    password: string; // 비밀번호 (데모용: 평문 저장, 실제는 해싱 필수!)
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
            // username 및 password 추가
            { id: 'user001', username: 'user001', password: 'password123', preferences: { bodyPreference: 3, richnessPreference: 4, smokinessPreference: 5, sweetnessPreference: 1, minPreferredPrice: 50000, maxPreferredPrice: 200000, experienceLevel: '중급', flavorKeywords: ['피트', '스모키'] }, interactionHistory: { viewedWhiskeys: [{ whiskeyId: 'w001', viewedAt: Date.now() - 3600000 }], likedWhiskeys: ['w001'], dislikedWhiskeys: [], searches: [] }, evaluatedWhiskeyIds: [] },
            { id: 'user002', username: 'user002', password: 'password123', preferences: { bodyPreference: 4, richnessPreference: 3, smokinessPreference: 1, sweetnessPreference: 5, minPreferredPrice: 0, maxPreferredPrice: 100000, experienceLevel: '초보', flavorKeywords: ['바닐라', '꿀'] }, interactionHistory: { viewedWhiskeys: [{ whiskeyId: 'w002', viewedAt: Date.now() - 7200000 }, { whiskeyId: 'w007', viewedAt: Date.now() - 1800000 }], likedWhiskeys: ['w002'], dislikedWhiskeys: [], searches: [] }, evaluatedWhiskeyIds: [] },
            { id: 'user003', username: 'user003', password: 'password123', preferences: { bodyPreference: 5, richnessPreference: 5, smokinessPreference: 2, sweetnessPreference: 3, minPreferredPrice: 150000, maxPreferredPrice: 500000, experienceLevel: '전문가', flavorKeywords: ['쉐리', '과일'] }, interactionHistory: { viewedWhiskeys: [{ whiskeyId: 'w003', viewedAt: Date.now() - 5400000 }], likedWhiskeys: ['w003'], dislikedWhiskeys: [], searches: [] }, evaluatedWhiskeyIds: [] }
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
    // 사용자 이름으로 사용자 찾기 추가
    findUserByUsername(username: string): User | undefined {
        return this.users.find(u => u.username === username);
    }
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
    // 새로운 사용자 등록 추가
    registerUser(newUser: User): User {
        // 실제 앱에서는 여기서 사용자 이름 중복 확인, 비밀번호 해싱 등을 수행해야 합니다.
        if (this.findUserByUsername(newUser.username)) {
            throw new Error("이미 존재하는 사용자 이름입니다.");
        }
        this.users.push(newUser);
        return newUser;
    }

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
    // 평가 노트 삭제 추가
    deleteTastingNote(noteId: string, userId: string): boolean {
        const initialLength = this.tastingNotes.length;
        this.tastingNotes = this.tastingNotes.filter(note => note.id !== noteId);
        
        const user = this.getUserById(userId);
        if (user) {
            user.evaluatedWhiskeyIds = user.evaluatedWhiskeyIds.filter(id => id !== noteId);
            this.updateUser(userId, { evaluatedWhiskeyIds: user.evaluatedWhiskeyIds });
        }
        return this.tastingNotes.length < initialLength; // 삭제 성공 여부 반환
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

    async getRecentlyViewedWhiskies(userId: string): Promise<{ whiskey: Whiskey; viewedAt: number }[]> {
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

    async deleteEvaluatedWhiskey(userId: string, tastingNoteId: string): Promise<boolean> {
        const success = dbService.deleteTastingNote(tastingNoteId, userId);
        if (!success) {
            throw new Error("평가 노트를 삭제하는 데 실패했습니다. 다시 시도해주세요.");
        }
        return success;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div> {/* 스피너 색상 변경 */}
        <p className="ml-3 text-stone-700">로딩 중...</p> {/* 텍스트 색상 변경 */}
    </div>
);

const WhiskeyCard: React.FC<{ whiskey: Whiskey; onClick?: (whiskeyId: string) => void; showReason?: boolean; reason?: string; onDelete?: (tastingNoteId: string) => void; tastingNoteId?: string }> = ({ whiskey, onClick, showReason = false, reason, onDelete, tastingNoteId }) => (
    <div
        className="bg-white rounded-xl shadow-lg p-4 m-2 flex flex-col items-center border border-stone-200 hover:shadow-xl transition-shadow duration-300 cursor-pointer transform hover:scale-105 relative" /* 그림자, 모서리, 호버 효과 강화, relative 추가 */
        onClick={() => onClick && onClick(whiskey.id)}
    >
        <img
            src={whiskey.imageUrl || `https://placehold.co/100x150/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`}
            alt={whiskey.name}
            className="w-28 h-40 object-cover rounded-md mb-3 shadow-md" /* 이미지 크기, 그림자 */
            onError={(e) => { e.currentTarget.src = `https://placehold.co/150x250/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`; }}
        />
        <h3 className="text-xl font-bold text-stone-800 text-center mb-1">{whiskey.name}</h3> {/* 폰트 크기, 색상 */}
        <p className="text-base text-stone-600 text-center mb-2">{whiskey.type} | {whiskey.price.toLocaleString()}원</p> {/* 폰트 크기, 색상 */}
        {showReason && reason && (
            <div className="text-sm text-stone-700 text-center mt-2 p-2 bg-stone-50 rounded-lg border border-stone-100"> {/* 배경, 테두리 추가 */}
                <p className="font-semibold text-stone-800">추천 이유:</p>
                <p className="text-sm text-stone-600">{reason}</p>
            </div>
        )}
        <div className="mt-3 flex flex-wrap justify-center">
            {whiskey.flavorProfile.map((flavor, index) => (
                <span key={index} className="bg-amber-100 text-amber-800 text-xs font-medium mr-1 mb-1 px-2.5 py-0.5 rounded-full shadow-sm"> {/* 색상 변경, 그림자 */}
                    {flavor}
                </span>
            ))}
        </div>
        {onDelete && tastingNoteId && (
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(tastingNoteId); }} // 이벤트 버블링 방지
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-80 hover:opacity-100 transition-opacity"
                title="평가 노트 삭제"
            >
                &times;
            </button>
        )}
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
        <div className="fixed inset-0 bg-stone-900 bg-opacity-75 flex justify-center items-center z-50 p-4"> {/* 배경색 변경 */}
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-stone-200"> {/* 그림자, 테두리 */}
                <button onClick={onClose} className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 text-2xl font-bold"> {/* 텍스트 색상 */}
                    &times;
                </button>
                <h2 className="text-3xl font-bold text-amber-700 mb-4">{whiskey.name} 상세 정보</h2> {/* 제목 색상 */}
                <div className="flex flex-col md:flex-row items-center md:items-start mb-4">
                    <img
                        src={whiskey.imageUrl || `https://placehold.co/150x250/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`}
                        alt={whiskey.name}
                        className="w-36 h-52 object-cover rounded-md mr-6 mb-4 md:mb-0 shadow-md" /* 이미지 크기, 그림자 */
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/150x250/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`; }}
                    />
                    <div className="flex-1 text-stone-700 text-lg space-y-2"> {/* 텍스트 색상, 간격 */}
                        <p><strong>증류소:</strong> {whiskey.distillery || '정보 없음'}</p>
                        <p><strong>국가:</strong> {whiskey.country || '정보 없음'}</p>
                        <p><strong>종류:</strong> {whiskey.type || '정보 없음'}</p>
                        <p><strong>숙성 연수:</strong> {whiskey.age ? `${whiskey.age}년` : '정보 없음'}</p>
                        <p><strong>가격:</strong> {whiskey.price.toLocaleString()}원</p>
                        <p><strong>맛/향 프로필:</strong> {whiskey.flavorProfile.length > 0 ? whiskey.flavorProfile.join(', ') : '정보 없음'}</p>
                        <p><strong>설명:</strong> {whiskey.description || '정보 없음'}</p>
                    </div>
                </div>

                <div className="flex justify-around mt-6 space-x-4"> {/* 간격 조정 */}
                    <button
                        onClick={() => setShowTastingNoteForm(!showTastingNoteForm)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-md transform hover:scale-105 font-semibold text-lg" /* 색상, 패딩, 폰트 */
                    >
                        평가 노트 작성 {showTastingNoteForm ? '닫기' : '열기'}
                    </button>
                    <button
                        onClick={fetchSimilarWhiskies}
                        className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-md transform hover:scale-105 font-semibold text-lg" /* 색상, 패딩, 폰트 */
                    >
                        유사한 위스키 보기
                    </button>
                </div>

                {showTastingNoteForm && (
                    <div className="mt-8 p-6 border border-stone-300 rounded-xl bg-stone-50 shadow-inner"> {/* 배경, 테두리, 그림자 */}
                        <h3 className="text-xl font-semibold text-stone-800 mb-4">평가 노트 작성</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* 그리드 레이아웃 */}
                            <div className="col-span-1">
                                <label className="block text-stone-700 text-sm font-bold mb-1">총점 (1-5):</label>
                                <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(parseInt(e.target.value))}
                                    className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-700 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-stone-700 text-sm font-bold mb-1">바디감 (0-5):</label>
                                <input type="number" min="0" max="5" value={bodyRating} onChange={(e) => setBodyRating(parseInt(e.target.value))}
                                    className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-700 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-stone-700 text-sm font-bold mb-1">풍미 (0-5):</label>
                                <input type="number" min="0" max="5" value={richnessRating} onChange={(e) => setRichnessRating(parseInt(e.target.value))}
                                    className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-700 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-stone-700 text-sm font-bold mb-1">스모키함 (0-5):</label>
                                <input type="number" min="0" max="5" value={smokinessRating} onChange={(e) => setSmokinessRating(parseInt(e.target.value))}
                                    className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-700 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-stone-700 text-sm font-bold mb-1">단맛 (0-5):</label>
                                <input type="number" min="0" max="5" value={sweetnessRating} onChange={(e) => setSweetnessRating(parseInt(e.target.value))}
                                    className="w-full p-2 border border-stone-300 rounded-lg bg-white text-stone-700 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-stone-700 text-sm font-bold mb-1">코멘트:</label>
                            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                                className="w-full p-3 border border-stone-300 rounded-lg bg-white text-stone-700 resize-y min-h-[80px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500" rows={3}></textarea>
                        </div>
                        {submitError && <p className="text-red-500 text-sm mt-3 text-center">{submitError}</p>}
                        <button
                            onClick={handleTastingNoteSubmit}
                            className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors shadow-md disabled:opacity-50 transform hover:scale-105 font-semibold text-lg mt-6"
                            disabled={submitLoading}
                        >
                            {submitLoading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                )}

                {similarLoading && <LoadingSpinner />}
                {similarError && <p className="text-red-500 text-sm mt-4 text-center">{similarError}</p>}
                {similarWhiskies.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold text-stone-800 mb-4">유사한 위스키</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); // 로그인 상태에 따라 null 또는 string
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null); // 로그인된 사용자 객체

    const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recommend' | 'preferences' | 'evaluated' | 'recent' | 'all' | 'detail'>('login'); // 초기 탭을 로그인으로 설정

    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
    const [evaluatedWhiskies, setEvaluatedWhiskies] = useState<{ whiskey: Whiskey; tastingNote: TastingNote }[]>([]);
    const [recentViews, setRecentViews] = useState<{ whiskey: Whiskey; viewedAt: number }[]>([]);
    const [allWhiskies, setAllWhiskies] = useState<Whiskey[]>([]);
    const [filteredWhiskies, setFilteredWhiskies] = useState<Whiskey[]>([]);
    const [allWhiskeyFilterOptions, setAllWhiskeyFilterOptions] = useState<WhiskeyFilterOptions>({
        minPrice: 0,
        maxPrice: 500000
    });
    const [sortBy, setSortBy] = useState<WhiskeySortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [detailWhiskey, setDetailWhiskey] = useState<Whiskey | null>(null);

    const [bodyPref, setBodyPref] = useState(3);
    const [richnessPref, setRichnessPref] = useState(3);
    const [smokinessPref, setSmokinessPref] = useState(3);
    const [sweetnessPref, setSweetnessPref] = useState(3);
    const [minPricePref, setMinPricePref] = useState<number>(0);
    const [maxPricePref, setMaxPricePref] = useState<number>(500000);
    const [flavorKeywordsInput, setFlavorKeywordsInput] = useState<string>('');

    const [prefSaveLoading, setPrefSaveLoading] = useState(false);
    const [prefSaveError, setPrefSaveError] = useState<string | null>(null);

    // 회원가입/로그인 폼 상태
    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // 사이드바 상태
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);

    // 사용자 데이터 로드 (로그인 시 또는 초기 로드 시)
    useEffect(() => {
        if (loggedInUser) {
            setCurrentUserId(loggedInUser.id);
            setUserPreferences(loggedInUser.preferences);
            setBodyPref(loggedInUser.preferences.bodyPreference);
            setRichnessPref(loggedInUser.preferences.richnessPreference);
            setSmokinessPref(loggedInUser.preferences.smokinessPreference);
            setSweetnessPref(loggedInUser.preferences.sweetnessPreference);
            setMinPricePref(loggedInUser.preferences.minPreferredPrice || 0);
            setMaxPricePref(loggedInUser.preferences.maxPreferredPrice || 500000);
            setFlavorKeywordsInput(loggedInUser.preferences.flavorKeywords.join(', '));
            // 로그인 후 기본 탭을 추천으로 변경
            setActiveTab('recommend');
            setError(null); // 로그인 성공 시 기존 오류 메시지 제거
        } else {
            setCurrentUserId(null); // 로그아웃 상태
            setUserPreferences(null);
            // 모든 탭의 데이터 초기화 (선택 사항)
            setEvaluatedWhiskies([]);
            setRecentViews([]);
            setAllWhiskies([]);
            setFilteredWhiskies([]);
            setRecommendations([]);
            setActiveTab('login'); // 로그아웃 시 로그인 탭으로 이동
        }
    }, [loggedInUser]);

    const fetchDataForTab = useCallback(async (tab: string) => {
        setLoading(true);
        setError(null);
        if (!currentUserId && tab !== 'login' && tab !== 'register') {
            setError('로그인이 필요합니다.');
            setLoading(false);
            return;
        }
        try {
            if (tab === 'evaluated') {
                const data = await oktongService.getEvaluatedWhiskeys(currentUserId!);
                setEvaluatedWhiskies(data);
            } else if (tab === 'recent') {
                const data = await oktongService.getRecentlyViewedWhiskeys(currentUserId!);
                setRecentViews(data);
            } else if (tab === 'all') {
                const data = await oktongService.getAllWhiskies();
                setAllWhiskies(data);
                const initialFiltered = await oktongService.filterWhiskies(data, allWhiskeyFilterOptions);
                setFilteredWhiskies(initialFiltered);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUserId, allWhiskeyFilterOptions]);

    useEffect(() => {
        fetchDataForTab(activeTab);
    }, [activeTab, fetchDataForTab]);

    // --- 회원가입 및 로그인 핸들러 ---
    const handleRegister = async () => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            if (!authUsername || !authPassword) {
                throw new Error("사용자 이름과 비밀번호를 입력해주세요.");
            }
            const newUserId = `user${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const newUser: User = {
                id: newUserId,
                username: authUsername,
                password: authPassword, // 데모용: 평문 저장. 실제는 해싱 필수!
                preferences: {
                    bodyPreference: 3, richnessPreference: 3, smokinessPreference: 3, sweetnessPreference: 3,
                    minPreferredPrice: 0, maxPreferredPrice: 500000, flavorKeywords: []
                },
                interactionHistory: { viewedWhiskeys: [], likedWhiskeys: [], dislikedWhiskeys: [], searches: [] },
                evaluatedWhiskeyIds: []
            };
            dbService.registerUser(newUser);
            setAuthUsername('');
            setAuthPassword('');
            alert("회원가입이 완료되었습니다! 로그인해 주세요.");
            setActiveTab('login'); // 회원가입 후 로그인 탭으로 이동
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogin = async () => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            if (!authUsername || !authPassword) {
                throw new Error("사용자 이름과 비밀번호를 입력해주세요.");
            }
            const user = dbService.findUserByUsername(authUsername);
            if (!user || user.password !== authPassword) { // 데모용: 평문 비밀번호 비교
                throw new Error("사용자 이름 또는 비밀번호가 올바르지 않습니다.");
            }
            setLoggedInUser(user);
            setAuthUsername('');
            setAuthPassword('');
            alert(`환영합니다, ${user.username}님!`);
        } catch (err: any) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        setLoggedInUser(null);
        alert("로그아웃되었습니다.");
    };
    // --- 회원가입 및 로그인 핸들러 끝 ---


    const handleDeleteEvaluatedWhiskey = async (tastingNoteId: string) => {
        if (!currentUserId) {
            setError('로그인이 필요합니다.');
            return;
        }
        if (window.confirm('정말로 이 평가 노트를 삭제하시겠습니까?')) { // 실제 앱에서는 커스텀 모달 사용 권장
            setLoading(true);
            setError(null);
            try {
                const success = await oktongService.deleteEvaluatedWhiskey(currentUserId, tastingNoteId);
                if (success) {
                    alert('평가 노트가 삭제되었습니다.');
                    fetchDataForTab('evaluated'); // 목록 새로고침
                } else {
                    throw new Error('평가 노트 삭제 실패');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };


    const handleRecommend = async () => {
        if (!userQuery.trim()) {
            setError('추천받고 싶은 내용을 입력해주세요.');
            return;
        }
        if (!currentUserId) { // 로그인 여부 확인
            setError('추천을 받으려면 로그인해야 합니다.');
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
        if (!currentUserId) { // 로그인 여부 확인
            setPrefSaveError('취향을 저장하려면 로그인해야 합니다.');
            setPrefSaveLoading(false);
            return;
        }
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
                // 로그인된 사용자 객체도 업데이트 (선호도 변경 반영)
                setLoggedInUser(prev => prev ? { ...prev, preferences: updatedUser.preferences } : null);
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
        if (!currentUserId) { // 로그인 여부 확인
            setError('상세 정보를 보려면 로그인해야 합니다.');
            setLoading(false);
            return;
        }
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
        <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-300 p-4 font-sans text-stone-800 flex"> {/* 배경색 변경 */}
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>

            {/* 사이드바 */}
            <div className={`fixed top-0 left-0 h-full bg-stone-900 text-stone-100 shadow-lg p-6 transform transition-transform duration-300 ease-in-out z-40
                        ${showFilterSidebar ? 'translate-x-0' : '-translate-x-full'} w-80 overflow-y-auto rounded-r-xl`}> {/* 어두운 배경, 둥근 모서리 */}
                <button onClick={() => setShowFilterSidebar(false)} className="absolute top-4 right-4 text-stone-300 hover:text-white text-3xl font-bold">
                    &times;
                </button>
                <h2 className="text-3xl font-bold text-amber-400 mb-8 mt-4">필터 및 정렬</h2> {/* 강조 색상 */}

                <div className="mb-8 p-4 bg-stone-800 rounded-lg shadow-inner"> {/* 섹션 배경 */}
                    <h3 className="text-xl font-semibold mb-4 text-stone-200">필터링</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-stone-300 text-sm font-bold mb-1">종류:</label>
                            <select value={allWhiskeyFilterOptions.type || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, type: e.target.value as Whiskey['type'] })}
                                className="w-full p-2 border border-stone-600 rounded-lg bg-stone-700 text-white focus:ring-amber-500 focus:border-amber-500">
                                <option value="">모두</option>
                                <option value="싱글 몰트">싱글 몰트</option>
                                <option value="블렌디드">블렌디드</option>
                                <option value="버번">버번</option>
                                <option value="라이">라이</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-stone-300 text-sm font-bold mb-1">최소 가격 (원):</label>
                            <input type="number" min="0" value={allWhiskeyFilterOptions.minPrice || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, minPrice: parseInt(e.target.value) || undefined })}
                                className="w-full p-2 border border-stone-600 rounded-lg bg-stone-700 text-white placeholder-stone-400 focus:ring-amber-500 focus:border-amber-500" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-stone-300 text-sm font-bold mb-1">최대 가격 (원):</label>
                            <input type="number" min="0" value={allWhiskeyFilterOptions.maxPrice || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, maxPrice: parseInt(e.target.value) || undefined })}
                                className="w-full p-2 border border-stone-600 rounded-lg bg-stone-700 text-white placeholder-stone-400 focus:ring-amber-500 focus:border-amber-500" placeholder="500000" />
                        </div>
                        <div>
                            <label className="block text-stone-300 text-sm font-bold mb-1">생산 국가:</label>
                            <input type="text" value={allWhiskeyFilterOptions.country || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, country: e.target.value })}
                                className="w-full p-2 border border-stone-600 rounded-lg bg-stone-700 text-white placeholder-stone-400 focus:ring-amber-500 focus:border-amber-500" placeholder="예: 스코틀랜드" />
                        </div>
                        <div>
                            <label className="block text-stone-300 text-sm font-bold mb-1">맛/향 키워드:</label>
                            <input type="text" value={allWhiskeyFilterOptions.flavorKeywords?.join(', ') || ''} onChange={(e) => setAllWhiskeyFilterOptions({ ...allWhiskeyFilterOptions, flavorKeywords: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                                className="w-full p-2 border border-stone-600 rounded-lg bg-stone-700 text-white placeholder-stone-400 focus:ring-amber-500 focus:border-amber-500" placeholder="예: 피트, 바닐라" />
                        </div>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-stone-800 rounded-lg shadow-inner"> {/* 섹션 배경 */}
                    <h3 className="text-xl font-semibold mb-4 text-stone-200">정렬</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-stone-300 text-sm font-bold mb-1">정렬 기준:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as WhiskeySortBy)}
                                className="w-full p-2 border border-stone-600 rounded-lg bg-stone-700 text-white focus:ring-amber-500 focus:border-amber-500">
                                <option value="name">이름</option>
                                <option value="price">가격</option>
                                <option value="age">숙성 연수</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-stone-300 text-sm font-bold mb-1">정렬 순서:</label>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                className="w-full p-2 border border-stone-600 rounded-lg bg-stone-700 text-white focus:ring-amber-500 focus:border-amber-500">
                                <option value="asc">오름차순</option>
                                <option value="desc">내림차순</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button onClick={handleApplyFilterAndSort} className="w-full bg-amber-500 text-stone-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors shadow-lg transform hover:scale-105">
                    필터 및 정렬 적용
                </button>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className={`flex-1 transition-all duration-300 ease-in-out ${showFilterSidebar ? 'md:ml-80' : 'md:ml-0'} p-4 md:p-8`}> {/* 반응형 마진 */}
                <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-stone-200"> {/* 메인 컨테이너 테두리 */}
                    {/* 상단 헤더: 환영 메시지 (좌상단) 및 로그아웃 버튼 (우상단) */}
                    <div className="relative w-full mb-8">
                        {loggedInUser && (
                            <>
                                <span className="absolute top-0 left-0 text-stone-800 text-xl font-bold">환영합니다, {loggedInUser.username}님!</span>
                                <button
                                    onClick={handleLogout}
                                    className="absolute top-0 right-0 bg-red-600 text-white px-4 py-2 rounded-lg text-base font-semibold hover:bg-red-700 transition-colors shadow-md transform hover:scale-105"
                                >
                                    로그아웃
                                </button>
                            </>
                        )}
                        <h1 className="text-5xl font-extrabold text-amber-800 tracking-tight text-center mt-8"> {/* 제목 중앙 정렬 */}
                            🥃 Oktong 🥃
                        </h1>
                    </div>

                    {/* 메인 내비게이션 탭 (일렬 정렬) */}
                    {loggedInUser && (
                        <div className="flex flex-wrap justify-center space-x-2 md:space-x-4 border-b border-stone-200 pb-4 mb-6"> {/* 일렬 정렬 및 간격 */}
                            <button
                                className={`py-2 px-4 rounded-lg text-lg font-medium transition-colors duration-200 shadow-md
                                            ${activeTab === 'recommend' ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setActiveTab('recommend')}
                            >
                                위스키 추천받기
                            </button>
                            <button
                                className={`py-2 px-4 rounded-lg text-lg font-medium transition-colors duration-200 shadow-md
                                            ${activeTab === 'preferences' ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setActiveTab('preferences')}
                            >
                                위스키 취향 입력
                            </button>
                            <button
                                className={`py-2 px-4 rounded-lg text-lg font-medium transition-colors duration-200 shadow-md
                                            ${activeTab === 'evaluated' ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setActiveTab('evaluated')}
                            >
                                내가 평가한 위스키
                            </button>
                            <button
                                className={`py-2 px-4 rounded-lg text-lg font-medium transition-colors duration-200 shadow-md
                                            ${activeTab === 'recent' ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setActiveTab('recent')}
                            >
                                최근 본 위스키
                            </button>
                            <button
                                className={`py-2 px-4 rounded-lg text-lg font-medium transition-colors duration-200 shadow-md
                                            ${activeTab === 'all' ? 'bg-amber-700 text-white' : 'text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setActiveTab('all')}
                            >
                                전체 위스키 목록
                            </button>
                        </div>
                    )}

                    {loading && <LoadingSpinner />}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 font-semibold text-center">
                            <strong className="font-bold">오류!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}
                    {authError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 font-semibold text-center">
                            <strong className="font-bold">인증 오류!</strong>
                            <span className="block sm:inline"> {authError}</span>
                        </div>
                    )}


                    {/* 로그인 탭 */}
                    {activeTab === 'login' && !loggedInUser && (
                        <div className="mb-6 max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg border border-stone-200"> {/* 테두리 색상 */}
                            <h2 className="text-3xl font-bold text-amber-700 mb-6 text-center">로그인</h2> {/* 제목 색상 */}
                            <div className="mb-4">
                                <label className="block text-stone-700 text-sm font-semibold mb-2" htmlFor="login-username"> {/* 텍스트 색상 */}
                                    사용자 이름
                                </label>
                                <input
                                    type="text"
                                    id="login-username"
                                    className="appearance-none border border-stone-300 rounded-lg w-full py-3 px-4 text-stone-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" /* 테두리, 텍스트, 포커스 색상 */
                                    value={authUsername}
                                    onChange={(e) => setAuthUsername(e.target.value)}
                                    disabled={authLoading}
                                    placeholder="사용자 이름을 입력하세요"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-stone-700 text-sm font-semibold mb-2" htmlFor="login-password"> {/* 텍스트 색상 */}
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    id="login-password"
                                    className="appearance-none border border-stone-300 rounded-lg w-full py-3 px-4 text-stone-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" /* 테두리, 텍스트, 포커스 색상 */
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    disabled={authLoading}
                                    placeholder="비밀번호를 입력하세요"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleLogin}
                                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full text-lg transform hover:scale-105 transition-transform shadow-md" /* 색상 변경 */
                                    disabled={authLoading}
                                >
                                    {authLoading ? '로그인 중...' : '로그인'}
                                </button>
                            </div>
                            <p className="text-center text-stone-600 text-sm mt-6"> {/* 텍스트 색상 */}
                                계정이 없으신가요? <button onClick={() => setActiveTab('register')} className="text-amber-700 font-semibold hover:underline">회원가입</button> {/* 링크 색상 */}
                            </p>
                            <p className="text-center text-stone-500 text-xs mt-2"> {/* 텍스트 색상 */}
                                (테스트 계정: user001 / password123)
                            </p>
                        </div>
                    )}

                    {/* 회원가입 탭 */}
                    {activeTab === 'register' && !loggedInUser && (
                        <div className="mb-6 max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg border border-stone-200"> {/* 테두리 색상 */}
                            <h2 className="text-3xl font-bold text-amber-700 mb-6 text-center">회원가입</h2> {/* 제목 색상 */}
                            <div className="mb-4">
                                <label className="block text-stone-700 text-sm font-semibold mb-2" htmlFor="register-username"> {/* 텍스트 색상 */}
                                    사용자 이름 (ID)
                                </label>
                                <input
                                    type="text"
                                    id="register-username"
                                    className="appearance-none border border-stone-300 rounded-lg w-full py-3 px-4 text-stone-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" /* 테두리, 텍스트, 포커스 색상 */
                                    value={authUsername}
                                    onChange={(e) => setAuthUsername(e.target.value)}
                                    disabled={authLoading}
                                    placeholder="사용할 사용자 이름을 입력하세요"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-stone-700 text-sm font-semibold mb-2" htmlFor="register-password"> {/* 텍스트 색상 */}
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    id="register-password"
                                    className="appearance-none border border-stone-300 rounded-lg w-full py-3 px-4 text-stone-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" /* 테두리, 텍스트, 포커스 색상 */
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    disabled={authLoading}
                                    placeholder="비밀번호를 입력하세요"
                                />
                                <p className="text-red-500 text-xs italic mt-1">
                                    **경고: 데모 앱에서는 비밀번호가 평문으로 저장됩니다. 실제 서비스에서는 반드시 암호화해야 합니다.**
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleRegister}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full text-lg transform hover:scale-105 transition-transform shadow-md" /* 색상 변경 */
                                    disabled={authLoading}
                                >
                                    {authLoading ? '회원가입 중...' : '회원가입'}
                                </button>
                            </div>
                            <p className="text-center text-stone-600 text-sm mt-6"> {/* 텍스트 색상 */}
                                이미 계정이 있으신가요? <button onClick={() => setActiveTab('login')} className="text-amber-700 font-semibold hover:underline">로그인</button> {/* 링크 색상 */}
                            </p>
                        </div>
                    )}


                    {loggedInUser && ( // 로그인된 사용자에게만 기능 탭 표시
                        <>
                            {activeTab === 'recommend' && (
                                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-stone-200"> {/* 테두리 색상 */}
                                    <h2 className="text-2xl font-bold text-amber-700 mb-4">AI 위스키 추천받기</h2> {/* 제목 색상 */}
                                    <textarea
                                        className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y min-h-[80px] transition-all text-stone-700" /* 테두리, 포커스, 텍스트 색상 */
                                        placeholder="어떤 위스키를 찾으시나요? (예: '부드럽고 달콤한 위스키 추천해줘', '피트향 강한 싱글몰트 10만원 이하로 찾아줘')"
                                        value={userQuery}
                                        onChange={(e) => setUserQuery(e.target.value)}
                                        rows={3}
                                    ></textarea>
                                    <button
                                        onClick={handleRecommend}
                                        className="w-full bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg mt-3 hover:bg-amber-800 transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105" /* 색상 변경 */
                                        disabled={loading}
                                    >
                                        {loading ? '추천 중...' : '위스키 추천받기'}
                                    </button>

                                    {recommendations.length > 0 && (
                                        <div className="mt-8">
                                            <h3 className="text-xl font-bold text-amber-700 mb-5 text-center">✨ 추천 위스키 ✨</h3> {/* 제목 색상 */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {recommendations.map((rec, index) => (
                                                    <WhiskeyCard key={index} whiskey={rec.whiskey} showReason reason={rec.reason} onClick={handleViewDetails} />
                                                ))}
                                            </div>
                                            <p className="text-center text-stone-600 text-sm mt-6"> {/* 텍스트 색상 */}
                                                추천 결과에 대한 피드백을 주시면 더 정확한 추천을 제공해 드릴 수 있습니다.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'preferences' && (
                                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-stone-200">
                                    <h2 className="text-2xl font-bold text-amber-700 mb-4">위스키 취향 입력</h2> {/* 제목 색상 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1">
                                            <label className="block text-stone-700 text-sm font-bold mb-2">바디감 (0-5):</label> {/* 텍스트 색상 */}
                                            <input type="range" min="0" max="5" value={bodyPref} onChange={(e) => setBodyPref(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600" /> {/* 슬라이더 색상 */}
                                            <span className="text-stone-600 text-sm">{bodyPref}</span> {/* 텍스트 색상 */}
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-stone-700 text-sm font-bold mb-2">풍미 (0-5):</label>
                                            <input type="range" min="0" max="5" value={richnessPref} onChange={(e) => setRichnessPref(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                                            <span className="text-stone-600 text-sm">{richnessPref}</span>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-stone-700 text-sm font-bold mb-2">스모키함 (0-5):</label>
                                            <input type="range" min="0" max="5" value={smokinessPref} onChange={(e) => setSmokinessPref(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                                            <span className="text-stone-600 text-sm">{smokinessPref}</span>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-stone-700 text-sm font-bold mb-2">단맛 (0-5):</label>
                                            <input type="range" min="0" max="5" value={sweetnessPref} onChange={(e) => setSweetnessPref(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                                            <span className="text-stone-600 text-sm">{sweetnessPref}</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-stone-700 text-sm font-bold mb-2">선호 최소 가격 (원):</label>
                                            <input type="range" min="0" max="500000" step="10000" value={minPricePref} onChange={(e) => setMinPricePref(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                                            <span className="text-stone-600 text-sm">{minPricePref.toLocaleString()}원</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-stone-700 text-sm font-bold mb-2">선호 최대 가격 (원):</label>
                                            <input type="range" min="0" max="500000" step="10000" value={maxPricePref} onChange={(e) => setMaxPricePref(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                                            <span className="text-stone-600 text-sm">{maxPricePref.toLocaleString()}원</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-stone-700 text-sm font-bold mb-2">선호 맛/향 키워드 (쉼표로 구분):</label>
                                            <textarea
                                                value={flavorKeywordsInput}
                                                onChange={(e) => setFlavorKeywordsInput(e.target.value)}
                                                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y min-h-[80px] transition-all text-stone-700"
                                                placeholder="예: 피트, 스모키, 바닐라, 꿀"
                                            ></textarea>
                                        </div>
                                    </div>
                                    {prefSaveError && <p className="text-red-500 text-sm mt-3 text-center">{prefSaveError}</p>}
                                    <button
                                        onClick={handleSavePreferences}
                                        className="w-full bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg mt-6 hover:bg-orange-700 transition-colors shadow-md disabled:opacity-50 transform hover:scale-105"
                                        disabled={prefSaveLoading}
                                    >
                                        {prefSaveLoading ? '저장 중...' : '취향 저장'}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'evaluated' && (
                                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-stone-200">
                                    <h2 className="text-2xl font-bold text-amber-700 mb-4">내가 평가한 위스키</h2>
                                    {evaluatedWhiskies.length === 0 ? (
                                        <p className="text-stone-600 text-center py-4">아직 평가한 위스키가 없습니다.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {evaluatedWhiskies.map((item, index) => (
                                                <div key={index} className="bg-white rounded-xl shadow-lg p-4 border border-stone-200 hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"> {/* 카드 디자인 강화 */}
                                                    <WhiskeyCard whiskey={item.whiskey} onClick={handleViewDetails} />
                                                    <div className="mt-3 text-sm text-stone-700 space-y-1">
                                                        <p><strong>총점:</strong> <span className="font-semibold text-amber-700">{item.tastingNote.rating}</span>/5</p>
                                                        <p><strong>바디감:</strong> {item.tastingNote.bodyRating}/5</p>
                                                        <p><strong>풍미:</strong> {item.tastingNote.richnessRating}/5</p>
                                                        <p><strong>스모키함:</strong> {item.tastingNote.smokinessRating}/5</p>
                                                        <p><strong>단맛:</strong> {item.tastingNote.sweetnessRating}/5</p>
                                                        <p className="mt-2"><strong>코멘트:</strong> <span className="italic text-stone-800">"{item.tastingNote.reviewText}"</span></p>
                                                        <p className="text-xs text-stone-500 mt-2">작성일: {new Date(item.tastingNote.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteEvaluatedWhiskey(item.tastingNote.id)}
                                                        className="mt-4 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors shadow-md w-full"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'recent' && (
                                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-stone-200">
                                    <h2 className="text-2xl font-bold text-amber-700 mb-4">최근 본 위스키</h2>
                                    {recentViews.length === 0 ? (
                                        <p className="text-stone-600 text-center py-4">최근 조회한 위스키가 없습니다.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {recentViews.map((item, index) => (
                                                <div key={index} className="bg-white rounded-xl shadow-lg p-4 border border-stone-200 hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"> {/* 카드 디자인 강화 */}
                                                    <WhiskeyCard whiskey={item.whiskey} onClick={handleViewDetails} />
                                                    <p className="text-xs text-stone-500 mt-2 text-center">조회 시간: {new Date(item.viewedAt).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'all' && (
                                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-stone-200">
                                    <h2 className="text-2xl font-bold text-amber-700 mb-4 flex items-center">
                                        전체 위스키 목록
                                        <button
                                            onClick={() => setShowFilterSidebar(true)}
                                            className="ml-4 bg-amber-600 text-white px-4 py-2 rounded-lg text-base font-semibold hover:bg-amber-700 transition-colors shadow-md transform hover:scale-105"
                                        >
                                            필터/정렬 열기
                                        </button>
                                    </h2>

                                    {filteredWhiskies.length === 0 ? (
                                        <p className="text-stone-600 text-center py-4">위스키 목록이 비어 있거나 필터링/정렬 조건에 맞는 위스키가 없습니다.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredWhiskies.map((whiskey) => (
                                                <WhiskeyCard key={whiskey.id} whiskey={whiskey} onClick={handleViewDetails} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )} {/* 로그인된 사용자에게만 기능 탭 표시 끝 */}

                    <WhiskeyDetailModal
                        whiskey={detailWhiskey}
                        onClose={() => setDetailWhiskey(null)}
                        userId={currentUserId || 'anonymous'}
                        onTastingNoteSubmit={handleTastingNoteSubmitted}
                    />

                    <div className="mt-8 text-center text-sm text-stone-600">
                        현재 사용자 ID: <span className="font-mono font-semibold text-stone-800">{currentUserId || '로그아웃됨'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
