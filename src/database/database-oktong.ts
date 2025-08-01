// src/database/database-oktong.ts

// 위스키 데이터 모델 정의
export interface Whiskey {
    id: string; // 위스키 고유 ID
    name: string; // 위스키 이름
    type: '싱글 몰트' | '블렌디드' | '버번' | '라이' | '기타'; // 위스키 종류
    distillery: string; // 증류소
    country: string; // 생산 국가
    age?: number; // 숙성 연수 (옵션)
    priceRange: '저가' | '중가' | '고가'; // 가격대 (예: 저가(~5만원), 중가(5~15만원), 고가(15만원~))
    flavorProfile: string[]; // 맛/향 프로필 키워드 (예: ['피트', '스모키', '바닐라', '과일', '꿀'])
    description: string; // 위스키 설명
    imageUrl?: string; // 위스키 이미지 URL (옵션)
    averageRating?: number; // 평균 평점 (옵션)
    reviews?: string[]; // 사용자 리뷰 요약 또는 원본 (옵션)
}

// 사용자 취향 선호도 모델 정의 (User 인터페이스 내부에 포함될 수 있음)
export interface UserPreferences {
    bodyPreference: number; // 바디감 선호도 (0-5)
    richnessPreference: number; // 풍미 선호도 (0-5)
    smokinessPreference: number; // 스모키함 선호도 (0-5)
    sweetnessPreference: number; // 단맛 선호도 (0-5)
    preferredPriceRange?: '저가' | '중가' | '고가'; // 선호하는 가격대
    experienceLevel?: '초보' | '중급' | '전문가'; // 위스키 경험 수준
}

// 사용자 상호작용 기록 모델 정의
export interface UserInteractionHistory {
    viewedWhiskeys: Array<{ whiskeyId: string; viewedAt: number }>; // 본 위스키 ID 및 조회 시간 (timestamp) 목록
    likedWhiskeys: string[]; // 좋아요 누른 위스키 ID 목록
    dislikedWhiskeys: string[]; // 싫어요 누른 위스키 ID 목록
    searches: string[]; // 검색어 기록
}

// 사용자가 작성한 평가 노트 모델 정의
export interface TastingNote {
    id: string; // 평가 노트 고유 ID
    userId: string; // 작성자 ID
    whiskeyId: string; // 평가 대상 위스키 ID
    rating: number; // 총점 (1-5)
    reviewText: string; // 코멘트
    bodyRating: number; // 바디감 평가 (0-5)
    richnessRating: number; // 풍미 평가 (0-5)
    smokinessRating: number; // 스모키함 평가 (0-5)
    sweetnessRating: number; // 단맛 평가 (0-5)
    createdAt: number; // 작성 시간 (timestamp)
}

// 사용자 데이터 모델 정의
export interface User {
    id: string; // 사용자 고유 ID
    preferences: UserPreferences; // 사용자 취향 선호도
    interactionHistory: UserInteractionHistory; // 사용자 상호작용 기록
    evaluatedWhiskeyIds: string[]; // 사용자가 평가한 위스키 ID 목록 (TastingNote ID와 연결)
    // 추가적인 사용자 정보 (예: 이름, 가입일 등)
}

/**
 * @design_pattern Singleton Pattern
 * 시스템 전체에서 하나의 인스턴스만 존재해야 하는 데이터베이스 서비스에 적용.
 * getInstance() 메서드를 통해 전역 접근을 보장하고, 일관성 있는 시스템 상태 관리를 돕습니다.
 */
class DatabaseService {
    private static instance: DatabaseService; // Singleton 인스턴스

    private whiskeys: Whiskey[] = []; // 위스키 데이터 저장소
    private users: User[] = []; // 사용자 데이터 저장소
    private tastingNotes: TastingNote[] = []; // 평가 노트 저장소

    private constructor() {
        // 초기 데이터 로드 (실제로는 DB에서 비동기적으로 로드)
        this.loadInitialData();
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    private loadInitialData() {
        // 예시 위스키 데이터
        this.whiskeys = [
            {
                id: 'w001',
                name: '라프로익 10년',
                type: '싱글 몰트',
                distillery: '라프로익',
                country: '스코틀랜드',
                age: 10,
                priceRange: '중가',
                flavorProfile: ['피트', '스모키', '요오드', '해조류'],
                description: '강렬한 피트향과 스모키함이 특징인 아일라 싱글 몰트 위스키입니다. 독특한 개성을 찾는 분들께 추천합니다.',
                imageUrl: 'https://placehold.co/150x250/aabbcc/ffffff?text=Laphroaig',
                averageRating: 4.5,
                reviews: ['피트향이 정말 강해서 좋아요.', '독특한 맛이 일품입니다.']
            },
            {
                id: 'w002',
                name: '발렌타인 17년',
                type: '블렌디드',
                distillery: '발렌타인',
                country: '스코틀랜드',
                age: 17,
                priceRange: '중가',
                flavorProfile: ['꿀', '바닐라', '과일', '부드러움'],
                description: '부드러운 목넘김과 균형 잡힌 맛이 특징인 블렌디드 위스키입니다. 선물용으로도 인기가 많습니다.',
                imageUrl: 'https://placehold.co/150x250/ccbbaa/ffffff?text=Ballantines',
                averageRating: 4.2,
                reviews: ['부드럽고 마시기 편해요.', '선물용으로 좋습니다.']
            },
            {
                id: 'w003',
                name: '맥캘란 12년 쉐리 오크',
                type: '싱글 몰트',
                distillery: '맥캘란',
                country: '스코틀랜드',
                age: 12,
                priceRange: '고가',
                flavorProfile: ['쉐리', '건포도', '오렌지', '스파이스'],
                description: '쉐리 오크 숙성으로 인한 풍부한 과일향과 스파이시함이 매력적인 위스키입니다. 깊고 복합적인 맛을 선사합니다.',
                imageUrl: 'https://placehold.co/150x250/bbaacc/ffffff?text=Macallan',
                averageRating: 4.7,
                reviews: ['쉐리향이 정말 좋아요.', '부드럽고 깊은 맛입니다.']
            },
            {
                id: 'w004',
                name: '아벨라워 12년 더블 캐스크',
                type: '싱글 몰트',
                distillery: '아벨라워',
                country: '스코틀랜드',
                age: 12,
                priceRange: '중가',
                flavorProfile: ['과일', '꿀', '스파이스', '초콜릿'],
                description: '버번과 쉐리 캐스크의 더블 숙성으로 복합적인 맛과 향을 선사합니다. 균형 잡힌 맛으로 많은 사랑을 받습니다.',
                imageUrl: 'https://placehold.co/150x250/ccbbaa/ffffff?text=Aberlour',
                averageRating: 4.3,
                reviews: ['균형 잡힌 맛이 좋습니다.', '가성비 좋은 싱글몰트.']
            },
            {
                id: 'w005',
                name: '글렌피딕 12년',
                type: '싱글 몰트',
                distillery: '글렌피딕',
                country: '스코틀랜드',
                age: 12,
                priceRange: '중가',
                flavorProfile: ['과일', '배', '크리미', '오크'],
                description: '신선한 배와 섬세한 오크 향이 조화를 이루는 세계에서 가장 많이 팔리는 싱글 몰트 위스키 중 하나입니다. 입문용으로도 좋습니다.',
                imageUrl: 'https://placehold.co/150x250/cbaabc/ffffff?text=Glenfiddich',
                averageRating: 4.0,
                reviews: ['입문용으로 최고입니다.', '깔끔하고 부드러워요.']
            },
            {
                id: 'w006',
                name: '히비키 하모니',
                type: '블렌디드',
                distillery: '산토리',
                country: '일본',
                priceRange: '고가',
                flavorProfile: ['꿀', '오렌지 껍질', '화이트 초콜릿'],
                description: '다양한 몰트와 그레인 위스키를 섬세하게 블렌딩하여 조화로운 맛을 선사하는 일본 위스키입니다. 부드럽고 우아한 향이 특징입니다.',
                imageUrl: 'https://placehold.co/150x250/ddccbb/ffffff?text=Hibiki',
                averageRating: 4.6,
                reviews: ['정말 부드럽고 향이 좋아요.', '고급스러운 맛입니다.']
            },
            {
                id: 'w007',
                name: '메이커스 마크',
                type: '버번',
                distillery: '메이커스 마크',
                country: '미국',
                age: 6, // 버번은 보통 숙성 연수를 명시하지 않지만, 예시로 추가
                priceRange: '저가',
                flavorProfile: ['바닐라', '카라멜', '오크', '스파이스'],
                description: '밀을 사용하여 부드럽고 달콤한 맛이 특징인 버번 위스키입니다. 손으로 밀봉한 붉은 왁스 캡이 상징적입니다.',
                imageUrl: 'https://placehold.co/150x250/eeddcc/ffffff?text=MakersMark',
                averageRating: 4.1,
                reviews: ['버번 입문으로 좋아요.', '달콤하고 부드럽습니다.']
            }
        ];

        // 예시 사용자 데이터
        this.users = [
            {
                id: 'user001',
                preferences: {
                    bodyPreference: 3, richnessPreference: 4, smokinessPreference: 5, sweetnessPreference: 1,
                    preferredPriceRange: '중가',
                    experienceLevel: '중급'
                },
                interactionHistory: {
                    viewedWhiskeys: [{ whiskeyId: 'w001', viewedAt: Date.now() - 3600000 }], // 1시간 전
                    likedWhiskeys: ['w001'],
                    dislikedWhiskeys: [],
                    searches: []
                },
                evaluatedWhiskeyIds: []
            },
            {
                id: 'user002',
                preferences: {
                    bodyPreference: 4, richnessPreference: 3, smokinessPreference: 1, sweetnessPreference: 5,
                    preferredPriceRange: '저가',
                    experienceLevel: '초보'
                },
                interactionHistory: {
                    viewedWhiskeys: [{ whiskeyId: 'w002', viewedAt: Date.now() - 7200000 }, { whiskeyId: 'w007', viewedAt: Date.now() - 1800000 }],
                    likedWhiskeys: ['w002'],
                    dislikedWhiskeys: [],
                    searches: []
                },
                evaluatedWhiskeyIds: []
            },
            {
                id: 'user003',
                preferences: {
                    bodyPreference: 5, richnessPreference: 5, smokinessPreference: 2, sweetnessPreference: 3,
                    preferredPriceRange: '고가',
                    experienceLevel: '전문가'
                },
                interactionHistory: {
                    viewedWhiskeys: [{ whiskeyId: 'w003', viewedAt: Date.now() - 5400000 }],
                    likedWhiskeys: ['w003'],
                    dislikedWhiskeys: [],
                    searches: []
                },
                evaluatedWhiskeyIds: []
            }
        ];

        // 예시 평가 노트
        this.tastingNotes = [
            {
                id: 'tn001', userId: 'user001', whiskeyId: 'w001', rating: 5, reviewText: '정말 강렬한 피트향이 인상적입니다. 아일라 위스키의 정수!',
                bodyRating: 5, richnessRating: 4, smokinessRating: 5, sweetnessRating: 1, createdAt: Date.now() - 86400000
            }
        ];
        // user001의 evaluatedWhiskeyIds에 tn001 추가
        const user001 = this.users.find(u => u.id === 'user001');
        if (user001) {
            user001.evaluatedWhiskeyIds.push('tn001');
        }
    }

    // 모든 위스키 데이터 가져오기
    getAllWhiskeys(): Whiskey[] {
        return this.whiskeys;
    }

    // 특정 ID의 위스키 가져오기
    getWhiskeyById(id: string): Whiskey | undefined {
        return this.whiskeys.find(w => w.id === id);
    }

    // 특정 ID의 사용자 데이터 가져오기
    getUserById(id: string): User | undefined {
        return this.users.find(u => u.id === id);
    }

    /**
     * @design_pattern Information Expert (GRASP)
     * User 객체는 자신의 preference와 history를 관리하는 책임이 있습니다.
     * 이 메서드는 User 객체의 속성 업데이트를 캡슐화합니다.
     */
    updateUser(userId: string, updateData: Partial<User>): User | undefined {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            // 깊은 복사를 통해 불변성 유지 (실제 DB에서는 ORM이 처리)
            this.users[userIndex] = {
                ...this.users[userIndex],
                ...updateData,
                preferences: updateData.preferences ? { ...this.users[userIndex].preferences, ...updateData.preferences } : this.users[userIndex].preferences,
                interactionHistory: updateData.interactionHistory ? { ...this.users[userIndex].interactionHistory, ...updateData.interactionHistory } : this.users[userIndex].interactionHistory,
            };
            console.log(`[DB] 사용자 ${userId} 데이터 업데이트됨.`);
            return this.users[userIndex];
        }
        return undefined;
    }

    /**
     * @design_pattern Factory Method Pattern (간접 적용)
     * 새로운 사용자 객체를 생성하고 시스템에 추가하는 로직을 캡슐화.
     * User, User_Preference, User_History 객체들의 일관된 생성을 보장합니다.
     */
    addUser(newUser: User): User {
        this.users.push(newUser);
        console.log(`[DB] 새로운 사용자 ${newUser.id} 추가됨.`);
        return newUser;
    }

    // 모든 평가 노트 가져오기
    getAllTastingNotes(): TastingNote[] {
        return this.tastingNotes;
    }

    // 특정 위스키의 평가 노트 가져오기
    getTastingNotesByWhiskeyId(whiskeyId: string): TastingNote[] {
        return this.tastingNotes.filter(tn => tn.whiskeyId === whiskeyId);
    }

    // 특정 사용자의 평가 노트 가져오기
    getTastingNotesByUserId(userId: string): TastingNote[] {
        return this.tastingNotes.filter(tn => tn.userId === userId);
    }

    /**
     * 새로운 평가 노트를 추가합니다.
     * @design_pattern Factory Method Pattern (간접 적용)
     * 리뷰 생성 로직을 캡슐화. 리뷰 ID 생성 규칙과 리뷰 객체 생성을 관리합니다.
     */
    addTastingNote(newNote: TastingNote): TastingNote {
        this.tastingNotes.push(newNote);
        // 사용자의 evaluatedWhiskeyIds에도 추가
        const user = this.getUserById(newNote.userId);
        if (user && !user.evaluatedWhiskeyIds.includes(newNote.id)) {
            user.evaluatedWhiskeyIds.push(newNote.id);
            this.updateUser(user.id, { evaluatedWhiskeyIds: user.evaluatedWhiskeyIds });
        }
        console.log(`[DB] 새로운 평가 노트 ${newNote.id} 추가됨.`);
        return newNote;
    }

    // 특정 평가 노트 업데이트
    updateTastingNote(noteId: string, updateData: Partial<TastingNote>): TastingNote | undefined {
        const noteIndex = this.tastingNotes.findIndex(tn => tn.id === noteId);
        if (noteIndex > -1) {
            this.tastingNotes[noteIndex] = { ...this.tastingNotes[noteIndex], ...updateData };
            console.log(`[DB] 평가 노트 ${noteId} 업데이트됨.`);
            return this.tastingNotes[noteIndex];
        }
        return undefined;
    }
}

// 데이터베이스 서비스 인스턴스 생성 (Singleton)
export const dbService = DatabaseService.getInstance();
