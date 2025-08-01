// src/frontend/OktongApp.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Whiskey, dbService, UserPreferences, TastingNote } from '../database/database-oktong'; // 데이터베이스 서비스 및 모델 임포트
import { WhiskeyFilterOptions, WhiskeySortBy, SortOrder } from '../services/oktong-recommendation-service';

// 추천 결과 모델 정의
interface RecommendationResult {
    whiskey: Whiskey; // 추천된 위스키 객체
    reason: string; // 추천 이유 (LLM이 생성)
}

// 로딩 스피너 컴포넌트
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-gray-700">로딩 중...</p>
    </div>
);

// 위스키 카드 컴포넌트
const WhiskeyCard: React.FC<{ whiskey: Whiskey; onClick?: (whiskeyId: string) => void; showReason?: boolean; reason?: string }> = ({ whiskey, onClick, showReason = false, reason }) => (
    <div
        className="bg-white rounded-lg shadow-md p-4 m-2 flex flex-col items-center border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={() => onClick && onClick(whiskey.id)}
    >
        <img
            src={whiskey.imageUrl || `https://placehold.co/100x150/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`}
            alt={whiskey.name}
            className="w-24 h-36 object-cover rounded-md mb-3"
            onError={(e) => {
                e.currentTarget.src = `https://placehold.co/100x150/f0f0f0/333333?text=${whiskey.name.substring(0, 5)}`;
            }}
        />
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-1">{whiskey.name}</h3>
        <p className="text-sm text-gray-600 text-center mb-2">{whiskey.type} | {whiskey.priceRange}</p>
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

// 위스키 상세 정보 모달 컴포넌트
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
            const response = await fetch('http://localhost:3001/api/tasting-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId, whiskeyId: whiskey.id, rating, reviewText,
                    bodyRating, richnessRating, smokinessRating, sweetnessRating
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '평가 노트 저장 실패');
            onTastingNoteSubmit(data.data); // 부모 컴포넌트로 새로운 평가 노트 전달
            setShowTastingNoteForm(false); // 폼 닫기
            alert('평가 노트가 성공적으로 저장되었습니다!'); // 사용자에게 알림
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
            const response = await fetch(`http://localhost:3001/api/whiskies/${whiskey.id}/similar?userId=${userId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '유사 위스키 불러오기 실패');
            setSimilarWhiskies(data.data);
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
                        <p className="text-gray-700 mb-2"><strong>가격대:</strong> {whiskey.priceRange || '정보 없음'}</p>
                        <p className="text-gray-700 mb-2"><strong>평균 평점:</strong> {whiskey.averageRating ? `${whiskey.averageRating} / 5` : '정보 없음'}</p>
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
                                <WhiskeyCard key={simWhiskey.id} whiskey={simWhiskey} onClick={onClose} /> // 유사 위스키 클릭 시 모달 닫고 다시 열도록
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// 메인 앱 컴포넌트
const OktongApp: React.FC = () => {
    const [userQuery, setUserQuery] = useState<string>(''); // 사용자 입력 쿼리
    const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]); // 추천 결과 목록
    const [loading, setLoading] = useState<boolean>(false); // 로딩 상태
    const [error, setError] = useState<string | null>(null); // 에러 메시지
    const [currentUserId, setCurrentUserId] = useState<string>('user001'); // 현재 로그인된 사용자 ID (예시)

    // UI 탭 관리
    const [activeTab, setActiveTab] = useState<'recommend' | 'preferences' | 'evaluated' | 'recent' | 'all' | 'detail'>('recommend');

    // 각 탭의 데이터 상태
    const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
    const [evaluatedWhiskies, setEvaluatedWhiskies] = useState<{ whiskey: Whiskey; tastingNote: TastingNote }[]>([]);
    const [recentViews, setRecentViews] = useState<{ whiskey: Whiskey; viewedAt: number }[]>([]);
    const [allWhiskies, setAllWhiskies] = useState<Whiskey[]>([]);
    const [filteredWhiskies, setFilteredWhiskies] = useState<Whiskey[]>([]);
    const [filterOptions, setFilterOptions] = useState<WhiskeyFilterOptions>({});
    const [sortBy, setSortBy] = useState<WhiskeySortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [detailWhiskey, setDetailWhiskey] = useState<Whiskey | null>(null);

    // 사용자 취향 입력 폼 상태
    const [bodyPref, setBodyPref] = useState(3);
    const [richnessPref, setRichnessPref] = useState(3);
    const [smokinessPref, setSmokinessPref] = useState(3);
    const [sweetnessPref, setSweetnessPref] = useState(3);
    const [pricePref, setPricePref] = useState<UserPreferences['preferredPriceRange'] | undefined>(undefined);
    const [prefSaveLoading, setPrefSaveLoading] = useState(false);
    const [prefSaveError, setPrefSaveError] = useState<string | null>(null);

    // 초기 사용자 데이터 로드 및 탭 데이터 로드
    useEffect(() => {
        const fetchUserData = async () => {
            const user = dbService.getUserById(currentUserId);
            if (user) {
                setUserPreferences(user.preferences);
                setBodyPref(user.preferences.bodyPreference);
                setRichnessPref(user.preferences.richnessPreference);
                setSmokinessPref(user.preferences.smokinessPreference);
                setSweetnessPref(user.preferences.sweetnessPreference);
                setPricePref(user.preferences.preferredPriceRange);
            }
        };
        fetchUserData();
    }, [currentUserId]);

    const fetchDataForTab = useCallback(async (tab: string) => {
        setLoading(true);
        setError(null);
        try {
            if (tab === 'evaluated') {
                const response = await fetch(`http://localhost:3001/api/user/${currentUserId}/evaluated-whiskies`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || '평가 위스키 목록 불러오기 실패');
                setEvaluatedWhiskies(data.data);
            } else if (tab === 'recent') {
                const response = await fetch(`http://localhost:3001/api/user/${currentUserId}/recent-views`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || '최근 조회 위스키 목록 불러오기 실패');
                setRecentViews(data.data);
            } else if (tab === 'all') {
                const response = await fetch('http://localhost:3001/api/whiskies');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || '전체 위스키 목록 불러오기 실패');
                setAllWhiskies(data.data);
                setFilteredWhiskies(data.data); // 초기에는 필터링되지 않은 전체 목록
            }
        } catch (err: any) {
            setError(err.message);
            console.error(`Error fetching data for tab ${tab}:`, err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        fetchDataForTab(activeTab);
    }, [activeTab, fetchDataForTab]);

    // 추천 요청 핸들러
    const handleRecommend = async () => {
        if (!userQuery.trim()) {
            setError('추천받고 싶은 내용을 입력해주세요.');
            return;
        }
        setLoading(true);
        setError(null);
        setRecommendations([]); // 이전 추천 결과 초기화

        try {
            // 백엔드 서버의 추천 API 호출 (Agentica와 통신)
            const response = await fetch('http://localhost:3001/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userQuery, userId: currentUserId })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '백엔드 API 호출 실패');
            }
            console.log("백엔드로부터 받은 Agentica 응답:", data);

            // Agentica (LLM)의 텍스트 응답을 파싱하여 구조화된 데이터로 변환
            const parsedRecommendations: RecommendationResult[] = parseAgenticaResponse(data.response);

            if (parsedRecommendations.length === 0) {
                setError('죄송합니다. 요청하신 조건에 맞는 위스키를 찾기 어렵습니다. 다른 질문을 해주시겠어요?');
            }
            setRecommendations(parsedRecommendations);

        } catch (err: any) {
            console.error('추천 요청 중 오류 발생:', err);
            setError(`위스키 추천 중 오류가 발생했습니다: ${err.message}. 잠시 후 다시 시도해주세요.`);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Agentica (LLM)의 텍스트 응답을 파싱하여 RecommendationResult[] 형태로 변환하는 함수.
     * 백엔드에서 구조화된 JSON을 넘겨주는 것이 더 효율적이지만, 여기서는 프론트에서 직접 파싱합니다.
     * LLM의 응답 형식에 따라 이 파싱 로직은 유연하게 조정되어야 합니다.
     * 현재는 "1. [이름] (ID: [ID]) - [이유]" 형식으로 가정합니다.
     */
    const parseAgenticaResponse = (llmText: string): RecommendationResult[] => {
        const lines = llmText.split('\n').filter(line => line.trim().match(/^\d+\./)); // '1.', '2.' 등으로 시작하는 줄 필터링
        const parsedResults: RecommendationResult[] = [];

        lines.forEach(line => {
            const match = line.match(/^\d+\.\s*(.+?)\s*\(ID:\s*(w\d+)\)\s*-\s*(.+)/);
            if (match) {
                const name = match[1].trim();
                const id = match[2].trim();
                const reason = match[3].trim();
                const whiskey = dbService.getWhiskeyById(id); // 클라이언트 측 DB에서 위스키 객체 가져오기 (OktongApp 내 dbService 사용)

                if (whiskey) {
                    parsedResults.push({ whiskey, reason });
                } else {
                    console.warn(`파싱된 위스키 ID '${id}'에 해당하는 위스키를 데이터베이스에서 찾을 수 없습니다.`);
                }
            }
        });
        return parsedResults;
    };

    // 위스키 취향 저장 핸들러
    const handleSavePreferences = async () => {
        setPrefSaveLoading(true);
        setPrefSaveError(null);
        try {
            const preferences: UserPreferences = {
                bodyPreference: bodyPref,
                richnessPreference: richnessPref,
                smokinessPreference: smokinessPref,
                sweetnessPreference: sweetnessPref,
                preferredPriceRange: pricePref,
                experienceLevel: userPreferences?.experienceLevel // 기존 값 유지 또는 새로 입력받기
            };
            const response = await fetch('http://localhost:3001/api/user/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, preferences })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '취향 정보 저장 실패');
            setUserPreferences(data.user.preferences);
            alert('취향 정보가 성공적으로 저장되었습니다!');
        } catch (err: any) {
            setPrefSaveError(err.message);
        } finally {
            setPrefSaveLoading(false);
        }
    };

    // 위스키 필터링 적용 핸들러
    const handleApplyFilter = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/whiskies/filter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whiskies: allWhiskies, filters: filterOptions }) // 현재 전체 목록을 필터링
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '필터링 실패');
            setFilteredWhiskies(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 위스키 정렬 적용 핸들러
    const handleApplySort = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/whiskies/sort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whiskies: filteredWhiskies, sortBy, order: sortOrder }) // 현재 필터링된 목록을 정렬
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '정렬 실패');
            setFilteredWhiskies(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 위스키 상세 정보 보기 핸들러
    const handleViewDetails = async (whiskeyId: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/whiskies/${whiskeyId}?userId=${currentUserId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '상세 정보 불러오기 실패');
            setDetailWhiskey(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 평가 노트 제출 완료 시 호출될 콜백
    const handleTastingNoteSubmitted = (newNote: TastingNote) => {
        // 평가한 위스키 목록을 다시 불러오거나, 로컬 상태를 업데이트
        fetchDataForTab('evaluated');
        // 상세 모달 닫기
        setDetailWhiskey(null);
    };

    /**
     * @design_pattern MVC Pattern + Controller (GRASP)
     * OktongApp 컴포넌트는 View와 Controller의 역할을 동시에 수행합니다.
     * 사용자 입력(View)을 받아 이벤트 핸들러(Controller)가 백엔드 API를 호출하고,
     * 백엔드로부터 받은 데이터를 상태(Model)에 반영하여 View를 업데이트합니다.
     */
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-4 font-sans text-gray-800">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8">
                <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
                    🥃 Oktong AI 위스키 추천 시스템 🥃
                </h1>

                {/* 탭 네비게이션 */}
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

                {/* 공통 로딩 및 에러 메시지 */}
                {loading && <LoadingSpinner />}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">오류!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                {/* 탭별 콘텐츠 */}
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
                                <label className="block text-gray-700 text-sm font-bold mb-1">선호 가격대:</label>
                                <select value={pricePref || ''} onChange={(e) => setPricePref(e.target.value as UserPreferences['preferredPriceRange'])}
                                    className="w-full p-2 border rounded-md">
                                    <option value="">선택 안 함</option>
                                    <option value="저가">저가 (~5만원)</option>
                                    <option value="중가">중가 (5~15만원)</option>
                                    <option value="고가">고가 (15만원~)</option>
                                </select>
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
                        <h2 className="text-2xl font-bold text-indigo-600 mb-4">전체 위스키 목록</h2>
                        {/* 필터링 및 정렬 UI */}
                        <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6">
                            <h3 className="text-xl font-semibold mb-3 text-gray-700">필터링</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">종류:</label>
                                    <select value={filterOptions.type || ''} onChange={(e) => setFilterOptions({ ...filterOptions, type: e.target.value as Whiskey['type'] })}
                                        className="w-full p-2 border rounded-md">
                                        <option value="">모두</option>
                                        <option value="싱글 몰트">싱글 몰트</option>
                                        <option value="블렌디드">블렌디드</option>
                                        <option value="버번">버번</option>
                                        <option value="라이">라이</option>
                                        <option value="기타">기타</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">가격대:</label>
                                    <select value={filterOptions.priceRange || ''} onChange={(e) => setFilterOptions({ ...filterOptions, priceRange: e.target.value as Whiskey['priceRange'] })}
                                        className="w-full p-2 border rounded-md">
                                        <option value="">모두</option>
                                        <option value="저가">저가</option>
                                        <option value="중가">중가</option>
                                        <option value="고가">고가</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">최소 평점:</label>
                                    <input type="number" min="0" max="5" value={filterOptions.minRating || ''} onChange={(e) => setFilterOptions({ ...filterOptions, minRating: parseInt(e.target.value) || undefined })}
                                        className="w-full p-2 border rounded-md" />
                                </div>
                            </div>
                            <button onClick={handleApplyFilter} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md">
                                필터 적용
                            </button>

                            <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-700">정렬</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-1">정렬 기준:</label>
                                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as WhiskeySortBy)}
                                        className="w-full p-2 border rounded-md">
                                        <option value="name">이름</option>
                                        <option value="price">가격</option>
                                        <option value="rating">평점</option>
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
                            <button onClick={handleApplySort} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md">
                                정렬 적용
                            </button>
                        </div>

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

                {/* 위스키 상세 정보 모달 */}
                <WhiskeyDetailModal
                    whiskey={detailWhiskey}
                    onClose={() => setDetailWhiskey(null)}
                    userId={currentUserId}
                    onTastingNoteSubmit={handleTastingNoteSubmitted}
                />

                {/* 현재 사용자 ID 표시 (디버깅/정보용) */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    현재 사용자 ID: <span className="font-mono">{currentUserId}</span>
                </div>
            </div>
        </div>
    );
};

export default OktongApp;
