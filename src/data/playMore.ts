import { dailyQuizzes } from "@/data/playground";

// Meanings and sources come from the already reviewed quiz catalogue.
export const wordPuzzles = ["arvo", "servo", "mozzie", "brekkie", "sunnies", "tassie"].map(id => {
  const quiz = dailyQuizzes.find(question => question.id === id)!;
  return { id, word: quiz.word.toUpperCase(), meaning: quiz.choices[quiz.answer], explanation: quiz.explanation, source: quiz.source };
});

export type BalanceChoice = { emoji: string; title: string; detail: string; reaction: string };
export const balanceRounds: readonly { topic: string; question: string; choices: readonly [BalanceChoice, BalanceChoice] }[] = [
  { topic: "내 방의 풍경", question: "집 조건이 딱 두 가지라면?", choices: [
    { emoji: "🌊", title: "매일 바다 뷰", detail: "대신 집까지 계단 다섯 층", reaction: "뷰 한 번 보고, 숨 한 번 고르고. 오늘도 올라갈 이유는 충분하네요." },
    { emoji: "🌳", title: "초록 마당 있는 1층", detail: "대신 바다는 사진으로 감상", reaction: "맨발로 마당에 나가는 순간, 이미 내 작은 휴양지예요." },
  ] },
  { topic: "출근길", question: "월요일 아침의 나는?", choices: [
    { emoji: "⛴️", title: "풍경 좋은 페리 30분", detail: "매일 잠깐 여행하는 기분", reaction: "출근길 사진이 여행 사진보다 많아질지도 몰라요." },
    { emoji: "👟", title: "익숙한 골목 도보 10분", detail: "그만큼 아침잠은 더 길게", reaction: "알람을 늦출 수 있는 20분. 월요일에는 꽤 큰 선물이죠." },
  ] },
  { topic: "주말 브런치", question: "둘 중 하나만 일주일 내내 먹는다면?", choices: [
    { emoji: "🥑", title: "아보카도 토스트", detail: "매일 바삭하고 초록초록하게", reaction: "일주일 뒤엔 토스트 굽기 정도까지 취향이 생길 것 같아요." },
    { emoji: "🥧", title: "따끈한 미트파이", detail: "매일 한 손에 작은 행복", reaction: "오늘의 고민은 해결! 파이 부스러기만 잘 챙기면 되겠어요." },
  ] },
  { topic: "여행 사진", question: "여행 끝에 남는 사진은?", choices: [
    { emoji: "🌅", title: "인생 석양 사진 딱 한 장", detail: "나머지는 눈으로만 기억", reaction: "사진첩 첫 장에 오래 머물게 될 한 장이네요." },
    { emoji: "😆", title: "친구들과 웃긴 사진 백 장", detail: "멋진 풍경은 살짝 흔들림", reaction: "한 장씩 넘길 때마다 단체 채팅방이 시끄러워지겠어요." },
  ] },
  { topic: "집 앞 카페", question: "단골 카페에 하나만 생긴다면?", choices: [
    { emoji: "☕", title: "내 취향을 외운 바리스타", detail: "앉을 자리는 가끔 없음", reaction: "들어가자마자 ‘평소대로?’라는 말, 괜히 반갑죠." },
    { emoji: "🪑", title: "언제나 비어 있는 창가 자리", detail: "주문은 매번 처음부터", reaction: "창가에 가방을 내려놓는 것까지가 나만의 주말 의식이에요." },
  ] },
  { topic: "주말 초능력", question: "하나만 가질 수 있는 능력!", choices: [
    { emoji: "🧺", title: "피크닉 돗자리가 절대 안 날아감", detail: "바람이 불어도 자리 사수", reaction: "친구들 사이에서 ‘돗자리 담당’으로 영원히 임명될지도요." },
    { emoji: "🍟", title: "갈매기가 내 간식을 절대 안 노림", detail: "마지막 감자튀김까지 평화롭게", reaction: "해변에서 이렇게 천천히 먹어도 된다니. 작지만 강한 능력이네요." },
  ] },
  { topic: "동물 친구", question: "상상 속 이웃으로 누가 좋을까요?", choices: [
    { emoji: "🐨", title: "항상 쉬어가라고 하는 코알라", detail: "같이 있으면 일정이 느긋해짐", reaction: "오늘 할 일 목록에 ‘아무것도 안 하기’가 하나 추가됐어요." },
    { emoji: "🦘", title: "자꾸 산책 가자는 캥거루", detail: "같이 있으면 동네 길을 외움", reaction: "집 앞만 돌자더니, 오늘도 새로운 골목을 발견하겠네요." },
  ] },
  { topic: "하루의 마무리", question: "오늘 저녁의 완벽한 엔딩은?", choices: [
    { emoji: "🎲", title: "친구들과 끝나지 않는 보드게임", detail: "‘마지막 한 판’만 세 번째", reaction: "끝나지 않는 건 게임일까요, 수다일까요? 아무튼 한 판 더요." },
    { emoji: "🛋️", title: "소파와 담요, 혼자만의 시간", detail: "오늘의 단체 대화는 여기까지", reaction: "담요를 덮는 순간 오늘의 외출 모드가 조용히 꺼졌어요." },
  ] },
];
