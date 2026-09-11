export type Quiz = { id: string; scene: string; word: string; question: string; choices: readonly string[]; answer: number; explanation: string; source: string };
const slang = "https://www.abc.net.au/education/learn-english/learn-english-aussie-slang/7289548";
const shortened = "https://www.abc.net.au/education/learn-english/learn-english-australian-slang/7350598";

// Original Korean questions; word meanings checked against ABC Education on 2026-09-11.
// Keep this v1 sequence stable so the same Sydney date selects the same question.
export const dailyQuizzes: readonly Quiz[] = [
  { id: "arvo", scene: "친구가 약속 시간을 보냈어요", word: "arvo", question: "이 말이 가리키는 시간은?", choices: ["이른 아침", "오후", "한밤중"], answer: 1, explanation: "오후를 짧게 부르는 말이에요. 이제 약속에 아침부터 나갈 일은 없겠죠!", source: slang },
  { id: "mozzie", scene: "캠핑 중 친구가 팔을 긁적여요", word: "mozzie", question: "친구를 괴롭힌 작은 손님은?", choices: ["모기", "도마뱀", "파리"], answer: 0, explanation: "모기를 뜻해요. 귀여운 별명과 달리 반갑지는 않은 손님이네요.", source: shortened },
  { id: "servo", scene: "드라이브하다 잠깐 들르자는 곳", word: "servo", question: "어디로 가는 걸까요?", choices: ["우체국", "서핑숍", "주유소"], answer: 2, explanation: "주유소를 줄여 부르는 말이에요. 차도 잠깐 에너지를 채울 시간이군요.", source: slang },
  { id: "uni", scene: "새 친구가 어디 다니냐고 묻네요", word: "uni", question: "이 말은 무엇을 줄인 걸까요?", choices: ["대학교", "유니폼", "노동조합"], answer: 0, explanation: "대학교를 가리키는 줄임말이에요. 학교 얘기였지, 옷 얘기는 아니었어요.", source: shortened },
  { id: "brekkie", scene: "잠에서 깨자마자 받은 초대", word: "brekkie", question: "무엇을 같이 하자는 걸까요?", choices: ["잠깐 휴식", "아침 식사", "저녁 산책"], answer: 1, explanation: "아침 식사를 뜻해요. 일단 먹고 나면 오늘 계획도 조금 더 잘 세워질 거예요.", source: slang },
  { id: "tassie", scene: "친구가 이번 휴가 목적지를 말해요", word: "Tassie", question: "어느 곳의 별명일까요?", choices: ["태즈메이니아", "타운즈빌", "타히티"], answer: 0, explanation: "호주의 태즈메이니아를 친근하게 줄여 부르는 이름이에요.", source: shortened },
  { id: "barbie", scene: "주말에 뒷마당으로 놀러 오라는 친구", word: "barbie", question: "어떤 모임을 준비할까요?", choices: ["인형 전시", "이발 모임", "바비큐"], answer: 2, explanation: "이 상황에서는 바비큐예요. 인형을 챙겨 가기 전에 알아서 다행이죠!", source: slang },
  { id: "tradies", scene: "옆집에서 공사가 한창이에요", word: "tradies", question: "보통 어떤 사람들을 말할까요?", choices: ["관광객", "목수·배관공 같은 기술직 종사자", "주식 투자자"], answer: 1, explanation: "건축·설비 등 기술직에 종사하는 사람들을 가리켜요. 주변 상황과 함께 들으면 쉬워져요.", source: shortened },
  { id: "sunnies", scene: "눈부신 날, 나가기 전 챙기는 것", word: "sunnies", question: "가방에 무엇을 넣을까요?", choices: ["선글라스", "운동화", "도시락"], answer: 0, explanation: "선글라스를 뜻해요. 햇살 좋은 날의 작은 외출 준비물이지요.", source: slang },
  { id: "lippie", scene: "친구가 파우치 안을 찾고 있어요", word: "lippie", question: "무엇을 찾는 걸까요?", choices: ["이어폰", "립스틱", "동전 지갑"], answer: 1, explanation: "립스틱을 짧게 부르는 말이에요. 파우치 속 물건에도 별명이 있네요.", source: shortened },
  { id: "mates", scene: "주말에 같이 만날 사람들이래요", word: "mates", question: "누구를 말하는 걸까요?", choices: ["심판들", "집주인들", "친구들"], answer: 2, explanation: "친구들을 뜻해요. 특정 성별만 가리키는 말은 아니에요.", source: slang },
  { id: "rellies", scene: "명절에 잔뜩 모인 사람들이에요", word: "rellies", question: "이 사람들과의 관계는?", choices: ["직장 동료", "친척", "새 이웃"], answer: 1, explanation: "친척을 친근하게 줄여 부르는 말이에요. 이름을 외울 사람이 많아지겠네요.", source: shortened },
  { id: "doco", scene: "친구가 오늘 밤 같이 보자는 것", word: "doco", question: "어떤 종류의 영상일까요?", choices: ["다큐멘터리", "뮤직비디오", "날씨 예보"], answer: 0, explanation: "다큐멘터리를 뜻해요. 오늘은 소파에서 새로운 세상을 구경하는 날이네요.", source: slang },
  { id: "trackie-daks", scene: "집에서 편하게 입는 옷을 골라요", word: "trackie daks", question: "어떤 옷일까요?", choices: ["정장 재킷", "수영복", "트레이닝 바지"], answer: 2, explanation: "편한 트레이닝 바지를 가리켜요. 오늘의 드레스 코드는 편안함이네요.", source: shortened },
];

export type CharacterId = "kangaroo" | "koala" | "parrot" | "penguin";
export const characters: Record<CharacterId, { name: string; emoji: string; title: string; line: string; description: string; mission: string; color: string }> = {
  kangaroo: { name: "캥거루 탐험가", emoji: "🦘", title: "일단, 한 정거장 더!", line: "지도 밖 작은 발견에 마음이 뛰는 사람", description: "낯선 골목도 새로운 주말 코스가 되는 당신. 계획에 없던 풍경이 오늘의 하이라이트가 될지도 몰라요.", mission: "다음 산책에서는 익숙한 길에서 한 번만 다른 방향으로 걸어보기.", color: "#f5d6b6" },
  koala: { name: "코알라 여유파", emoji: "🐨", title: "좋은 자리는 오래 앉아야지.", line: "잘 쉬는 것도 오늘의 멋진 일정", description: "햇살 좋은 자리와 내 속도를 소중히 여기는 당신. 특별한 계획이 없어도 하루를 꽤 기분 좋게 만들어요.", mission: "좋아하는 음료 한 잔과 함께, 휴대폰 없이 5분 쉬어보기.", color: "#d8e8cf" },
  parrot: { name: "앵무새 분위기 메이커", emoji: "🦜", title: "같이 하면 더 재밌잖아!", line: "인사 한마디로 동네가 조금 더 가까워져요", description: "맛있는 발견도 웃긴 실수도 누군가와 나누고 싶은 당신. 평범한 하루에 작은 에피소드를 더하는 편이에요.", mission: "친구에게 오늘 있었던 사소하지만 웃긴 일 하나 보내보기.", color: "#f2d4dd" },
  penguin: { name: "펭귄 계획왕", emoji: "🐧", title: "놀 준비도 야무지게 끝!", line: "작은 준비가 큰 마음의 여유가 되는 사람", description: "출발 전 경로와 준비물을 한번 살피는 당신. 챙길 것을 정리해 두면, 그다음부터 더 편하게 즐길 수 있어요.", mission: "이번 주에 해보고 싶은 작은 일 하나를 달력에 적어보기.", color: "#d0e4ed" },
};

export const characterQuestions: readonly { question: string; options: readonly { text: string; character: CharacterId }[] }[] = [
  { question: "약속 없는 토요일. 가장 끌리는 건?", options: [
    { text: "처음 보는 동네로 훌쩍 나가보기", character: "kangaroo" }, { text: "햇살 좋은 자리에 느긋하게 앉기", character: "koala" }, { text: "친구에게 ‘오늘 뭐 해?’ 보내기", character: "parrot" }, { text: "가보고 싶던 곳의 동선 짜보기", character: "penguin" },
  ] },
  { question: "새 동네에 도착했어요. 먼저 하는 일은?", options: [
    { text: "마트·교통·카페 위치부터 저장", character: "penguin" }, { text: "눈길이 가는 골목부터 산책", character: "kangaroo" }, { text: "편하게 쉴 내 자리 찾기", character: "koala" }, { text: "주변 사람에게 동네 추천 받기", character: "parrot" },
  ] },
  { question: "친구가 내 여행 사진첩을 본다면?", options: [
    { text: "사람들 표정과 웃긴 순간이 잔뜩", character: "parrot" }, { text: "코스별로 차곡차곡 정리되어 있음", character: "penguin" }, { text: "우연히 발견한 풍경이 대부분", character: "kangaroo" }, { text: "음료, 구름, 편안했던 순간들", character: "koala" },
  ] },
  { question: "가려던 카페가 닫았네요. 그다음은?", options: [
    { text: "가까운 벤치에서 잠깐 쉬어도 좋아", character: "koala" }, { text: "친구와 다른 곳을 같이 골라보기", character: "parrot" }, { text: "저장해 둔 두 번째 후보로 이동", character: "penguin" }, { text: "오히려 좋아! 처음 보는 가게로", character: "kangaroo" },
  ] },
  { question: "오늘 하루에 붙이고 싶은 이름은?", options: [
    { text: "작지만 새로운 모험", character: "kangaroo" }, { text: "나를 잘 쉬게 해준 하루", character: "koala" }, { text: "같이 웃어서 더 좋았던 날", character: "parrot" }, { text: "하고 싶던 걸 하나 해낸 날", character: "penguin" },
  ] },
];
