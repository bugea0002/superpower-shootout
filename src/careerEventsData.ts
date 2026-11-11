import {
  CalendarEntry,
  CareerSaveData,
  LeagueTeam,
  StoryEvent,
  StoryEventOption,
} from './careerTypes';
import { getDivisionTeams } from './careerData';

/**
 * 20+ FM-Style Dynamic Story Events Catalog
 * 4 Categories: Newspaper (5), Press Conference (5), Smartphone (5), Manager Meeting (5)
 */
export const STORY_EVENTS_CATALOG: StoryEvent[] = [
  // =========================================================================
  // 1. 📰 NEWSPAPER EVENTS (스포츠 일보 1면 특종)
  // =========================================================================
  {
    id: 'news_debut_wonder',
    type: 'newspaper',
    titleKo: '특종: 신성 탄생! 전 세계 스카우트 촉각',
    senderOrAuthor: '스포츠 일보 축구 전문기자',
    headline: '세계를 뒤흔든 슈퍼 루키의 번개 같은 활약!',
    bodyTextKo: '지난 경기에서 보여준 비상식적인 궤적의 초능력 플레이에 전 세계 빅클럽 스카우터들이 경악을 금치 못하고 있다. "인간의 피지컬을 아득히 초월했다"는 극찬 속에 차세대 발롱도르 후보로 급부상했다.',
    options: [
      {
        textKo: '"이건 시작일 뿐입니다. 세계 정상을 향해 달립니다."',
        descKo: '당당한 포부! [언론 관심 +15, 팬덤 지지 +10, 감독 신임 -5]',
        effectTrust: -5,
        effectFans: 10,
        effectMedia: 15,
        buff: { id: 'media_hype', nameKo: '언론의 스포트라이트', type: 'power', value: 8, matchesLeft: 2 },
      },
      {
        textKo: '"모든 공은 동료들과 감독님의 전술 덕분입니다."',
        descKo: '겸손한 모범 인터뷰! [감독 신임 +15, 팬덤 지지 +8, 언론 관심 -5]',
        effectTrust: 15,
        effectFans: 8,
        effectMedia: -5,
        effectTP: 20,
      },
      {
        textKo: '"기사 신경 쓸 시간 없습니다. 훈련이나 하겠습니다."',
        descKo: '묵묵한 연습벌레! [감독 신임 +10, 팬덤 지지 +5, TP +30]',
        effectTrust: 10,
        effectFans: 5,
        effectMedia: -10,
        effectTP: 30,
      },
    ],
  },
  {
    id: 'news_midnight_training',
    type: 'newspaper',
    titleKo: '심야 비밀 훈련 단독 포착',
    senderOrAuthor: '풋볼 레이더 탐사취재팀',
    headline: '자정의 그라운드를 불태우는 고독한 초능력자!',
    bodyTextKo: '모두가 잠든 야심한 시각, 클럽하우스 조명을 켜고 수백 번의 프리킥과 다이빙 훈련을 반복하는 모습이 사진에 찍혔다. "타고난 재능에 광기 어린 노력까지 더해졌다"며 팬들의 찬사가 쏟아지고 있다.',
    options: [
      {
        textKo: '"완벽해질 때까지 멈추지 않는 것이 제 신념입니다."',
        descKo: '팬들의 찬사! [팬덤 지지 +15, 감독 신임 +10, TP +25]',
        effectTrust: 10,
        effectFans: 15,
        effectMedia: 8,
        effectTP: 25,
      },
      {
        textKo: '"몰래 찍지 마세요. 개인 훈련에 방해됩니다."',
        descKo: '단호한 프라이버시 수호! [언론 관심 -12, 감독 신임 +5]',
        effectTrust: 5,
        effectFans: -5,
        effectMedia: -12,
      },
      {
        textKo: '"몸 관리가 최우선인데... 앞으로는 자제하겠습니다."',
        descKo: '감독의 부상 걱정 해소! [감독 신임 +12, 팬덤 지지 +5]',
        effectTrust: 12,
        effectFans: 5,
        effectMedia: 0,
        effectGold: 100,
      },
    ],
  },
  {
    id: 'news_transfer_rumor',
    type: 'newspaper',
    titleKo: '빅클럽 이적료 1,000억 원설 폭발',
    senderOrAuthor: '글로벌 축구 이적시장 특파원',
    headline: '디비전 1 명문 구단들, 거액의 바이아웃 지불 준비!',
    bodyTextKo: '디비전 1 갓즈 챔피언십 소속 유수의 명문 구단들이 에이전트 측에 백지수표를 내밀었다는 이적설이 보도되었다. 현 소속팀 팬들은 "절대 이적 불가"를 외치며 클럽하우스 앞에서 서명 운동을 시작했다.',
    options: [
      {
        textKo: '"현재 팀에서 리그 우승 트로피를 드는 것이 제 첫 번째 목표입니다."',
        descKo: '구단 충성 선언! [팬덤 지지 +20, 감독 신임 +15, 언론 관심 -5]',
        effectTrust: 15,
        effectFans: 20,
        effectMedia: -5,
        buff: { id: 'loyal_spirit', nameKo: '구단의 심장', type: 'start_mana', value: 25, matchesLeft: 3 },
      },
      {
        textKo: '"축구 선수로서 더 큰 무대에 도전하고 싶은 것은 당연합니다."',
        descKo: '야망 표출! [언론 관심 +20, 팬덤 지지 -12, 감독 신임 -10]',
        effectTrust: -10,
        effectFans: -12,
        effectMedia: 20,
        effectGold: 300,
      },
      {
        textKo: '"이적 문제는 시즌이 끝난 뒤 에이전트와 이야기하겠습니다."',
        descKo: '신중한 태도 유지! [언론 관심 +8, 감독 신임 +5]',
        effectTrust: 5,
        effectFans: 0,
        effectMedia: 8,
      },
    ],
  },
  {
    id: 'news_celebration_debate',
    type: 'newspaper',
    titleKo: '논란의 골 세리머니에 엇갈린 축구계 여론',
    senderOrAuthor: '스포츠 평론가 칼럼',
    headline: '도발인가 쇼맨십인가? [이름]의 파격 세리머니 화제!',
    bodyTextKo: '골을 넣은 직후 상대 서포터즈 앞에서의 도발적인 호우(SIU) 세리머니와 쉿(SHHH) 포즈가 축구계의 뜨거운 감자로 떠올랐다. 보수적인 원로들은 "무례하다"고 비판하지만, 젊은 팬들은 열광하고 있다.',
    options: [
      {
        textKo: '"축구는 엔터테인먼트입니다. 팬들을 위해 계속할 겁니다!"',
        descKo: '악동 스타의 탄생! [팬덤 지지 +18, 언론 관심 +15, 감독 신임 -8]',
        effectTrust: -8,
        effectFans: 18,
        effectMedia: 15,
        buff: { id: 'showman', nameKo: '쇼맨십 오라', type: 'power', value: 6, matchesLeft: 2 },
      },
      {
        textKo: '"순간적으로 너무 기뻤습니다. 상대 팬분들께 사과드립니다."',
        descKo: '품격 있는 사과! [감독 신임 +12, 팬덤 지지 -5, 언론 관심 -5]',
        effectTrust: 12,
        effectFans: -5,
        effectMedia: -5,
      },
      {
        textKo: '"다음엔 더 충격적인 세리머니를 준비해 두었습니다."',
        descKo: '어그로 폭발! [언론 관심 +25, 팬덤 지지 +10, 감독 신임 -15]',
        effectTrust: -15,
        effectFans: 10,
        effectMedia: 25,
        effectGold: 200,
      },
    ],
  },
  {
    id: 'news_physics_analysis',
    type: 'newspaper',
    titleKo: '물리학자가 분석한 마구의 정체',
    senderOrAuthor: '사이언스 & 스포츠 연구소',
    headline: '마그누스 효과를 정면으로 부정하는 기적의 궤적 왜곡!',
    bodyTextKo: '저명한 공기역학 교수가 발표한 논문에 따르면, [이름] 선수의 초능력 킥은 비행 중간에 중력과 공기저항을 무시하고 방향을 바꾼다고 한다. "이것은 축구가 아니라 마법이다"라며 과학계마저 경탄하고 있다.',
    options: [
      {
        textKo: '"마법이 아닙니다. 매일 쏟아부은 땀방울의 결과입니다."',
        descKo: '노력의 가치 입증! [감독 신임 +15, 팬덤 지지 +12, TP +35]',
        effectTrust: 15,
        effectFans: 12,
        effectMedia: 5,
        effectTP: 35,
      },
      {
        textKo: '"아직 제 진짜 궤적의 50%도 보여주지 않았습니다."',
        descKo: '미스터리 초능력자! [언론 관심 +20, 팬덤 지지 +8]',
        effectTrust: 0,
        effectFans: 8,
        effectMedia: 20,
        buff: { id: 'gravity_warp', nameKo: '염동력 공명', type: 'sweetspot', value: 10, matchesLeft: 2 },
      },
      {
        textKo: '"재밌는 분석이네요. 다음 경기에서도 증명해 보이겠습니다."',
        descKo: '쿨한 승부사! [언론 관심 +10, 팬덤 지지 +10]',
        effectTrust: 5,
        effectFans: 10,
        effectMedia: 10,
      },
    ],
  },

  // =========================================================================
  // 2. 🎙️ PRESS CONFERENCE EVENTS (기자회견 프레스룸)
  // =========================================================================
  {
    id: 'press_rival_derby',
    type: 'press_conference',
    titleKo: '라이벌 더비 매치 직전 공식 기자회견',
    senderOrAuthor: '디비전 공식 프레스센터',
    headline: '일촉즉발! 라이벌전의 승자는 누구인가?',
    bodyTextKo: '기자: "상대 팀 에이스가 어제 인터뷰에서 [이름] 선수의 초능력은 3부 리그 수준에 불과하다고 도발했습니다. 이에 대해 어떻게 응수하시겠습니까?"',
    options: [
      {
        textKo: '"입으로 축구하는 사람에겐 그라운드에서 실력으로 입을 다물게 해주죠."',
        descKo: '화끈한 맞불 도발! [언론 관심 +20, 팬덤 지지 +15, 감독 신임 -5]',
        effectTrust: -5,
        effectFans: 15,
        effectMedia: 20,
        buff: { id: 'rival_fire', nameKo: '더비의 전의', type: 'power', value: 10, matchesLeft: 1 },
      },
      {
        textKo: '"신경 쓰지 않습니다. 우리는 오직 승점 3점만을 바라보고 있습니다."',
        descKo: '프로페셔널한 냉정함! [감독 신임 +15, 팬덤 지지 +8, 언론 관심 -5]',
        effectTrust: 15,
        effectFans: 8,
        effectMedia: -5,
        effectTP: 20,
      },
      {
        textKo: '"훌륭한 선수이니만큼, 내일 멋진 승부를 펼쳐보고 싶습니다."',
        descKo: '대인배의 품격! [감독 신임 +10, 팬덤 지지 +12, 언론 관심 +5]',
        effectTrust: 10,
        effectFans: 12,
        effectMedia: 5,
      },
    ],
  },
  {
    id: 'press_clean_sheet',
    type: 'press_conference',
    titleKo: '연속 경기 무실점 행진 기자회견',
    senderOrAuthor: '유러피언 스포츠 채널',
    headline: '철벽의 거미손! 인간 장벽의 비결은?',
    bodyTextKo: '기자: "최근 상대의 어떤 초능력 슛도 완벽하게 쳐내며 클린시트 행진을 이어가고 있습니다. 상대 키커들의 심리를 완전히 꿰뚫어 보고 계신가요?"',
    options: [
      {
        textKo: '"키커의 눈빛과 근육의 미세한 떨림만 봐도 어디로 찰지 다 보입니다."',
        descKo: '압도적인 위압감! [언론 관심 +18, 팬덤 지지 +12]',
        effectTrust: 5,
        effectFans: 12,
        effectMedia: 18,
        buff: { id: 'mind_reader', nameKo: '심리전 지배', type: 'reach', value: 12, matchesLeft: 2 },
      },
      {
        textKo: '"수비수들이 온몸을 던져 각도를 좁혀주기 때문에 가능한 일입니다."',
        descKo: '동료를 챙기는 참된 리더! [감독 신임 +20, 팬덤 지지 +15, TP +25]',
        effectTrust: 20,
        effectFans: 15,
        effectMedia: 5,
        effectTP: 25,
      },
      {
        textKo: '"기록은 언젠가 깨집니다. 매 경기 무실점에 집착하지 않고 평정심을 유지합니다."',
        descKo: '도인의 침착성! [감독 신임 +15, 팬덤 지지 +10]',
        effectTrust: 15,
        effectFans: 10,
        effectMedia: 0,
      },
    ],
  },
  {
    id: 'press_after_defeat',
    type: 'press_conference',
    titleKo: '뼈아픈 패배 직후의 패장 기자회견',
    senderOrAuthor: '일간 스포츠 데스크',
    headline: '연승 행진 마감! 위기인가 재도약의 발판인가?',
    bodyTextKo: '기자: "오늘 패배로 팀 분위기가 가라앉았습니다. 특히 마지막 승부차기 실축에 대한 팬들의 실망이 큽니다. 선수 본인의 책임이 가장 크다고 생각하십니까?"',
    options: [
      {
        textKo: '"제 책임입니다. 저를 비난하시고 팀 동료들은 감싸주십시오."',
        descKo: '모든 책임을 짊어지는 품격! [감독 신임 +20, 팬덤 지지 +18, 언론 관심 +10]',
        effectTrust: 20,
        effectFans: 18,
        effectMedia: 10,
        buff: { id: 'redemption', nameKo: '설욕의 투혼', type: 'start_mana', value: 30, matchesLeft: 2 },
      },
      {
        textKo: '"심판의 판정에 동의하기 힘든 부분이 많았습니다."',
        descKo: '판정 불복 항의! [언론 관심 +20, 감독 신임 -12, 팬덤 지지 -5, 벌금 -150G]',
        effectTrust: -12,
        effectFans: -5,
        effectMedia: 20,
        effectGold: -150,
      },
      {
        textKo: '"패배에서 배운 점이 더 많습니다. 다음 경기에서 반드시 증명하겠습니다."',
        descKo: '빠른 멘탈 수습! [감독 신임 +12, 팬덤 지지 +10, TP +20]',
        effectTrust: 12,
        effectFans: 10,
        effectMedia: 0,
        effectTP: 20,
      },
    ],
  },
  {
    id: 'press_national_callup',
    type: 'press_conference',
    titleKo: '초능력 국가대표 승선 가능성',
    senderOrAuthor: '국가대표 전담 기자단',
    headline: '태극마크를 달고 세계 대회로 나아갈 자격!',
    bodyTextKo: '기자: "국가대표 감독이 지난 경기 관중석에서 [이름] 선수를 유심히 지켜봤습니다. 다가오는 월드 토너먼트 대표팀 발탁에 대해 어떻게 기대하고 계십니까?"',
    options: [
      {
        textKo: '"국가를 대표해 뛰는 것은 모든 축구 선수의 가장 위대한 꿈입니다."',
        descKo: '전 국민적 열광! [팬덤 지지 +20, 감독 신임 +10, 언론 관심 +15]',
        effectTrust: 10,
        effectFans: 20,
        effectMedia: 15,
        effectGold: 200,
      },
      {
        textKo: '"지금은 소속팀의 리그 우승 외에는 아무것도 생각하지 않습니다."',
        descKo: '클럽에 헌신하는 에이스! [감독 신임 +20, 팬덤 지지 +10, 언론 관심 -5]',
        effectTrust: 20,
        effectFans: 10,
        effectMedia: -5,
        effectTP: 25,
      },
      {
        textKo: '"대표팀에서도 제가 주전이어야 마땅하다고 봅니다."',
        descKo: '자신감 폭발! [언론 관심 +25, 팬덤 지지 +5, 감독 신임 -5]',
        effectTrust: -5,
        effectFans: 5,
        effectMedia: 25,
      },
    ],
  },
  {
    id: 'press_sponsor_launch',
    type: 'press_conference',
    titleKo: '글로벌 스포츠 브랜드 공식 엠버서더 위촉식',
    senderOrAuthor: '메가 스포츠 엔터테인먼트',
    headline: '초대형 스폰서 계약 체결! [이름] 시그니처 축구화 발표!',
    bodyTextKo: '기자: "업계 최고 대우의 스폰서 계약을 맺으셨습니다. 이번 시그니처 장비 개발에 직접 참여하셨다고 들었는데, 경기력에 어떤 영향을 줄까요?"',
    options: [
      {
        textKo: '"제 초능력 킥의 에너지 반동을 200% 흡수해 주는 완벽한 장비입니다."',
        descKo: '스폰서 대만족! [골드 +400G, 언론 관심 +15, 팬덤 지지 +8]',
        effectTrust: 0,
        effectFans: 8,
        effectMedia: 15,
        effectGold: 400,
      },
      {
        textKo: '"상금과 수익금의 절반은 유소년 축구 발전 기금으로 기부하겠습니다."',
        descKo: '기부 천사의 면모! [팬덤 지지 +25, 감독 신임 +15, 언론 관심 +20]',
        effectTrust: 15,
        effectFans: 25,
        effectMedia: 20,
        effectGold: 100,
      },
      {
        textKo: '"장비보다 중요한 건 차는 사람의 발끝입니다."',
        descKo: '장인 정신! [감독 신임 +15, 팬덤 지지 +12, TP +30]',
        effectTrust: 15,
        effectFans: 12,
        effectMedia: 5,
        effectTP: 30,
      },
    ],
  },

  // =========================================================================
  // 3. 📱 SMARTPHONE MESSAGES (스마트폰 DM / 메신저)
  // =========================================================================
  {
    id: 'phone_party_invite',
    type: 'smartphone',
    titleKo: '팀 동료의 비밀 야간 e스포츠 파티 초대',
    senderOrAuthor: '동료 선수 (카톡)',
    bodyTextKo: '"야! 오늘 밤 우리 집에서 밤샘 게임 파티할 건데 올래? 피자랑 치킨 왕창 시켜놨음 ㅋㅋ 감독님한테는 비밀인 거 알지? 딱 오늘 하루만 스트레스 풀자!"',
    options: [
      {
        textKo: '"좋아! 오늘 밤은 제대로 불태워보자고! 당장 갈게!"',
        descKo: '화끈한 일탈! [팀 친밀도 UP, 팬덤 지지 +8, 감독 신임 -12, 체력 소모]',
        effectTrust: -12,
        effectFans: 8,
        effectMedia: 5,
        buff: { id: 'party_hangover', nameKo: '숙취와 피로', type: 'start_mana', value: -15, matchesLeft: 1 },
      },
      {
        textKo: '"마음은 고맙지만 내일 훈련 있어서 난 쉴게. 재밌게 놀아!"',
        descKo: '철저한 자기관리! [감독 신임 +15, 팬덤 지지 +5, TP +20]',
        effectTrust: 15,
        effectFans: 5,
        effectMedia: 0,
        effectTP: 20,
      },
      {
        textKo: '"너희들 이번 주 경기 중요하잖아? 일찍 자라. 감독님한테 이른다?"',
        descKo: '팀의 군기반장! [감독 신임 +18, 팬덤 지지 -5, 언론 관심 0]',
        effectTrust: 18,
        effectFans: -5,
        effectMedia: 0,
      },
    ],
  },
  {
    id: 'phone_prototype_gear',
    type: 'smartphone',
    titleKo: '의문의 연구소에서 온 시제품 테스트 제안',
    senderOrAuthor: '사이버 랩 연구소장 (DM)',
    bodyTextKo: '"안녕하십니까 [이름] 선수. 귀하의 놀라운 마나 방출 데이터를 연구 중인 연구소입니다. 마나 회복을 폭발적으로 촉진시키는 나노 크리스탈 프로토타입 장비를 테스트해주시면 500G를 즉시 입금해 드리겠습니다."',
    options: [
      {
        textKo: '"좋습니다. 시제품 장비 당장 보내주세요. 테스트해보겠습니다."',
        descKo: '위험한 실험 참가! [골드 +500G, 언론 관심 +15, 부작용 위험]',
        effectTrust: -8,
        effectFans: 5,
        effectMedia: 15,
        effectGold: 500,
        buff: { id: 'nano_crystal', nameKo: '나노 크리스탈 촉매', type: 'power', value: 12, matchesLeft: 2 },
      },
      {
        textKo: '"공인되지 않은 비인가 장비는 착용하지 않습니다."',
        descKo: '원칙주의자! [감독 신임 +15, 팬덤 지지 +10, TP +20]',
        effectTrust: 15,
        effectFans: 10,
        effectMedia: -5,
        effectTP: 20,
      },
      {
        textKo: '"구단 메디컬 팀의 승인을 먼저 받고 오십시오."',
        descKo: '공식 절차 요구! [감독 신임 +12, 언론 관심 +5]',
        effectTrust: 12,
        effectFans: 5,
        effectMedia: 5,
      },
    ],
  },
  {
    id: 'phone_fan_gift',
    type: 'smartphone',
    titleKo: '열성 팬클럽 회장의 진심 어린 DM',
    senderOrAuthor: '팬클럽 회장 [축구바라기]',
    bodyTextKo: '"선수님! 지난 경기 세이브 보면서 온 가족이 감동해서 눈물 흘렸어요 ㅠㅠ 클럽하우스 경비실에 선수님 맞춤 건강 보약과 손편지 전달해두었습니다. 항상 응원해요!"',
    options: [
      {
        textKo: '"소중한 선물 정말 감사합니다! 사진 찍어서 SNS에 올릴게요!"',
        descKo: '특급 팬 서비스! [팬덤 지지 +25, 언론 관심 +12]',
        effectTrust: 5,
        effectFans: 25,
        effectMedia: 12,
        buff: { id: 'fan_love', nameKo: '팬들의 사랑', type: 'start_mana', value: 20, matchesLeft: 2 },
      },
      {
        textKo: '"마음만 감사히 받겠습니다. 팬분들의 응원이 제 가장 큰 힘입니다."',
        descKo: '마음만 받는 성숙함! [팬덤 지지 +18, 감독 신임 +10]',
        effectTrust: 10,
        effectFans: 18,
        effectMedia: 5,
      },
      {
        textKo: '"팬분들을 위해 다음 경기에서 직접 사인 유니폼을 선물하겠습니다."',
        descKo: '팬 역조공 이벤트! [팬덤 지지 +30, 골드 -100G]',
        effectTrust: 5,
        effectFans: 30,
        effectMedia: 15,
        effectGold: -100,
      },
    ],
  },
  {
    id: 'phone_family_cheer',
    type: 'smartphone',
    titleKo: '어머니의 따뜻한 모바일 메시지',
    senderOrAuthor: '어머니 (문자)',
    bodyTextKo: '"아들(딸)아, TV에서 네가 힘차게 달리는 모습 보면서 엄마 아빠는 가슴이 벅찼단다. 밥은 잘 챙겨 먹고 다니는지... 다치지만 말고 건강하게 즐기렴. 사랑한다."',
    options: [
      {
        textKo: '"엄마, 걱정 마세요! 이번 주 경기에서 꼭 골 넣고 부모님께 바칠게요!"',
        descKo: '부모님을 향한 맹세! [팬덤 지지 +15, 멘탈 각성 버프]',
        effectTrust: 8,
        effectFans: 15,
        effectMedia: 5,
        buff: { id: 'family_power', nameKo: '가족의 축복', type: 'sweetspot', value: 8, matchesLeft: 3 },
      },
      {
        textKo: '"첫 월급에서 부모님 용돈 200G 부쳐드렸어요. 맛있는 거 사드세요!"',
        descKo: '효도 플렉스! [골드 -200G, 팬덤 지지 +15, 감독 신임 +10]',
        effectTrust: 10,
        effectFans: 15,
        effectMedia: 8,
        effectGold: -200,
      },
      {
        textKo: '"네 엄마, 주말에 시간 내서 집에 들를게요. 건강하세요!"',
        descKo: '마음의 안정! [감독 신임 +10, TP +20]',
        effectTrust: 10,
        effectFans: 10,
        effectMedia: 0,
        effectTP: 20,
      },
    ],
  },
  {
    id: 'phone_rival_trash_talk',
    type: 'smartphone',
    titleKo: '익명의 라이벌 선수가 보낸 도발 톡',
    senderOrAuthor: '익명의 라이벌 (SNS DM)',
    bodyTextKo: '"야, 다음 경기 각오해라. 네 어설픈 초능력 슛은 내 글러브에 다 잡힌다. 경기 끝나고 울면서 라커룸 들어갈 준비나 해둬라 ㅋㅋ"',
    options: [
      {
        textKo: '"네 골망이나 찢어지지 않게 테이프 칭칭 감고 나와라."',
        descKo: '시원한 사이다 응수! [언론 관심 +15, 팬덤 지지 +12, 투혼 버프]',
        effectTrust: -5,
        effectFans: 12,
        effectMedia: 15,
        buff: { id: 'spite_power', nameKo: '도발에 맞선 독기', type: 'power', value: 10, matchesLeft: 1 },
      },
      {
        textKo: '"(차단 및 캡처 후 구단 사무국에 신고)"',
        descKo: '냉철한 합의금 처리! [감독 신임 +15, 언론 관심 +10, 골드 +150G]',
        effectTrust: 15,
        effectFans: 8,
        effectMedia: 10,
        effectGold: 150,
      },
      {
        textKo: '"ㅋㅋㅋ 응 경기장에서 보자."',
        descKo: '읽씹급 여유! [감독 신임 +10, 팬덤 지지 +10]',
        effectTrust: 10,
        effectFans: 10,
        effectMedia: 5,
      },
    ],
  },

  // =========================================================================
  // 4. 👔 MANAGER'S OFFICE (감독실 1:1 면담)
  // =========================================================================
  {
    id: 'manager_tactics_review',
    type: 'manager_meeting',
    titleKo: '감독실 전술 포지션 적응도 점검',
    senderOrAuthor: '총감독 마르코스',
    bodyTextKo: '"자네를 부른 이유는 다름이 아니네. 최근 경기에서 보여준 초능력 활용은 훌륭하지만, 팀 전술과의 조화에 대해 어떻게 느끼고 있나? 개인플레이에 치중한다는 지적이 있네만."',
    options: [
      {
        textKo: '"감독님의 전술 지시를 100% 이행하고 팀 승리를 최우선으로 하겠습니다."',
        descKo: '감독의 절대 신임! [감독 신임 +25, 언론 관심 -5, TP +25]',
        effectTrust: 25,
        effectFans: 5,
        effectMedia: -5,
        effectTP: 25,
      },
      {
        textKo: '"승부처에서는 때로 천재적인 개인 능력이 팀을 구한다고 믿습니다."',
        descKo: '뚝심 있는 에이스! [언론 관심 +18, 팬덤 지지 +12, 감독 신임 -10]',
        effectTrust: -10,
        effectFans: 12,
        effectMedia: 18,
        buff: { id: 'maverick', nameKo: '야생의 승부사', type: 'power', value: 8, matchesLeft: 2 },
      },
      {
        textKo: '"전술 훈련 시간을 두 배로 늘려 부족한 점을 보완하겠습니다."',
        descKo: '성실한 개선 의지! [감독 신임 +18, TP +35]',
        effectTrust: 18,
        effectFans: 8,
        effectMedia: 0,
        effectTP: 35,
      },
    ],
  },
  {
    id: 'manager_captain_armband',
    type: 'manager_meeting',
    titleKo: '주장 완장 수여 및 팀의 리더십 요구',
    senderOrAuthor: '총감독 마르코스',
    bodyTextKo: '"다가오는 후반기 일정에서 자네에게 우리 팀의 주장 완장을 맡기고 싶네. 자네의 강한 멘탈과 초능력이 어린 선수들에게 큰 귀감이 되고 있어. 이 무거운 책임을 짊어질 수 있겠나?"',
    options: [
      {
        textKo: '"영광입니다 감독님! 팀을 하나로 묶어 반드시 우승컵을 들어 올리겠습니다."',
        descKo: '주장의 품격! [감독 신임 +25, 팬덤 지지 +25, 주장 버프]',
        effectTrust: 25,
        effectFans: 25,
        effectMedia: 15,
        buff: { id: 'captain_aura', nameKo: '캡틴의 통솔력', type: 'start_mana', value: 35, matchesLeft: 4 },
      },
      {
        textKo: '"지금은 제 플레이에 집중하고 싶습니다. 주장은 고참 선배님께 양보하겠습니다."',
        descKo: '부담 거절 및 실리 선택! [감독 신임 +5, TP +30]',
        effectTrust: 5,
        effectFans: 5,
        effectMedia: -5,
        effectTP: 30,
      },
      {
        textKo: '"주장이 된다면 라커룸 분위기는 제가 확실히 잡겠습니다."',
        descKo: '강력한 카리스마! [감독 신임 +15, 팬덤 지지 +15, 언론 관심 +10]',
        effectTrust: 15,
        effectFans: 15,
        effectMedia: 10,
      },
    ],
  },
  {
    id: 'manager_attitude_warning',
    type: 'manager_meeting',
    titleKo: '최근 훈련 태도에 대한 엄중한 경고',
    senderOrAuthor: '총감독 마르코스',
    bodyTextKo: '"지난 훈련에서 자네가 보여준 불성실한 태도에 대해 짚고 넘어가야겠네. 팬들의 환호에 취해 기본을 잊는 선수는 아무리 초능력이 뛰어나도 벤치로 보낼 걸세. 어떻게 생각하나?"',
    options: [
      {
        textKo: '"죄송합니다 감독님. 깊이 반성하고 초심으로 돌아가 훈련하겠습니다."',
        descKo: '진심 어린 반성! [감독 신임 +15, 팬덤 지지 +5, 성숙함 획득]',
        effectTrust: 15,
        effectFans: 5,
        effectMedia: -5,
      },
      {
        textKo: '"몸 상태가 좋지 않았을 뿐입니다. 경기에서 실력으로 보여드리겠습니다."',
        descKo: '자존심 대립! [언론 관심 +10, 감독 신임 -15]',
        effectTrust: -15,
        effectFans: 5,
        effectMedia: 10,
      },
      {
        textKo: '"선수단 전체에 사과하고 운동장 50바퀴를 돌겠습니다."',
        descKo: '체벌 자처 및 체력 단련! [감독 신임 +20, TP +40]',
        effectTrust: 20,
        effectFans: 10,
        effectMedia: 0,
        effectTP: 40,
      },
    ],
  },
  {
    id: 'manager_bonus_offer',
    type: 'manager_meeting',
    titleKo: '구단주의 특별 승리 수당 제안',
    senderOrAuthor: '구단주 대행 & 감독',
    bodyTextKo: '"다음 경기는 구단 존립이 걸린 중요한 스폰서십 매치일세. 자네가 해트트릭이나 무실점 선방을 해낸다면 구단주께서 특별 격려금 500G를 약속하셨네. 자신 있는가?"',
    options: [
      {
        textKo: '"맡겨만 주십시오. 상대 팀 골망을 완전히 초토화시키겠습니다!"',
        descKo: '수당 약속 수락! [골드 +500G 계약, 언론 관심 +15, 승부욕]',
        effectTrust: 10,
        effectFans: 12,
        effectMedia: 15,
        effectGold: 500,
        buff: { id: 'bonus_hunter', nameKo: '현상금 사냥꾼', type: 'power', value: 10, matchesLeft: 1 },
      },
      {
        textKo: '"돈 때문이 아니라 구단과 팬들의 자존심을 위해 싸우겠습니다."',
        descKo: '진정한 축구 로맨티스트! [감독 신임 +25, 팬덤 지지 +25]',
        effectTrust: 25,
        effectFans: 25,
        effectMedia: 10,
        effectTP: 30,
      },
      {
        textKo: '"수당보다는 다음 시즌 연봉 협상에서 좋은 대우를 부탁드립니다."',
        descKo: '현실적인 협상가! [골드 +250G, 언론 관심 +10]',
        effectTrust: 5,
        effectFans: 0,
        effectMedia: 10,
        effectGold: 250,
      },
    ],
  },
  {
    id: 'manager_champions_speech',
    type: 'manager_meeting',
    titleKo: '초능력 챔피언스 리그 결승전 출사표',
    senderOrAuthor: '총감독 마르코스',
    bodyTextKo: '"드디어 여기까지 왔네. 내일이면 세계 최고의 무대, 챔피언스 컵 결승전이야. 자네가 처음 입단했을 때의 그 눈빛이 아직도 생생하네. 자네는 이제 세계 최강의 선수일세. 마지막으로 하고 싶은 말이 있나?"',
    options: [
      {
        textKo: '"감독님과 함께여서 여기까지 올 수 있었습니다. 반드시 트로피를 안겨드리겠습니다."',
        descKo: '사제지간의 감동! [감독 신임 +30, 전 능력치 풀파워 각성]',
        effectTrust: 30,
        effectFans: 30,
        effectMedia: 25,
        buff: { id: 'champion_spirit', nameKo: '빅 이어를 향한 의지', type: 'power', value: 15, matchesLeft: 2 },
      },
      {
        textKo: '"내일 밤, 전 세계가 제 발끝에 무릎 꿇게 될 겁니다."',
        descKo: '새로운 시대의 황제! [언론 관심 +30, 팬덤 지지 +25]',
        effectTrust: 10,
        effectFans: 25,
        effectMedia: 30,
        buff: { id: 'emperor_aura', nameKo: '황제의 위압감', type: 'sweetspot', value: 12, matchesLeft: 2 },
      },
      {
        textKo: '"말은 필요 없습니다. 경기 휘슬이 울리면 증명하겠습니다."',
        descKo: '승부사의 침묵! [감독 신임 +20, TP +50]',
        effectTrust: 20,
        effectFans: 20,
        effectMedia: 15,
        effectTP: 50,
      },
    ],
  },
];

/**
 * Generate 34-Week Bundesliga Format Calendar
 * - 28 League matches
 * - 6 Champions Cup knockout/group matches (Week 6, 12, 18, 24, 29, 34)
 */
export function generateSeasonCalendar(
  division: number,
  divisionTeams: LeagueTeam[]
): CalendarEntry[] {
  const calendar: CalendarEntry[] = [];
  const opponents = divisionTeams.filter((t) => !t.isPlayerTeam);
  const oppCount = Math.max(1, opponents.length);

  // Champions match weeks
  const championsWeeks: Record<number, { stage: CalendarEntry['stage']; name: string }> = {
    6: { stage: 'champions_group', name: '🌟 챔피언스 컵 조별리그 1차전' },
    12: { stage: 'champions_group', name: '🌟 챔피언스 컵 조별리그 2차전' },
    18: { stage: 'champions_group', name: '🌟 챔피언스 컵 조별리그 3차전' },
    24: { stage: 'champions_ko', name: '🏆 챔피언스 컵 8강전 (QUARTER)' },
    29: { stage: 'champions_ko', name: '🏆 챔피언스 컵 4강 준결승 (SEMI)' },
    34: { stage: 'champions_final', name: '👑 챔피언스 컵 결승전 (FINAL)' },
  };

  for (let week = 1; week <= 34; week++) {
    if (championsWeeks[week]) {
      const champ = championsWeeks[week];
      // Pick elite opponent for champions cup
      const opp = opponents[(week * 3) % oppCount];
      calendar.push({
        week,
        type: 'champions',
        stage: champ.stage,
        stageNameKo: champ.name,
        opponentTeamId: opp ? opp.id : 'gods_olympus',
        played: false,
      });
    } else {
      // Regular Bundesliga League Match
      const opp = opponents[(week - 1) % oppCount];
      calendar.push({
        week,
        type: 'league',
        stage: 'league',
        stageNameKo: `정규 분데스리가 제${week}라운드`,
        opponentTeamId: opp ? opp.id : 'street_united',
        played: false,
      });
    }
  }

  return calendar;
}

/**
 * Draw a random story event based on player condition and division
 */
export function getRandomStoryEvent(save: CareerSaveData): StoryEvent {
  const eligibleEvents = STORY_EVENTS_CATALOG.filter((e) => {
    if (e.divisionMin && save.division > e.divisionMin) return false;
    return true;
  });

  const pickIdx = Math.floor(Math.random() * eligibleEvents.length);
  return eligibleEvents[pickIdx];
}

/**
 * Apply player's choice on a story event:
 * - Update reputation (managerTrust, fanSupport, mediaHype) clamped to 0..100
 * - Add/deduct Gold & TP
 * - Set active match buff
 */
export function applyStoryEventOption(
  save: CareerSaveData,
  option: StoryEventOption
): { messageKo: string; trustDelta: number; fansDelta: number; mediaDelta: number } {
  // 1. Reputation update
  save.reputation.managerTrust = Math.max(0, Math.min(100, save.reputation.managerTrust + option.effectTrust));
  save.reputation.fanSupport = Math.max(0, Math.min(100, save.reputation.fanSupport + option.effectFans));
  save.reputation.mediaHype = Math.max(0, Math.min(100, save.reputation.mediaHype + option.effectMedia));

  // 2. Economy update
  if (option.effectGold) {
    save.gold = Math.max(0, save.gold + option.effectGold);
  }
  if (option.effectTP) {
    save.trainingPoints = Math.max(0, save.trainingPoints + option.effectTP);
  }

  // 3. Buff update
  if (option.buff) {
    save.activeBuff = option.buff;
  }

  const trustStr = option.effectTrust >= 0 ? `+${option.effectTrust}%` : `${option.effectTrust}%`;
  const fansStr = option.effectFans >= 0 ? `+${option.effectFans}%` : `${option.effectFans}%`;
  const mediaStr = option.effectMedia >= 0 ? `+${option.effectMedia}%` : `${option.effectMedia}%`;

  const msg = `선택 완료! [감독 신임 ${trustStr} | 팬덤 ${fansStr} | 언론 ${mediaStr}]`;
  return {
    messageKo: msg,
    trustDelta: option.effectTrust,
    fansDelta: option.effectFans,
    mediaDelta: option.effectMedia,
  };
}
