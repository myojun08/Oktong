// src/backend/oktong-backend.ts

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // 프론트엔드와 다른 도메인에서 실행될 경우 CORS 필요
import dotenv from 'dotenv'; // 환경 변수 로드
dotenv.config();

// Agentica 에이전트 및 Oktong 서비스 임포트
import { runOktongAgentConversation } from '../agentica/agentica-oktong-agent';
import { OktongRecommendationService, WhiskeyFilterOptions, WhiskeySortBy, SortOrder } from '../services/oktong-recommendation-service';
import { dbService, UserPreferences } from '../database/database-oktong'; // dbService 직접 사용

const app = express();
const port = process.env.PORT || 3001; // 백엔드 서버 포트

// 미들웨어 설정
app.use(cors()); // 모든 도메인에서의 요청 허용 (개발용. 실제 운영 시에는 특정 도메인만 허용하도록 설정)
app.use(bodyParser.json()); // JSON 요청 본문 파싱

// Oktong 서비스 인스턴스 (Agentica를 거치지 않고 직접 호출될 수 있는 기능용)
const oktongService = new OktongRecommendationService();

// --- API 엔드포인트 ---

/**
 * @use_case 위스키 취향 데이터 입력
 * 사용자의 취향 선호도를 저장합니다.
 */
app.post('/api/user/preferences', async (req, res) => {
    const { userId, preferences } = req.body as { userId: string; preferences: UserPreferences };
    if (!userId || !preferences) {
        return res.status(400).json({ error: '사용자 ID와 선호도 정보는 필수입니다.' });
    }
    try {
        const updatedUser = await oktongService.saveUserPreferences(userId, preferences);
        res.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error('[Backend] 취향 정보 저장 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '취향 정보 저장 실패' });
    }
});

/**
 * @use_case 위스키 추천받기
 * Agentica 에이전트를 통해 LLM 기반 위스키 추천을 수행합니다.
 */
app.post('/api/recommend', async (req, res) => {
    const { userQuery, userId } = req.body as { userQuery: string; userId?: string };
    if (!userQuery) {
        return res.status(400).json({ error: 'userQuery는 필수입니다.' });
    }
    try {
        console.log(`[Backend] 추천 요청 수신: 쿼리="${userQuery}", 사용자 ID="${userId}"`);
        // Agentica 에이전트의 대화 함수 호출
        const agentResponseText = await runOktongAgentConversation(userQuery, userId || 'anonymous');
        res.json({ success: true, response: agentResponseText });
    } catch (error: any) {
        console.error('[Backend] 추천 요청 처리 중 오류 발생:', error);
        res.status(500).json({ success: false, error: error.message || '서버 오류로 추천을 가져올 수 없습니다.' });
    }
});

/**
 * @use_case 추가한 위스키 목록 확인
 * 사용자가 평가한 위스키 목록을 조회합니다.
 */
app.get('/api/user/:userId/evaluated-whiskies', async (req, res) => {
    const { userId } = req.params;
    try {
        const evaluatedWhiskies = await oktongService.getEvaluatedWhiskeys(userId);
        res.json({ success: true, data: evaluatedWhiskies });
    } catch (error: any) {
        console.error('[Backend] 평가 위스키 조회 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '평가 위스키 목록 조회 실패' });
    }
});

/**
 * @use_case 최근 조회한 위스키 목록 확인
 * 사용자가 최근 조회한 위스키 목록을 조회합니다.
 */
app.get('/api/user/:userId/recent-views', async (req, res) => {
    const { userId } = req.params;
    try {
        const recentViews = await oktongService.getRecentlyViewedWhiskeys(userId);
        res.json({ success: true, data: recentViews });
    } catch (error: any) {
        console.error('[Backend] 최근 조회 위스키 조회 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '최근 조회 위스키 목록 조회 실패' });
    }
});

/**
 * @use_case 전체 위스키 목록 불러오기
 * 모든 위스키 목록을 조회합니다.
 */
app.get('/api/whiskies', async (req, res) => {
    try {
        const allWhiskies = await oktongService.getAllWhiskies();
        res.json({ success: true, data: allWhiskies });
    } catch (error: any) {
        console.error('[Backend] 전체 위스키 목록 조회 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '위스키 데이터를 불러올 수 없습니다.' });
    }
});

/**
 * @use_case 위스키 목록 필터링 하기
 * 위스키 목록을 필터링합니다.
 */
app.post('/api/whiskies/filter', async (req, res) => {
    const { whiskies, filters } = req.body as { whiskies: any[]; filters: WhiskeyFilterOptions }; // whiskies는 클라이언트에서 전달받거나, 여기서 getAllWhiskies 호출
    try {
        // 여기서는 클라이언트가 전체 목록을 보내준다고 가정. 실제로는 백엔드에서 getAllWhiskies() 호출 후 필터링
        const allWhiskies = await oktongService.getAllWhiskies(); // 서버에서 전체 목록을 가져와 필터링
        const filteredWhiskies = await oktongService.filterWhiskies(allWhiskies, filters);
        res.json({ success: true, data: filteredWhiskies });
    } catch (error: any) {
        console.error('[Backend] 위스키 필터링 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '위스키 필터링 실패' });
    }
});

/**
 * @use_case 위스키 목록 정렬하기
 * 위스키 목록을 정렬합니다.
 */
app.post('/api/whiskies/sort', async (req, res) => {
    const { whiskies, sortBy, order } = req.body as { whiskies: any[]; sortBy: WhiskeySortBy; order?: SortOrder }; // whiskies는 클라이언트에서 전달받거나, 여기서 getAllWhiskies 호출
    try {
        // 여기서는 클라이언트가 목록을 보내준다고 가정. 실제로는 백엔드에서 getAllWhiskies() 호출 후 정렬
        const allWhiskies = await oktongService.getAllWhiskies(); // 서버에서 전체 목록을 가져와 정렬
        const sortedWhiskies = await oktongService.sortWhiskies(allWhiskies, sortBy, order);
        res.json({ success: true, data: sortedWhiskies });
    } catch (error: any) {
        console.error('[Backend] 위스키 정렬 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '위스키 정렬 실패' });
    }
});

/**
 * @use_case 위스키 맛에 대한 평가 노트 작성하기
 * 사용자가 특정 위스키에 대한 평가 노트를 작성합니다.
 */
app.post('/api/tasting-notes', async (req, res) => {
    const { userId, whiskeyId, rating, reviewText, bodyRating, richnessRating, smokinessRating, sweetnessRating } = req.body;
    if (!userId || !whiskeyId || rating === undefined || reviewText === undefined || bodyRating === undefined || richnessRating === undefined || smokinessRating === undefined || sweetnessRating === undefined) {
        return res.status(400).json({ error: '모든 평가 항목을 입력해주세요.' });
    }
    try {
        const newNote = await oktongService.submitTastingNote(userId, whiskeyId, rating, reviewText, bodyRating, richnessRating, smokinessRating, sweetnessRating);
        res.json({ success: true, data: newNote });
    } catch (error: any) {
        console.error('[Backend] 평가 노트 작성 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '평가 노트 작성 실패' });
    }
});

/**
 * @use_case 선택된 위스키와 유사한 위스키 불러오기
 * 특정 위스키와 유사한 위스키를 추천합니다.
 */
app.get('/api/whiskies/:whiskeyId/similar', async (req, res) => {
    const { whiskeyId } = req.params;
    const userId = req.query.userId as string | undefined; // 쿼리 파라미터로 userId 받기
    try {
        const similarWhiskies = await oktongService.getSimilarWhiskies(whiskeyId, userId);
        res.json({ success: true, data: similarWhiskies });
    } catch (error: any) {
        console.error('[Backend] 유사 위스키 조회 중 오류:', error);
        res.status(500).json({ success: false, error: error.message || '유사 위스키 조회 실패' });
    }
});

/**
 * @use_case 위스키 상세 정보 보기
 * 특정 위스키의 상세 정보를 조회합니다. (조회 기록 업데이트 포함)
 */
app.get('/api/whiskies/:whiskeyId', async (req, res) => {
    const { whiskeyId } = req.params;
    const userId = req.query.userId as string | undefined; // 쿼리 파라미터로 userId 받기
    try {
        const whiskeyDetails = await oktongService.getWhiskeyDetails(whiskeyId, userId);
        res.json({ success: true, data: whiskeyDetails });
    } catch (error: any) {
        console.error('[Backend] 위스키 상세 정보 조회 중 오류:', error);
        res.status(404).json({ success: false, error: error.message || '위스키 정보를 찾을 수 없습니다.' });
    }
});


// 서버 시작
app.listen(port, () => {
    console.log(`Oktong 백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
