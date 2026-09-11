import "server-only";
import type { DailyPlaySet, PlaySource } from "@/lib/dailyPlay";

// Editorial data only. Never import this catalogue into a client component:
// the API releases reviewed sets using its own Australia/Sydney date.
const checkedAt = "2026-09-11";
const museum = (path: string): PlaySource => ({ title: "Australian Museum", url: `https://australian.museum/learn/animals/${path}/`, checkedAt });
const slang: PlaySource = { title: "Curtin University", url: "https://www.curtin.edu.au/news/advice/from-avo-to-arvo-the-ultimate-guide-to-aussie-slang/", checkedAt };
const review = { review: "reviewed" as const, checkedAt };

export const dailyPlaySets: readonly DailyPlaySet[] = [
  { id: "play-20260911", date: "2026-09-11",
    quiz: { ...review, id: "quiz-platypus-eggs", topicKey: "animal:platypus-eggs", question: "오리너구리는 포유류인데, 새끼를 어떻게 만날까요?", choices: ["알을 낳아요", "꽃봉오리에서 나와요", "꼬리에서 자라요"], answer: 0, explanation: "오리너구리는 알을 낳는 포유류예요. 익숙한 동물 분류에도 이런 반전이 있네요!", source: museum("mammals/platypus") },
    puzzle: { ...review, id: "word-bikkie", topicKey: "slang:bikkie", word: "BIKKIE", meaning: "비스킷을 친근하게 부르는 말", explanation: "비스킷을 편하게 부르는 말이에요.", usage: "차나 커피와 함께 먹을 간식을 이야기할 때 쓸 수 있어요.", example: {"en":"Would you like a bikkie?","ko":"비스킷 하나 드실래요?"}, source: slang },
    choice: { ...review, id: "pick-market-stall", topicKey: "imagination:market-stall-role", creative: true, question: "상상 속 주말 마켓에서 하루 가게를 연다면?", choices: ["손님 이야기를 듣고 별명을 지어주는 가게", "손님 웃음소리에 맞춰 종을 골라주는 가게"], reactions: ["영수증 대신 새 별명 한 장. 단골 이름은 잊을 수 없겠어요.", "가게 문을 닫을 때쯤 머릿속에 작은 오케스트라가 남겠네요."] } },
  { id: "play-20260912", date: "2026-09-12",
    quiz: { ...review, id: "quiz-emu-height", topicKey: "animal:emu-tallest-native-bird", question: "호주 토종 새 중 키가 가장 큰 새는?", choices: ["리틀펭귄", "에뮤", "쿠카부라"], answer: 1, explanation: "에뮤가 주인공이에요. 똑바로 서면 약 1.6~1.9m로, 사람과 눈높이가 비슷할 수도 있어요.", source: museum("birds/emu") },
    puzzle: { ...review, id: "word-esky", topicKey: "slang:esky", word: "ESKY", meaning: "음료를 차갑게 담아두는 아이스박스", explanation: "음식이나 음료를 차갑게 보관하는 아이스박스를 뜻해요.", usage: "소풍이나 바비큐를 준비하며 시원한 음료를 챙길 때 쓸 수 있어요.", example: {"en":"The esky is in the car.","ko":"아이스박스는 차 안에 있어요."}, source: slang },
    choice: { ...review, id: "pick-future-letter", topicKey: "imagination:future-letter-delivery", creative: true, question: "호주에서 보낸 편지를 10년 뒤 받는다면, 봉투 안에는?", choices: ["오늘의 나에게 몰래 쓴 응원 한 줄", "오늘 들은 가장 엉뚱한 농담 한 줄"], reactions: ["미래의 내가 그 문장을 두 번 읽을 것 같아요.", "10년이나 묵은 농담인데도 웃으면, 꽤 잘 고른 거예요."] } },
  { id: "play-20260913", date: "2026-09-13",
    quiz: { ...review, id: "quiz-wombat-teeth", topicKey: "animal:wombat-growing-teeth", question: "커먼웜뱃의 이빨에는 어떤 특징이 있을까요?", choices: ["성체가 되면 모두 빠져요", "비가 올 때만 자라요", "평생 계속 자라요"], answer: 2, explanation: "앞니와 어금니가 계속 자라요. 풀을 먹는 작은 굴착기에게 꽤 특별한 장비네요.", source: museum("mammals/bare-nosed-wombat") },
    puzzle: { ...review, id: "word-sanga", topicKey: "slang:sanga", word: "SANGA", meaning: "샌드위치를 짧게 부르는 말", explanation: "샌드위치를 짧게 부르는 말이에요.", usage: "점심으로 무엇을 먹을지 친구와 이야기할 때 쓸 수 있어요.", example: {"en":"I'll have a cheese sanga.","ko":"치즈 샌드위치 먹을게요."}, source: slang },
    choice: { ...review, id: "pick-suitcase-object", topicKey: "imagination:talking-suitcase-object", creative: true, question: "여행 가방 속 물건 하나가 말을 시작했어요. 누구의 이야기를 들을래요?", choices: ["구겨진 영수증들의 대장", "매번 한쪽만 사라지는 양말"], reactions: ["‘그날 간식은 꼭 필요했나요?’ 심상치 않은 인터뷰예요.", "세탁기 너머의 세계가 드디어 밝혀질지도 몰라요."] } },
  { id: "play-20260914", date: "2026-09-14",
    quiz: { ...review, id: "quiz-kookaburra-call", topicKey: "animal:kookaburra-territorial-call", question: "웃음처럼 들리는 쿠카부라의 울음에는 어떤 뜻이 있을까요?", choices: ["내 영역이니 가까이 오지 말라는 알림", "사람의 농담에 대한 웃음", "비가 온다는 약속"], answer: 0, explanation: "친숙한 웃음소리는 다른 새에게 영역을 알리는 소리예요. 즐거운 웃음으로만 들었던 소리에 반전이 있죠.", source: museum("birds/laughing-kookaburra") },
    puzzle: { ...review, id: "word-cuppa", topicKey: "slang:cuppa", word: "CUPPA", meaning: "따뜻한 음료 한 잔을 부르는 말", explanation: "차처럼 따뜻한 음료 한 잔을 뜻해요.", usage: "잠깐 쉬면서 따뜻한 음료를 마시자고 이야기할 때 쓸 수 있어요.", example: {"en":"Let's have a cuppa after lunch.","ko":"점심 먹고 따뜻한 차 한 잔 해요."}, source: slang },
    choice: { ...review, id: "pick-window-canvas", topicKey: "imagination:rain-window-drawing", creative: true, question: "비 오는 날, 창문에 그린 그림이 1분간 움직인다면?", choices: ["창문 가장자리를 달리는 작은 기차", "빗방울 사이를 헤엄치는 종이배 물고기"], reactions: ["정거장은 창틀, 종점은 내 손끝. 1분짜리 출발 안내입니다.", "빗방울마다 작은 수족관이 하나씩 생겼어요."] } },
  { id: "play-20260915", date: "2026-09-15",
    quiz: { ...review, id: "quiz-lyrebird-mimic", topicKey: "animal:lyrebird-sound-imitation", question: "슈퍼브금조가 잘하는 소리 재주는?", choices: ["소리 없이 노래하기", "주변 새와 기계 소리 흉내 내기", "물속에서만 휘파람 불기"], answer: 1, explanation: "주변에서 들은 자연의 소리와 기계 소리까지 흉내 낼 수 있어요. 숲속에 재주 많은 소리 수집가가 있네요.", source: museum("birds/superb-lyrebird") },
    puzzle: { ...review, id: "word-avo", topicKey: "slang:avo", word: "AVO", meaning: "아보카도를 짧게 부르는 말", explanation: "아보카도를 짧게 부르는 말이에요.", usage: "음식을 주문하거나 재료를 이야기할 때 쓸 수 있어요.", example: {"en":"Could I add some avo?","ko":"아보카도를 조금 추가할 수 있을까요?"}, source: slang },
    choice: { ...review, id: "pick-imaginary-flavour", topicKey: "imagination:invented-icecream-flavour", creative: true, question: "존재하지 않는 아이스크림 맛을 하나 만든다면?", choices: ["숙제 끝낸 금요일 맛", "오랜 친구를 우연히 만난 맛"], reactions: ["첫 입은 해방감, 끝맛은 늦잠. 이름만으로도 주문하고 싶네요.", "반가움이 먼저 오고, 한참 뒤에 추억이 녹아내릴 것 같아요."] } },
  { id: "play-20260916", date: "2026-09-16",
    quiz: { ...review, id: "quiz-koala-habitat", topicKey: "animal:koala-eucalypt-habitat", question: "코알라가 살아가는 대표적인 숲은?", choices: ["선인장 숲", "해조류 숲", "유칼립투스 숲"], answer: 2, explanation: "코알라는 유칼립투스 숲에 살아요. 나무 위에서 쉬고 먹는 시간이 많아요.", source: museum("mammals/koala") },
    puzzle: { ...review, id: "word-chokkie", topicKey: "slang:chokkie", word: "CHOKKIE", meaning: "초콜릿을 친근하게 부르는 말", explanation: "초콜릿을 편하게 부르는 말이에요.", usage: "친구와 간식을 나눠 먹거나 초콜릿을 찾을 때 쓸 수 있어요.", example: {"en":"I've saved some chokkie for you.","ko":"네 몫의 초콜릿을 조금 남겨뒀어."}, source: slang },
    choice: { ...review, id: "pick-souvenir-story", topicKey: "imagination:souvenir-secret-story", creative: true, question: "기념품 가게에서 물건의 비밀을 한 가지 들을 수 있다면?", choices: ["자석이 냉장고에 붙기 전 꾸던 꿈", "엽서 속 건물이 밤마다 나누는 수다"], reactions: ["냉장고 세계일주를 꿈꾸던 자석일지도 모르죠.", "우표 한 장 값으로 밤새 이어진 도시 이야기를 들었네요."] } },
  { id: "play-20260917", date: "2026-09-17",
    quiz: { ...review, id: "quiz-little-penguin-size", topicKey: "animal:little-penguin-smallest", question: "세계에서 가장 작은 펭귄의 이름은?", choices: ["리틀펭귄", "황제펭귄", "킹펭귄"], answer: 0, explanation: "이름처럼 작은 리틀펭귄이에요. 작다고 아기인 것은 아니랍니다.", source: museum("birds/little-penguin-eudyptula-minor") },
    puzzle: { ...review, id: "word-bathers", topicKey: "slang:bathers", word: "BATHERS", meaning: "수영복을 뜻하는 호주식 표현", explanation: "수영할 때 입는 수영복을 뜻해요.", usage: "수영장이나 해변에 갈 준비물을 이야기할 때 쓸 수 있어요.", example: {"en":"Where are my bathers?","ko":"내 수영복 어디 있지?"}, source: slang },
    choice: { ...review, id: "pick-mural-canvas", topicKey: "imagination:neighbourhood-mural", creative: true, question: "동네 벽화의 빈칸 하나를 채운다면 무엇을 그릴래요?", choices: ["사람들이 적어둔 작은 소원이 열리는 나무", "지나갈 때마다 표정이 바뀌는 거대한 달"], reactions: ["다음에 지나갈 땐 누군가의 소원이 한 잎 더 자라 있겠어요.", "오늘은 어떤 표정일까. 평범한 골목에 볼 일이 하나 생겼네요."] } },
];
