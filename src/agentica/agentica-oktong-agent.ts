// src/agentica/agentica-oktong-agent.ts

// Agentica 라이브러리 임포트 (실제 설치 필요)
// import { Agentica } from "@agentica/core";
// import OpenAI from "openai"; // LLM 벤더 (뤼튼 AI 모델로 대체 가능)
// import typia from "typia"; // TypeScript 타입 기반 함수 스키마 생성

// Oktong 추천 서비스 임포트
import { OktongRecommendationService } from '../services/oktong-recommendation-service';
// 데이터베이스 서비스 임포트 (필요하다면)
import { dbService } from '../database/database-oktong';

// --- Agentica 및 OpenAI 라이브러리 목(Mock) 객체 ---
// 실제 Agentica 프로젝트에서는 이 부분을 실제 라이브러리 import로 대체하세요.
// 이 목 객체는 Agentica의 동작 방식을 시뮬레이션하기 위한 것입니다.
// 실제 LLM의 함수 호출 동작을 시뮬레이션하기 위해 더 복잡한 로직이 필요할 수 있습니다.
const Agentica = class {
    private service: OktongRecommendationService;

    constructor(config: any) {
        console.log("[Mock Agentica] Agentica 초기화:", config);
        this.service = config.controllers[0].instance; // 첫 번째 컨트롤러가 OktongService라고 가정
    }
    async conversate(query: string, options?: any): Promise<string> {
        console.log(`[Mock Agentica] 대화 시작: "${query}", 옵션:`, options);
        const userId = options?.userId || 'anonymous';

        try {
            // --- LLM의 함수 호출 시뮬레이션 ---
            // 실제 Agentica는 여기서 LLM을 호출하고, LLM이 query를 분석하여 적절한 함수를 선택합니다.
            // 여기서는 query에 따라 OktongRecommendationService의 특정 함수를 직접 호출하여 시뮬레이션합니다.

            if (query.includes('추천') || query.includes('위스키 찾아줘')) {
                // recommendWhiskeys 함수 호출 시뮬레이션
                const recommendations = await this.service.recommendWhiskeys(query, userId);
                if (recommendations.length > 0) {
                    let responseText = "고객님께 다음 위스키들을 추천합니다:\n";
                    recommendations.forEach((rec, index) => {
                        responseText += `${index + 1}. ${rec.whiskey.name} (ID: ${rec.whiskey.id}) - ${rec.reason}\n`;
                    });
                    return responseText;
                } else {
                    return "죄송합니다. 요청하신 조건에 맞는 위스키를 찾기 어렵습니다. 다른 질문을 해주시겠어요?";
                }
            } else if (query.includes('상세 정보') || query.includes('자세히 알려줘')) {
                // getWhiskeyDetails 함수 호출 시뮬레이션 (간단한 ID 추출)
                const match = query.match(/ID:\s*(w\d+)/);
                if (match) {
                    const whiskeyId = match[1];
                    const details = await this.service.getWhiskeyDetails(whiskeyId, userId);
                    if (details) {
                        return `${details.name}의 상세 정보: ${details.description} (가격대: ${details.priceRange}, 맛/향: ${details.flavorProfile.join(', ')})`;
                    } else {
                        return `위스키 ID '${whiskeyId}'에 대한 정보를 찾을 수 없습니다.`;
                    }
                }
                return "어떤 위스키의 상세 정보를 원하시나요? 위스키 ID를 포함하여 다시 질문해주세요.";
            } else if (query.includes('유사한 위스키')) {
                // getSimilarWhiskies 함수 호출 시뮬레이션
                const match = query.match(/ID:\s*(w\d+)/);
                if (match) {
                    const whiskeyId = match[1];
                    const similar = await this.service.getSimilarWhiskies(whiskeyId, userId);
                    if (similar.length > 0) {
                        return `${dbService.getWhiskeyById(whiskeyId)?.name}과(와) 유사한 위스키는 다음과 같습니다: ${similar.map(w => w.name).join(', ')}.`;
                    } else {
                        return `죄송합니다. ${dbService.getWhiskeyById(whiskeyId)?.name}과(와) 유사한 위스키를 찾을 수 없습니다.`;
                    }
                }
                return "어떤 위스키와 유사한 위스키를 찾으시나요? 위스키 ID를 포함하여 다시 질문해주세요.";
            } else if (query.includes('취향 입력') || query.includes('선호도 저장')) {
                // saveUserPreferences 함수 호출 시뮬레이션 (간단한 파싱)
                // 실제 LLM은 여기서 userQuery를 파싱하여 preferences 객체를 구성할 것입니다.
                const mockPreferences = {
                    bodyPreference: 3, richnessPreference: 4, smokinessPreference: 2, sweetnessPreference: 4,
                    preferredPriceRange: '중가', experienceLevel: '중급'
                };
                await this.service.saveUserPreferences(userId, mockPreferences);
                return `고객님의 취향 정보가 성공적으로 저장되었습니다.`;
            } else if (query.includes('평가 노트 작성')) {
                // submitTastingNote 함수 호출 시뮬레이션 (간단한 파싱)
                // 실제 LLM은 여기서 userQuery를 파싱하여 모든 인자를 구성할 것입니다.
                const mockNote = await this.service.submitTastingNote(userId, 'w001', 4, '적당히 피트하고 부드럽네요.', 4, 3, 4, 2);
                return `위스키 ${dbService.getWhiskeyById(mockNote.whiskeyId)?.name}에 대한 평가 노트가 성공적으로 작성되었습니다.`;
            }
            // ... 다른 함수 호출 시뮬레이션 추가

            return "어떤 위스키 정보를 원하시는지 정확히 알려주세요."; // 기본 응답
        } catch (error: any) {
            console.error("[Mock Agentica] 함수 호출 시뮬레이션 중 오류 발생:", error);
            return `오류가 발생했습니다: ${error.message}. 다시 시도해주세요.`;
        }
    }
};

const OpenAI = class {
    constructor(config: any) { console.log("[Mock OpenAI] OpenAI API 초기화:", config); }
    // 실제 OpenAI API 호출 로직은 여기에 포함됩니다.
};

const typia = {
    llm: {
        controller: (name: string, instance: any) => {
            console.log(`[Mock typia] LLM 컨트롤러 등록: "${name}"`);
            // 실제 typia는 여기서 instance의 메소드들을 LLM 호출 가능한 스키마로 변환합니다.
            return { name, instance };
        }
    }
};
// --- 목(Mock) 객체 끝 ---


// 뤼튼 AI API 키 (환경 변수에서 로드하는 것이 보안상 좋음)
// 실제 Agentica 설정 시 이 키를 사용합니다.
const WRITEN_AI_API_KEY = ""; // 실제 뤼튼 AI 또는 OpenAI API 키로 교체하세요.

/**
 * @design_pattern Singleton Pattern
 * Oktong AI 에이전트 자체도 시스템 내에서 단일 인스턴스로 관리될 수 있습니다.
 */
export const oktongAgent = new Agentica({
  vendor: {
    // 뤼튼 AI 모델을 직접 연동하는 방식에 따라 설정 변경
    // Agentica가 뤼튼 AI를 직접 지원한다면 해당 설정 사용
    api: new OpenAI({ apiKey: WRITEN_AI_API_KEY }), // OpenAI API 키 사용 예시
    model: "gpt-4o-mini", // 사용하려는 LLM 모델명 (뤼튼 AI 모델명으로 대체 가능)
  },
  controllers: [
    // OktongRecommendationService의 메소드들을 LLM이 호출할 수 있는 함수로 등록
    // typia를 사용하여 TypeScript 클래스를 기반으로 자동으로 스키마를 생성합니다.
    typia.llm.controller<OktongRecommendationService, "chatgpt">(
      "oktongWhiskeyService", // LLM이 이 함수들을 참조할 때 사용할 이름
      new OktongRecommendationService(), // Oktong 추천 서비스 인스턴스
    ),
    // 만약 다른 외부 API(예: 위스키 이미지 CDN, 외부 리뷰 API)를 Agentica에 연결하고 싶다면
    // assertHttpController 등을 사용하여 추가할 수 있습니다.
  ],
});

// 에이전트와 대화 시작 예시 함수 (백엔드에서 호출될 것임)
export async function runOktongAgentConversation(userQuery: string, userId: string): Promise<string> {
    console.log(`[Agentica Runner] 사용자 쿼리: "${userQuery}", 사용자 ID: "${userId}"`);
    // Agentica의 conversate 메소드를 호출하여 LLM 기반 대화를 시작합니다.
    // LLM은 userQuery를 분석하여 'oktongWhiskeyService' 컨트롤러의 적절한 함수를 호출할 것입니다.
    const response = await oktongAgent.conversate(userQuery, { userId });
    return response;
}
