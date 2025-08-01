// src/services/oktong-recommendation-service.ts

import { dbService, Whiskey, User, UserPreferences, TastingNote } from '../database/database-oktong'; // 데이터베이스 서비스 및 모델 임포트

// 추천 결과 모델 정의
export interface RecommendationResult {
    whiskey: Whiskey; // 추천된 위스키 객체
    reason: string; // 추천 이유 (LLM이 생성하거나, 함수가 생성)
}

// 필터링 옵션 인터페이스
export interface WhiskeyFilterOptions {
    type?: Whiskey['type'];
    priceRange?: Whiskey['priceRange'];
    country?: string;
    flavorKeywords?: string[];
    minRating?: number;
}

// 정렬 기준 타입
export type WhiskeySortBy = 'name' | 'price' | 'rating' | 'age';
export type SortOrder = 'asc' | 'desc';

/**
 * @design_pattern Strategy Pattern (간접 적용)
 * recommendWhiskeys 함수 내에서 다양한 필터링 및 정렬 로직을 포함하여
 * 필요에 따라 알고리즘을 유연하게 변경하거나 확장할 수 있도록 설계되었습니다.
 * 명시적인 Strategy 인터페이스는 없지만, 내부 로직이 전략적으로 구성될 수 있습니다.
 */
export class OktongRecommendationService {
    constructor() {
        // 서비스 초기화 (필요하다면)
    }

    /**
     * @use_case 위스키 취향 데이터 입력
     * 사용자의 선호하는 맛과 가격대를 설정하여 개인 프로필 정보에 저장합니다.
     * @param userId 사용자 ID
     * @param preferences 사용자가 입력한 취향 선호도
     * @returns 업데이트된 사용자 정보 또는 null (실패 시)
     * @nfr Performance Efficiency: 평균 2초 이내에 DB에 적용.
     */
    async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<User | null> {
        console.log(`[OktongService] saveUserPreferences 호출됨. 사용자 ID: "${userId}", 선호도:`, preferences);
        const user = dbService.getUserById(userId);
        if (user) {
            const updatedUser = dbService.updateUser(userId, { preferences });
            if (updatedUser) {
                console.log(`[OktongService] 사용자 ${userId} 취향 정보 저장 성공.`);
                return updatedUser;
            } else {
                console.error(`[OktongService] 사용자 ${userId} 취향 정보 저장 실패: DB 업데이트 오류.`);
                throw new Error("저장 실패: 데이터베이스 업데이트 중 오류가 발생했습니다.");
            }
        } else {
            console.error(`[OktongService] 사용자 ${userId}를 찾을 수 없습니다.`);
            throw new Error("사용자를 찾을 수 없습니다.");
        }
    }

    /**
     * @use_case 위스키 추천받기
     * 사용자의 저장된 취향을 기반으로 위스키를 추천합니다.
     * 이 함수는 Agentica를 통해 LLM이 호출하게 될 주요 함수입니다.
     *
     * @param userQuery 사용자가 입력한 위스키 관련 질문 (예: "달콤하고 부드러운 위스키", "피트향 강한 아일라 위스키")
     * @param userId 현재 사용자의 ID (개인화된 추천을 위해)
     * @param options LLM이 추가적으로 넘겨줄 수 있는 구조화된 필터링 옵션
     * @returns 추천된 위스키 목록과 각 위스키에 대한 추천 이유를 포함하는 배열
     * @nfr Performance Efficiency: 평균 3초 이내에 결과가 화면에 출력.
     */
    async recommendWhiskeys(
        userQuery: string,
        userId?: string,
        options?: {
            flavorKeywords?: string[]; // LLM이 추출한 맛/향 키워드
            priceRange?: '저가' | '중가' | '고가'; // LLM이 추출한 가격대
            type?: '싱글 몰트' | '블렌디드' | '버번' | '라이' | '기타'; // LLM이 추출한 위스키 종류
            minRating?: number; // 최소 평점
        }
    ): Promise<RecommendationResult[]> {
        console.log(`[OktongService] recommendWhiskeys 호출됨. 쿼리: "${userQuery}", 사용자 ID: "${userId}", 옵션:`, options);

        let filteredWhiskeys = dbService.getAllWhiskeys();
        const currentUser = userId ? dbService.getUserById(userId) : undefined;

        // 1. LLM이 넘겨준 구조화된 옵션으로 필터링
        if (options?.type) {
            filteredWhiskeys = filteredWhiskeys.filter(w => w.type === options.type);
        }
        if (options?.priceRange) {
            filteredWhiskeys = filteredWhiskeys.filter(w => w.priceRange === options.priceRange);
        }
        if (options?.minRating) {
            filteredWhiskeys = filteredWhiskeys.filter(w => (w.averageRating || 0) >= options.minRating);
        }
        if (options?.flavorKeywords && options.flavorKeywords.length > 0) {
            filteredWhiskeys = filteredWhiskeys.filter(w =>
                options.flavorKeywords!.some(keyword => w.flavorProfile.includes(keyword))
            );
        }

        // 2. 사용자의 자연어 쿼리(userQuery)를 기반으로 추가 필터링 (LLM이 옵션을 완벽히 추출하지 못했을 경우 대비)
        const lowerCaseQuery = userQuery.toLowerCase();
        if (lowerCaseQuery.includes('피트') || lowerCaseQuery.includes('스모키')) {
            filteredWhiskeys = filteredWhiskeys.filter(w =>
                w.flavorProfile.includes('피트') || w.flavorProfile.includes('스모키')
            );
        }
        if (lowerCaseQuery.includes('달콤') || lowerCaseQuery.includes('바닐라') || lowerCaseQuery.includes('꿀') || lowerCaseQuery.includes('과일')) {
            filteredWhiskeys = filteredWhiskeys.filter(w =>
                w.flavorProfile.some(f => ['바닐라', '꿀', '과일', '쉐리'].includes(f))
            );
        }
        // ... (다른 쿼리 기반 필터링 로직)

        // 3. 개인화 로직 추가 (사용자 선호도, 과거 상호작용 활용)
        if (currentUser) {
            // 사용자의 명시적 선호도 반영
            const userPref = currentUser.preferences;
            if (userPref.preferredPriceRange) {
                filteredWhiskeys = filteredWhiskeys.filter(w => w.priceRange === userPref.preferredPriceRange);
            }
            // 간접적인 선호도 (좋아요 누른 위스키) 반영
            const likedWhiskeyProfiles = currentUser.interactionHistory.likedWhiskeys
                .map(id => dbService.getWhiskeyById(id)?.flavorProfile || [])
                .flat();
            if (likedWhiskeyProfiles.length > 0) {
                filteredWhiskeys.sort((a, b) => {
                    const aMatch = a.flavorProfile.filter(f => likedWhiskeyProfiles.includes(f)).length;
                    const bMatch = b.flavorProfile.filter(f => likedWhiskeyProfiles.includes(f)).length;
                    return bMatch - aMatch; // 매칭되는 키워드가 많은 순서대로 정렬
                });
            }
            // 싫어하는 위스키는 제외
            filteredWhiskeys = filteredWhiskeys.filter(w =>
                !currentUser.interactionHistory.dislikedWhiskeys.includes(w.id)
            );
        }

        // 최종 추천 로직: 필터링된 위스키 중 평점 높은 순으로 정렬 후 상위 3개 반환
        filteredWhiskeys.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        const finalRecommendations = filteredWhiskeys.slice(0, 3);

        if (finalRecommendations.length === 0) {
            console.warn(`[OktongService] 추천할 위스키를 찾을 수 없습니다. 쿼리: "${userQuery}"`);
            // @exception_condition 추천 알고리즘 실행 중 오류 발생 시
            throw new Error("추천 시스템 오류가 발생했습니다. 다른 질문을 해주시거나 나중에 다시 시도해주세요.");
        }

        const results: RecommendationResult[] = finalRecommendations.map(whiskey => ({
            whiskey: whiskey,
            reason: this.generateRecommendationReason(whiskey, userQuery, currentUser) // 추천 이유 생성 함수 호출
        }));

        console.log(`[OktongService] ${results.length}개의 위스키 추천됨.`);
        return results;
    }

    /**
     * @use_case 추가한 위스키 목록 확인
     * 사용자가 직접 평가하고 저장한 위스키 목록을 확인합니다.
     * @param userId 사용자 ID
     * @returns 사용자가 평가한 위스키 목록 (평가 노트 포함)
     * @nfr Performance Efficiency: 평균 2초 이내에 추가한 위스키들을 출력.
     */
    async getEvaluatedWhiskeys(userId: string): Promise<{ whiskey: Whiskey; tastingNote: TastingNote }[]> {
        console.log(`[OktongService] getEvaluatedWhiskeys 호출됨. 사용자 ID: "${userId}"`);
        const user = dbService.getUserById(userId);
        if (!user) {
            console.warn(`[OktongService] 사용자 ${userId}를 찾을 수 없습니다.`);
            throw new Error("사용자 정보를 찾을 수 없습니다.");
        }

        const evaluatedNotes = dbService.getTastingNotesByUserId(userId);
        if (evaluatedNotes.length === 0) {
            // @exception_condition 해당 위스키 평에 대한 정보를 찾을 수 없는 경우
            throw new Error("평가한 위스키가 없습니다.");
        }

        const result = evaluatedNotes.map(note => {
            const whiskey = dbService.getWhiskeyById(note.whiskeyId);
            return whiskey ? { whiskey, tastingNote: note } : null;
        }).filter(Boolean) as { whiskey: Whiskey; tastingNote: TastingNote }[];

        console.log(`[OktongService] 사용자 ${userId}의 평가 위스키 ${result.length}개 조회됨.`);
        return result;
    }

    /**
     * @use_case 최근 조회한 위스키 목록 확인
     * 사용자가 최근에 상세정보를 확인했던 위스키들을 확인합니다.
     * @param userId 사용자 ID
     * @returns 최근 조회한 위스키 목록 (시간 순서대로 정렬)
     * @nfr Performance Efficiency: 평균 2초 이내에 최근 조회 위스키들을 불러옴.
     * @nfr Reliability: 파일 저장 오류율 5% 이내 (DB 서비스에서 관리).
     */
    async getRecentlyViewedWhiskeys(userId: string): Promise<{ whiskey: Whiskey; viewedAt: number }[]> {
        console.log(`[OktongService] getRecentlyViewedWhiskeys 호출됨. 사용자 ID: "${userId}"`);
        const user = dbService.getUserById(userId);
        if (!user) {
            console.warn(`[OktongService] 사용자 ${userId}를 찾을 수 없습니다.`);
            throw new Error("사용자 정보를 찾을 수 없습니다.");
        }

        let viewedHistory = user.interactionHistory.viewedWhiskeys;
        if (viewedHistory.length === 0) {
            // @exception_condition 최근 조회한 위스키 목록이 비었을 경우
            throw new Error("최근 조회한 위스키가 없습니다.");
        }

        // 조회 기록을 시간 순서대로 정렬 (내림차순: 최신순)
        viewedHistory.sort((a, b) => b.viewedAt - a.viewedAt);

        const result = viewedHistory.map(entry => {
            const whiskey = dbService.getWhiskeyById(entry.whiskeyId);
            return whiskey ? { whiskey, viewedAt: entry.viewedAt } : null;
        }).filter(Boolean) as { whiskey: Whiskey; viewedAt: number }[];

        console.log(`[OktongService] 사용자 ${userId}의 최근 조회 위스키 ${result.length}개 조회됨.`);
        return result;
    }

    /**
     * @use_case 전체 위스키 목록 불러오기
     * 데이터베이스에 있는 모든 위스키 목록을 확인합니다.
     * @returns 모든 위스키 목록
     * @nfr Reliability: Availability 98% 이상.
     * @nfr Performance Efficiency: 평균 5초 이내에 위스키 목록들을 불러옴.
     */
    async getAllWhiskies(): Promise<Whiskey[]> {
        console.log(`[OktongService] getAllWhiskies 호출됨.`);
        const whiskies = dbService.getAllWhiskeys();
        if (whiskies.length === 0) {
            // @exception_condition 위스키 전체 목록 파일이 누락되거나 찾을 수 없는 경우
            throw new Error("위스키 데이터를 불러올 수 없습니다.");
        }
        console.log(`[OktongService] 전체 위스키 ${whiskies.length}개 조회됨.`);
        return whiskies;
    }

    /**
     * @use_case 위스키 목록 필터링 하기
     * 위스키 목록을 맛, 생산지, 종류 등으로 필터링하여 원하는 위스키 목록만 조회합니다.
     * @param whiskies 필터링할 위스키 목록 (보통 전체 목록)
     * @param filters 필터링 조건
     * @returns 필터링된 위스키 목록
     * @nfr Performance Efficiency: 평균 2초 이내에 필터링 결과를 화면에 출력.
     */
    async filterWhiskies(whiskies: Whiskey[], filters: WhiskeyFilterOptions): Promise<Whiskey[]> {
        console.log(`[OktongService] filterWhiskies 호출됨. 필터:`, filters);
        let filtered = [...whiskies]; // 원본 배열 변경 방지

        // 필터 조건 적용
        if (filters.type) {
            filtered = filtered.filter(w => w.type === filters.type);
        }
        if (filters.priceRange) {
            filtered = filtered.filter(w => w.priceRange === filters.priceRange);
        }
        if (filters.country) {
            filtered = filtered.filter(w => w.country === filters.country);
        }
        if (filters.flavorKeywords && filters.flavorKeywords.length > 0) {
            filtered = filtered.filter(w =>
                filters.flavorKeywords!.some(keyword => w.flavorProfile.includes(keyword))
            );
        }
        if (filters.minRating) {
            filtered = filtered.filter(w => (w.averageRating || 0) >= filters.minRating);
        }

        if (filtered.length === 0) {
            // @exception_condition 해당 필터링에 검출된 위스키를 찾을 수 없는 경우
            throw new Error("필터링 조건에 맞는 위스키를 찾을 수 없습니다.");
        }

        console.log(`[OktongService] 필터링된 위스키 ${filtered.length}개 반환됨.`);
        return filtered;
    }

    /**
     * @use_case 위스키 목록 정렬하기
     * 사용자가 위스키 목록을 가격, 평점, 숙성 연도 등 다양한 정렬 기준으로 정렬합니다.
     * @param whiskies 정렬할 위스키 목록
     * @param sortBy 정렬 기준
     * @param order 정렬 순서 ('asc' 오름차순, 'desc' 내림차순)
     * @returns 정렬된 위스키 목록
     * @nfr Performance Efficiency: 평균 2초 이내에 정렬된 위스키 목록을 출력.
     */
    async sortWhiskies(whiskies: Whiskey[], sortBy: WhiskeySortBy, order: SortOrder = 'asc'): Promise<Whiskey[]> {
        console.log(`[OktongService] sortWhiskies 호출됨. 기준: "${sortBy}", 순서: "${order}"`);
        const sorted = [...whiskies]; // 원본 배열 변경 방지

        sorted.sort((a, b) => {
            let valA: any, valB: any;
            switch (sortBy) {
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'price':
                    // 가격 범위를 숫자로 매핑하여 정렬 (예시)
                    const priceMap = { '저가': 1, '중가': 2, '고가': 3 };
                    valA = priceMap[a.priceRange];
                    valB = priceMap[b.priceRange];
                    break;
                case 'rating':
                    valA = a.averageRating || 0;
                    valB = b.averageRating || 0;
                    break;
                case 'age':
                    valA = a.age || 0;
                    valB = b.age || 0;
                    break;
                default:
                    return 0; // 유효하지 않은 정렬 기준
            }
            return order === 'asc' ? valA - valB : valB - valA;
        });

        if (sorted.length === 0) {
            // @exception_condition 정렬 결과가 없을 경우
            throw new Error("정렬 조건에 맞는 위스키를 찾을 수 없습니다.");
        }

        console.log(`[OktongService] 위스키 목록 정렬 완료.`);
        return sorted;
    }

    /**
     * @use_case 위스키 맛에 대한 평가 노트 작성하기
     * 사용자가 특정 위스키에 대해 평가노트를 작성하여 저장합니다.
     * @param userId 작성자 ID
     * @param whiskeyId 평가 대상 위스키 ID
     * @param rating 총점 (1-5)
     * @param reviewText 코멘트
     * @param bodyRating 바디감 평가 (0-5)
     * @param richnessRating 풍미 평가 (0-5)
     * @param smokinessRating 스모키함 평가 (0-5)
     * @param sweetnessRating 단맛 평가 (0-5)
     * @returns 생성된 평가 노트 객체
     * @nfr Performance Efficiency: 평균 1초 이내에 평가 노트를 DB에 저장.
     * @design_pattern Factory Method Pattern
     * 새로운 TastingNote 객체 생성을 캡슐화하고, 고유 ID 할당 및 DB 저장을 관리합니다.
     */
    async submitTastingNote(
        userId: string,
        whiskeyId: string,
        rating: number,
        reviewText: string,
        bodyRating: number,
        richnessRating: number,
        smokinessRating: number,
        sweetnessRating: number
    ): Promise<TastingNote> {
        console.log(`[OktongService] submitTastingNote 호출됨. 사용자 ID: "${userId}", 위스키 ID: "${whiskeyId}"`);

        const user = dbService.getUserById(userId);
        const whiskey = dbService.getWhiskeyById(whiskeyId);

        if (!user || !whiskey) {
            throw new Error("사용자 또는 위스키 정보를 찾을 수 없습니다.");
        }
        if (rating < 1 || rating > 5 || bodyRating < 0 || bodyRating > 5 || richnessRating < 0 || richnessRating > 5 || smokinessRating < 0 || smokinessRating > 5 || sweetnessRating < 0 || sweetnessRating > 5) {
            throw new Error("유효하지 않은 평가 점수입니다. 점수는 0-5 (총점은 1-5) 범위여야 합니다.");
        }

        const newNote: TastingNote = {
            id: `tn${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // 고유 ID 생성
            userId,
            whiskeyId,
            rating,
            reviewText,
            bodyRating,
            richnessRating,
            smokinessRating,
            sweetnessRating,
            createdAt: Date.now()
        };

        try {
            dbService.addTastingNote(newNote);
            console.log(`[OktongService] 평가 노트 ${newNote.id} 저장 성공.`);
            // TODO: 위스키의 averageRating 업데이트 로직 추가
            return newNote;
        } catch (error) {
            console.error(`[OktongService] 평가 노트 저장 중 오류 발생:`, error);
            // @exception_condition 평가 노트에 저장 과정중 오류 발생
            throw new Error("평가 노트를 작성할 수 없습니다. 오류가 발생하였습니다.");
        }
    }

    /**
     * @use_case 선택된 위스키와 유사한 위스키 불러오기
     * 특정 위스키를 선택한 후, 해당 위스키와 유사한 위스키를 추천받습니다.
     * @param whiskeyId 기준 위스키 ID
     * @param userId 현재 사용자 ID (개인화된 유사성 판단에 활용)
     * @returns 유사한 위스키 목록
     * @nfr Performance Efficiency: 평균 3초 이내에 선택된 위스키들과 유사한 위스키들을 화면에 출력.
     */
    async getSimilarWhiskies(whiskeyId: string, userId?: string): Promise<Whiskey[]> {
        console.log(`[OktongService] getSimilarWhiskies 호출됨. 기준 위스키 ID: "${whiskeyId}"`);
        const targetWhiskey = dbService.getWhiskeyById(whiskeyId);
        if (!targetWhiskey) {
            throw new Error("기준 위스키를 찾을 수 없습니다.");
        }

        const allWhiskies = dbService.getAllWhiskies();
        const similarWhiskies: Whiskey[] = [];

        // 간단한 유사성 계산 로직 (실제로는 더 복잡한 알고리즘 필요)
        // 맛/향 프로필, 종류, 가격대 등을 기반으로 유사성 점수 계산
        allWhiskies.forEach(whiskey => {
            if (whiskey.id === whiskeyId) return; // 자기 자신은 제외

            let similarityScore = 0;

            // 1. 맛/향 프로필 유사성
            const commonFlavors = whiskey.flavorProfile.filter(f => targetWhiskey.flavorProfile.includes(f));
            similarityScore += commonFlavors.length * 10; // 공통된 맛/향이 많을수록 높은 점수

            // 2. 종류 유사성
            if (whiskey.type === targetWhiskey.type) {
                similarityScore += 20;
            }

            // 3. 가격대 유사성
            if (whiskey.priceRange === targetWhiskey.priceRange) {
                similarityScore += 15;
            }

            // 4. 평균 평점 유사성 (차이가 작을수록 높은 점수)
            if (targetWhiskey.averageRating && whiskey.averageRating) {
                similarityScore += (5 - Math.abs(targetWhiskey.averageRating - whiskey.averageRating)) * 5;
            }

            // TODO: 사용자 선호도(userId)를 활용한 개인화된 유사성 판단 로직 추가 가능
            // 예: 사용자가 선호하는 맛/향 키워드가 유사한 위스키에 가중치 부여

            // 임계값 이상이면 유사한 위스키로 간주
            if (similarityScore > 30) { // 임계값은 조정 필요
                similarWhiskies.push(whiskey);
            }
        });

        // 유사성 점수 기준으로 정렬 (높은 점수 순)
        similarWhiskies.sort((a, b) => {
            // 이 부분은 실제 similarityScore를 저장하고 정렬해야 함
            // 현재는 간단히 필터링된 목록을 반환
            return (b.averageRating || 0) - (a.averageRating || 0); // 예시: 평점 높은 순
        });

        if (similarWhiskies.length === 0) {
            // @exception_condition 알고리즘상 유사한 위스키를 선별할 수 없는 경우
            throw new Error("유사한 위스키를 찾을 수 없습니다.");
        }

        console.log(`[OktongService] ${targetWhiskey.name}과(와) 유사한 위스키 ${similarWhiskies.length}개 조회됨.`);
        return similarWhiskies.slice(0, 3); // 상위 3개만 반환
    }

    /**
     * @use_case 위스키 상세 정보 보기
     * 특정 위스키의 상세 정보를 조회합니다.
     * @param whiskeyId 조회할 위스키의 고유 ID
     * @param userId 조회 기록을 위해 사용자 ID (옵션)
     * @returns 위스키 상세 정보 또는 null
     * @nfr Performance Efficiency: 평균 1초 이내에 해당 정보들을 출력.
     * @nfr Usability: 누락된 정보들을 "정보 없음"으로 표시.
     */
    async getWhiskeyDetails(whiskeyId: string, userId?: string): Promise<Whiskey | null> {
        console.log(`[OktongService] getWhiskeyDetails 호출됨. 위스키 ID: "${whiskeyId}"`);
        const whiskey = dbService.getWhiskeyById(whiskeyId);

        if (userId && whiskey) {
            // 최근 조회 기록 업데이트
            const user = dbService.getUserById(userId);
            if (user) {
                const updatedViewedHistory = user.interactionHistory.viewedWhiskeys
                    .filter(entry => entry.whiskeyId !== whiskeyId); // 기존 기록 제거 (최신화)
                updatedViewedHistory.push({ whiskeyId, viewedAt: Date.now() });
                dbService.updateUser(userId, {
                    interactionHistory: {
                        ...user.interactionHistory,
                        viewedWhiskeys: updatedViewedHistory
                    }
                });
                console.log(`[OktongService] 사용자 ${userId}의 위스키 ${whiskeyId} 조회 기록 업데이트됨.`);
            }
        }

        if (!whiskey) {
            // @exception_condition 선택된 특정 위스키에 대한 정보를 찾을 수 없는 경우
            console.warn(`[OktongService] 위스키 ID '${whiskeyId}'에 해당하는 정보를 찾을 수 없습니다.`);
            throw new Error("정보 없음: 해당 위스키를 찾을 수 없습니다.");
        }

        // 누락된 정보 처리 (UI에서 "정보 없음"으로 표시할 수 있도록)
        // 여기서는 Whiskey 객체 자체를 반환하므로, UI에서 속성 존재 여부로 판단
        console.log(`[OktongService] 위스키 ${whiskeyId} 상세 정보 조회됨.`);
        return whiskey;
    }

    /**
     * 위스키에 대한 추천 이유를 생성합니다.
     * 이 함수는 LLM이 직접 호출하여 상세한 이유를 생성할 수도 있고,
     * 또는 이 함수 자체를 LLM이 활용할 수 있는 도구로 제공할 수도 있습니다.
     * @param whiskey 추천된 위스키 객체
     * @param userQuery 사용자의 원래 질문
     * @param currentUser 현재 사용자 정보
     * @returns 생성된 추천 이유 문자열
     */
    private generateRecommendationReason(whiskey: Whiskey, userQuery: string, currentUser?: User): string {
        let reason = `${whiskey.name}은(는) ${whiskey.description.split('.')[0]} 특징이 있습니다.`;

        // 사용자의 쿼리에 기반한 이유 추가
        const lowerCaseQuery = userQuery.toLowerCase();
        if ((lowerCaseQuery.includes('달콤') || lowerCaseQuery.includes('과일')) && whiskey.flavorProfile.some(f => ['꿀', '바닐라', '과일', '쉐리'].includes(f))) {
            reason += ` 고객님께서 달콤하고 과일향을 선호하셔서 ${whiskey.flavorProfile.filter(f => ['꿀', '바닐라', '과일', '쉐리'].includes(f)).join(', ')}과 같은 향이 두드러지는 이 위스키를 추천합니다.`;
        }
        if ((lowerCaseQuery.includes('피트') || lowerCaseQuery.includes('스모키')) && whiskey.flavorProfile.some(f => ['피트', '스모키'].includes(f))) {
            reason += ` 강렬한 ${whiskey.flavorProfile.filter(f => ['피트', '스모키'].includes(f)).join(', ')} 향을 좋아하신다면 이 위스키는 탁월한 선택이 될 것입니다.`;
        }
        if (lowerCaseQuery.includes('입문') && (whiskey.flavorProfile.includes('부드러움') || whiskey.flavorProfile.includes('크리미'))) {
             reason += ` 위스키 입문자분들도 부담 없이 즐길 수 있는 부드러운 맛이 특징입니다.`;
        }
        if (lowerCaseQuery.includes('고가') && whiskey.priceRange === '고가') {
            reason += ` 고급 위스키를 찾으시는 고객님께 이 위스키는 훌륭한 선택이 될 것입니다.`;
        }

        // 사용자 선호도 기반 이유 추가
        if (currentUser) {
            if (currentUser.preferences.experienceLevel === '초보' && (whiskey.flavorProfile.includes('부드러움') || whiskey.flavorProfile.includes('크리미'))) {
                reason += ` 초보자분들도 쉽게 접근할 수 있는 부드러운 위스키입니다.`;
            }
            if (currentUser.preferences.flavorKeywords.some(f => whiskey.flavorProfile.includes(f))) {
                reason += ` 고객님의 선호 맛/향인 ${currentUser.preferences.flavorKeywords.filter(f => whiskey.flavorProfile.includes(f)).join(', ')}과 잘 맞습니다.`;
            }
        }

        return reason;
    }

    // --- 사용자 상호작용 기록 관련 함수 (Agentica가 직접 호출할 수도 있음) ---
    async likeWhiskey(userId: string, whiskeyId: string): Promise<boolean> {
        console.log(`[OktongService] likeWhiskey 호출됨. 사용자 ID: "${userId}", 위스키 ID: "${whiskeyId}"`);
        const user = dbService.getUserById(userId);
        if (user) {
            const updatedLikedWhiskeys = [...new Set([...user.interactionHistory.likedWhiskeys, whiskeyId])];
            const updatedDislikedWhiskeys = user.interactionHistory.dislikedWhiskeys.filter(id => id !== whiskeyId);
            dbService.updateUser(userId, {
                interactionHistory: {
                    ...user.interactionHistory,
                    likedWhiskeys: updatedLikedWhiskeys,
                    dislikedWhiskeys: updatedDislikedWhiskeys
                }
            });
            console.log(`사용자 ${userId}가 위스키 ${whiskeyId}에 '좋아요'를 표시했습니다.`);
            return true;
        }
        console.warn(`사용자 ${userId}를 찾을 수 없습니다.`);
        return false;
    }

    async dislikeWhiskey(userId: string, whiskeyId: string): Promise<boolean> {
        console.log(`[OktongService] dislikeWhiskey 호출됨. 사용자 ID: "${userId}", 위스키 ID: "${whiskeyId}"`);
        const user = dbService.getUserById(userId);
        if (user) {
            const updatedDislikedWhiskeys = [...new Set([...user.interactionHistory.dislikedWhiskeys, whiskeyId])];
            const updatedLikedWhiskeys = user.interactionHistory.likedWhiskeys.filter(id => id !== whiskeyId);
            dbService.updateUser(userId, {
                interactionHistory: {
                    ...user.interactionHistory,
                    likedWhiskeys: updatedLikedWhiskeys,
                    dislikedWhiskeys: updatedDislikedWhiskeys
                }
            });
            console.log(`사용자 ${userId}가 위스키 ${whiskeyId}에 '싫어요'를 표시했습니다.`);
            return true;
        }
        console.warn(`사용자 ${userId}를 찾을 수 없습니다.`);
        return false;
    }

    async addSearchHistory(userId: string, query: string): Promise<boolean> {
        console.log(`[OktongService] addSearchHistory 호출됨. 사용자 ID: "${userId}", 쿼리: "${query}"`);
        const user = dbService.getUserById(userId);
        if (user) {
            const updatedSearches = [...user.interactionHistory.searches, query];
            dbService.updateUser(userId, {
                interactionHistory: {
                    ...user.interactionHistory,
                    searches: updatedSearches
                }
            });
            console.log(`사용자 ${userId}가 "${query}"를 검색 기록에 추가했습니다.`);
            return true;
        }
        console.warn(`사용자 ${userId}를 찾을 수 없습니다.`);
        return false;
    }
}
