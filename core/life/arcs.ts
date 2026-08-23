import type { GameEvent, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { rememberNpc, ensureStarterNpcs } from './npcCatalog';
import { pushChronicle } from './chronicle';
import { preferredArcIds } from './lifeVariance';
import { dominantNature } from './nature';

/** 短弧：5–6 拍人生片段，可絕交／結緣分岔 */
export interface LifeArcState {
  id: string;
  title: string;
  beat: number;
  maxBeats: number;
  npcId: string;
  monthsLeft: number;
  /** severed | bonded | undefined */
  branch?: 'severed' | 'bonded';
}

type ArcBeat = {
  chronicle: string;
  memory: string;
  affinity: number;
  location?: string;
};

/** 落幕回報：屬性種類 + 數值 + 顯示字句 */
export type ArcRewardKind = 'martial' | 'health' | 'money' | 'reputation' | WuxiaAttribute;

export type ArcReward = {
  kind: ArcRewardKind;
  amount: number;
  label: string;
};

type ArcDef = {
  id: string;
  title: string;
  npcId: string;
  maxBeats: number;
  canStart: (state: LifeGameState) => boolean;
  beats: ArcBeat[];
  /** 可選絕交／深交嘅拍數，可多於一個 */
  severAtBeats?: number[];
  severMemory?: string;
  bondMemory?: string;
  /** 落幕回報（資料驅動，見 applyArcReward） */
  reward: ArcReward;
  /** 完成旗標名；預設 `arc_done_${id}` */
  doneFlag?: string;
};

function applyArcReward(state: LifeGameState, reward: ArcReward): string {
  const c = state.character;
  switch (reward.kind) {
    case 'martial':
      c.martial += reward.amount;
      break;
    case 'health':
      c.health = Math.min(c.maxHealth, c.health + reward.amount);
      break;
    case 'money':
      c.money += reward.amount;
      break;
    case 'reputation':
      c.reputation += reward.amount;
      break;
    default:
      c.attributes[reward.kind] = Math.min(100, c.attributes[reward.kind] + reward.amount);
  }
  return reward.label;
}

function arcDoneFlag(def: ArcDef): string {
  return def.doneFlag ?? `arc_done_${def.id}`;
}

const ARC_DEFS: ArcDef[] = [
  {
    id: 'arc_lu_ink',
    title: '硯生授字',
    npcId: 'npc_lu_yansheng',
    maxBeats: 5,
    severAtBeats: [2],
    severMemory: '與你絕了紙緣',
    bondMemory: '認你為忘年筆友',
    reward: { kind: 'wuXing', amount: 1, label: '悟性＋1' },
    doneFlag: 'arc_done_lu',
    canStart: (s) => s.character.age <= 32 && !s.character.flags.arc_done_lu,
    beats: [
      {
        chronicle: '陸硯生在茶棚邊攤開舊紙，邀你對坐寫字：「字如人，人如江湖。」',
        memory: '與你對坐寫字',
        affinity: 8,
        location: '千燈鎮',
      },
      {
        chronicle: '夜雨中，硯生替你改了一筆敗筆，說道：「急不得，留白也是功夫。」',
        memory: '雨夜改你敗筆',
        affinity: 10,
      },
      {
        chronicle: '他問起你的來處。你答得含糊，他也不追，只把硯台推近你一寸。',
        memory: '不問來處',
        affinity: 8,
      },
      {
        chronicle: '硯生將一本薄冊塞進你袖裡：「不必謝。他日若有字，記得寄一封。」',
        memory: '贈你薄冊',
        affinity: 12,
      },
      {
        chronicle: '鎮口送別。他說：「字寫完了，人還在路上。」風把紙角掀起，像在揮手。',
        memory: '鎮口揮手',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_shen_heal',
    title: '暮晴診脈',
    npcId: 'npc_shen_muqing',
    maxBeats: 5,
    severAtBeats: [2],
    severMemory: '與你生分了',
    bondMemory: '允你有難來醫館',
    reward: { kind: 'health', amount: 12, label: '氣血略復' },
    doneFlag: 'arc_done_shen',
    canStart: (s) => !s.character.flags.arc_done_shen,
    beats: [
      {
        chronicle: '醫館裡，沈暮晴替路人包紮，見你停步，淡淡道：「外傷易治，心事難醫。」',
        memory: '見你停步觀診',
        affinity: 6,
        location: '千燈鎮醫館',
      },
      {
        chronicle: '你幫暮晴送藥到鎮外，她把一包金瘡藥塞給你：「路上用得著。」',
        memory: '與你同行送藥',
        affinity: 12,
      },
      {
        chronicle: '雨夜有人撞門求醫。你幫忙按住傷者，她眼神只在傷口上，卻說了聲「謝」。',
        memory: '雨夜同診',
        affinity: 10,
      },
      {
        chronicle: '暮晴看過你舊傷，低聲：「下次別逞強。醫館燈還亮著。」',
        memory: '囑你勿逞強',
        affinity: 14,
      },
      {
        chronicle: '你離開醫館時，她把一盞小燈掛到檐下：「認得這光，就還找得到路。」',
        memory: '檐下掛燈',
        affinity: 16,
      },
    ],
  },
  {
    id: 'arc_yue_spar',
    title: '長風試拳',
    npcId: 'npc_yue_changfeng',
    maxBeats: 6,
    severAtBeats: [3],
    severMemory: '嫌你心浮',
    bondMemory: '收你半個徒弟',
    reward: { kind: 'martial', amount: 1, label: '武學＋1' },
    doneFlag: 'arc_done_yue',
    canStart: (s) => s.character.martial >= 10 && !s.character.flags.arc_done_yue,
    beats: [
      {
        chronicle: '武館教頭岳長風擲來木棍：「站住。出手我看看。」',
        memory: '以木棍試你拳腳',
        affinity: 5,
        location: '千燈武館',
      },
      {
        chronicle: '長風喝停你一式：「肩太緊。力從腳起，不是從脾氣起。」',
        memory: '點破你肩緊',
        affinity: 10,
      },
      {
        chronicle: '館中比試，長風讓你半招，卻道：「有長進。別沾沾自喜。」',
        memory: '館中讓你半招',
        affinity: 12,
      },
      {
        chronicle: '他罰你馬步到腿顫：「根基不穩，華山風會把你吹下去。」',
        memory: '罰你馬步',
        affinity: 9,
      },
      {
        chronicle: '長風將一張拜帖壓在桌案：「華山若開臺，記得來。拳腳要見世面。」',
        memory: '囑你上華山見世面',
        affinity: 15,
      },
      {
        chronicle: '臨別他拍你肩：「打輸了回來，別把臉埋進酒裡——埋進砂袋。」',
        memory: '囑你輸了練砂袋',
        affinity: 16,
      },
    ],
  },
  {
    id: 'arc_xiao_case',
    title: '鐵樑斷案',
    npcId: 'npc_xiao_tieliang',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你礙手礙腳',
    bondMemory: '認你做半個徒弟捕快',
    reward: { kind: 'reputation', amount: 8, label: '名望＋8' },
    canStart: (s) => s.character.reputation >= 20 && !s.character.flags.arc_done_arc_xiao_case,
    beats: [
      {
        chronicle: '蕭鐵樑往你桌前一坐，甩出半塊染血腰牌：「三年前滅門案，只剩這半塊。你，查得動嗎？」',
        memory: '甩腰牌問案',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '你陪他重走舊案現場，他蹲在焦土前久久不語：「這火，燒得太乾淨了。」',
        memory: '陪查焦土現場',
        affinity: 9,
      },
      {
        chronicle: '蕭鐵樑翻出一本泛黃口供，手指停在一個名字上：「這人，還在鎮上走動。」',
        memory: '翻出舊口供',
        affinity: 10,
      },
      {
        chronicle: '深夜有人朝蕭鐵樑窗口射了一箭，箭上纏著字條：「別查了。」他把箭撅斷：「越勸，越要查。」',
        memory: '陪他撅斷警告箭',
        affinity: 12,
      },
      {
        chronicle: '真兇落網那日，蕭鐵樑把半塊腰牌拼上另一半，遞給你：「這案，算你我共破。」',
        memory: '破案分腰牌',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_li_escort',
    title: '天生問鏢',
    npcId: 'npc_li_tiansheng',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你太急躁',
    bondMemory: '認你做出師鏢師',
    reward: { kind: 'martial', amount: 2, label: '武學＋2' },
    canStart: (s) => s.character.martial >= 20 && !s.character.flags.arc_done_arc_li_escort,
    beats: [
      {
        chronicle: '黎天生把一截斷刀拍在桌上：「當年一鏢劫在這條路，刀斷了，人沒斷氣，仇還沒了。」',
        memory: '拍斷刀問路',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他帶你走了一趟舊鏢路，指著崖邊：「這裡，我兄弟摔下去的。」',
        memory: '同行舊鏢路',
        affinity: 9,
      },
      {
        chronicle: '黎天生教你一手鏢局護身刀法，收招時道：「刀是拿來擋的，不是拿來逞的。」',
        memory: '授你護身刀法',
        affinity: 10,
      },
      {
        chronicle: '有人冒充黎天生名號劫鏢，他咬牙：「這口氣，我親自去出。」',
        memory: '陪他拆穿冒名者',
        affinity: 12,
      },
      {
        chronicle: '舊仇了結那晚，黎天生把斷刀柄塞給你：「刀鞘配好了，你拿去，我這輩子不用刀了。」',
        memory: '贈你斷刀柄',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_liu_embroidery',
    title: '靜姝繡緣',
    npcId: 'npc_liu_jingshu',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '不再讓你進繡莊',
    bondMemory: '認你做能聽懂她手勢的人',
    reward: { kind: 'danShi', amount: 3, label: '膽識＋3' },
    canStart: (s) => dominantNature(s.character) === 'xia' && !s.character.flags.arc_done_arc_liu_embroidery,
    beats: [
      {
        chronicle: '繡莊裡，柳靜姝比劃著手勢，把一方繡了半截的帕子推給你看——上面繡的是滅門那夜的火光。',
        memory: '見她繡火光帕',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '她指著帕角一枚令牌繡樣，眼神很亮，像是認得。',
        memory: '認出令牌繡樣',
        affinity: 9,
      },
      {
        chronicle: '你陪她去問了鎮上老人，得知那令牌屬於某個早已解散的鏢局。',
        memory: '陪她查令牌來歷',
        affinity: 10,
      },
      {
        chronicle: '她第一次開口，只是含糊的氣音，卻是你的名字。',
        memory: '聽她喚你名字',
        affinity: 13,
      },
      {
        chronicle: '繡莊落成那日，柳靜姝把繡完的帕子交到你手上，比了個「謝」的手勢。',
        memory: '收她繡成的帕子',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_shangguan_gamble',
    title: '上九賭局',
    npcId: 'npc_shangguan_jiu',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你多管閒事',
    bondMemory: '認你做賭桌上唯一信得過的人',
    reward: { kind: 'money', amount: 40, label: '銀兩＋40' },
    canStart: (s) => dominantNature(s.character) === 'e' && !s.character.flags.arc_done_arc_shangguan_gamble,
    beats: [
      {
        chronicle: '上官九獨眼一瞇，把骰盅往你面前一推：「小子，敢不敢賭一把？賭注是條命——我的。」',
        memory: '應他一賭',
        affinity: 5,
        location: '千燈鎮',
      },
      {
        chronicle: '他出老千的手法快得你看不清，卻在贏了你之後，把銀子推回來一半。',
        memory: '見他出千又還銀',
        affinity: 8,
      },
      {
        chronicle: '上官九喝多了，說起早年在賭坊被滅口的舊夥計，眼神冷了下來。',
        memory: '聽他提舊夥計',
        affinity: 10,
      },
      {
        chronicle: '有人來討債，動了刀，你替他擋了一下，他罵你多事，手卻在抖。',
        memory: '替他擋一刀',
        affinity: 12,
      },
      {
        chronicle: '上官九把一副做了記號的骰子送給你：「以後賭桌上，這是你的護身符。」',
        memory: '得他贈記號骰子',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_pang_frontier',
    title: '鐵衣歸邊',
    npcId: 'npc_pang_tieyi',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你礙他報仇',
    bondMemory: '認你做能託付後事的人',
    reward: { kind: 'martial', amount: 2, label: '武學＋2' },
    canStart: (s) => s.character.age >= 40 && !s.character.flags.arc_done_arc_pang_frontier,
    beats: [
      {
        chronicle: '龐鐵衣一身舊邊軍甲，坐在城門口曬太陽，見你路過，忽然問：「你信不信，有人能瞞著整支軍隊通敵？」',
        memory: '聽他提通敵疑雲',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他講起舊部全軍覆沒那夜，語氣平靜得可怕：「命令是我上頭下的。」',
        memory: '聽他述覆沒經過',
        affinity: 9,
      },
      {
        chronicle: '你陪他翻出當年的調兵文書，發現簽名處被人動過手腳。',
        memory: '陪他查調兵文書',
        affinity: 11,
      },
      {
        chronicle: '龐鐵衣打聽到當年下令之人如今在鏢局當差，攥緊了拳。',
        memory: '陪他尋當年主謀',
        affinity: 12,
      },
      {
        chronicle: '真相水落石出那日，龐鐵衣朝邊塞方向拜了三拜：「弟兄們，我來遲了，但我來了。」',
        memory: '陪他祭拜舊部',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_tan_story',
    title: '笑生說江',
    npcId: 'npc_tan_xiaosheng',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌他把你說得太假',
    bondMemory: '認他是江湖上第一個真故事',
    reward: { kind: 'reputation', amount: 10, label: '名望＋10' },
    canStart: (s) => s.character.reputation >= 15 && !s.character.flags.arc_done_arc_tan_story,
    beats: [
      {
        chronicle: '說書先生談笑生驚堂木一拍：「今日不說前朝舊事，說江湖上一位後起之秀——就是閣下。」台下鬨笑，你臉一紅。',
        memory: '被他編入說書',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他私下找你補細節：「說書要真，才傳得遠。你老實告訴我，那一戰到底怎麼打的？」',
        memory: '被他追問細節',
        affinity: 8,
      },
      {
        chronicle: '談笑生把你的事蹟編成新段子，滿座叫好，你的名字第一次傳出千燈鎮。',
        memory: '聽他把你說出名',
        affinity: 11,
      },
      {
        chronicle: '有人出銀子要他把你說成惡人，他把銀子摔回去：「說書人的嘴，不賣。」',
        memory: '見他拒賄不昧良心',
        affinity: 13,
      },
      {
        chronicle: '談笑生封了這段書，笑道：「往後你若有新故事，記得先來告訴我。」',
        memory: '應他往後說新故事',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_zhan_rival',
    title: '驚鴻論劍',
    npcId: 'npc_zhan_jinghong',
    maxBeats: 6,
    severAtBeats: [2, 4],
    severMemory: '嫌你不夠痛快',
    bondMemory: '認你做劍下唯一對手',
    reward: { kind: 'martial', amount: 2, label: '武學＋2' },
    canStart: (s) => s.character.martial >= 25 && !s.character.flags.arc_done_arc_zhan_rival,
    beats: [
      {
        chronicle: '展驚鴻白衣勝雪，劍尖點地：「聽聞你也算一號人物，可敢與我過招？」',
        memory: '應她比武之邀',
        affinity: 6,
        location: '千燈武館',
      },
      {
        chronicle: '這一戰不分勝負，她收劍笑道：「有點意思。」',
        memory: '與她首戰平手',
        affinity: 9,
      },
      {
        chronicle: '她指出你劍路裡的破綻，毫不留情：「這裡，你會死第二次。」',
        memory: '受她指點破綻',
        affinity: 10,
      },
      {
        chronicle: '江湖傳言她要找你尋仇，其實只是想約你論劍，你哭笑不得。',
        memory: '澄清論劍非尋仇',
        affinity: 11,
      },
      {
        chronicle: '再戰一場，她終於認輸半招：「這局，算你贏。」',
        memory: '再戰險勝半招',
        affinity: 13,
      },
      {
        chronicle: '展驚鴻臨行前留下一劍穗：「劍穗留下，人隨風去，江湖再見。」',
        memory: '得她留贈劍穗',
        affinity: 16,
      },
    ],
  },
  {
    id: 'arc_zhuo_sect',
    title: '凌雲山門',
    npcId: 'npc_zhuo_lingyun',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你不識抬舉',
    bondMemory: '認你做華山臺上的對手兼朋友',
    reward: { kind: 'reputation', amount: 12, label: '名望＋12' },
    canStart: (s) => s.character.reputation >= 30 && !s.character.flags.arc_done_arc_zhuo_sect,
    beats: [
      {
        chronicle: '卓凌雲一身華山門下勁裝，在酒樓裡聽人提起你的名字，特意過來打量：「久仰。」',
        memory: '被名門弟子搭話',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他請你喝酒，話裡話外都在打探你的來歷，卻不失禮數。',
        memory: '與他對飲探底',
        affinity: 8,
      },
      {
        chronicle: '卓凌雲透露今年華山論劍的消息，眼神裡有幾分較勁的意味。',
        memory: '聽他提華山論劍',
        affinity: 10,
      },
      {
        chronicle: '他門中有人瞧不起你出身，卓凌雲當場駁了回去：「英雄不問出處。」',
        memory: '見他為你辯白',
        affinity: 12,
      },
      {
        chronicle: '分別前，卓凌雲遞來一張引薦帖：「華山臺上見，別讓我失望。」',
        memory: '得他引薦帖',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_tie_ring',
    title: '無敵擂臺',
    npcId: 'npc_tie_wudi',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你太假仁假義',
    bondMemory: '認你做擂臺上的招牌',
    reward: { kind: 'danShi', amount: 4, label: '膽識＋4' },
    canStart: (s) => s.character.attributes.danShi >= 60 && !s.character.flags.arc_done_arc_tie_ring,
    beats: [
      {
        chronicle: '擂台莊主鐵無敵敲鑼吆喝：「有膽子的，上臺！輸贏自負，死傷勿論！」眼神卻在你身上多停了一瞬。',
        memory: '被他相中上臺',
        affinity: 5,
        location: '千燈鎮',
      },
      {
        chronicle: '他私下提點你擂臺上的江湖規矩：「臺上留三分手，臺下才留得住命。」',
        memory: '受他提點臺規',
        affinity: 8,
      },
      {
        chronicle: '有莊家想買你放水，鐵無敵一口回絕：「我這擂臺，不做這種生意。」',
        memory: '見他拒絕放水',
        affinity: 10,
      },
      {
        chronicle: '你在臺上大勝一場，鐵無敵親自敲鑼喝彩，嗓子都啞了。',
        memory: '得他親自喝彩',
        affinity: 12,
      },
      {
        chronicle: '鐵無敵把擂臺令旗交到你手上：「這旗，往後你想借臺子，隨時來。」',
        memory: '得他贈令旗',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_tong_troupe',
    title: '三通百戲',
    npcId: 'npc_tong_santong',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你不肯陪他賣藝',
    bondMemory: '認你做班子的義兄弟',
    reward: { kind: 'meiLi', amount: 4, label: '魅力＋4' },
    canStart: (s) => s.character.attributes.meiLi >= 40 && !s.character.flags.arc_done_arc_tong_troupe,
    beats: [
      {
        chronicle: '雜耍班主童三通拍腿大笑：「兄臺這身手，跟我混江湖賣藝，保管餓不著！」',
        memory: '被他邀入班子',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '你陪他的班子走了一場，台下叫好聲讓你有點飄飄然。',
        memory: '陪他登台獻藝',
        affinity: 8,
      },
      {
        chronicle: '童三通私下嘆氣：「賣藝的，最怕的不是摔死，是沒人看。」',
        memory: '聽他訴賣藝苦處',
        affinity: 9,
      },
      {
        chronicle: '有地痞來砸場子，你護住了他的班子，童三通感激涕零。',
        memory: '護他班子退地痞',
        affinity: 12,
      },
      {
        chronicle: '童三通把班中鎮班之寶——一副銅鈴——送給你：「這鈴一響，江湖上總有人認得你。」',
        memory: '得他贈鎮班銅鈴',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_liaochen_monk',
    title: '了塵一帚',
    npcId: 'npc_liaochen',
    maxBeats: 6,
    severAtBeats: [2, 4],
    severMemory: '嫌你塵緣未了',
    bondMemory: '認你有幾分悟性',
    reward: { kind: 'wuXing', amount: 4, label: '悟性＋4' },
    canStart: (s) => s.character.attributes.wuXing >= 70 && !s.character.flags.arc_done_arc_liaochen_monk,
    beats: [
      {
        chronicle: '藏經閣前，掃地老僧了塵一帚一帚掃著落葉，頭也不抬：「施主，這地，掃了三十年，還沒掃乾淨。」',
        memory: '見他掃地三十年',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '你問他為何不習武，他笑道：「掃地也是一種練法，只是施主看不懂。」',
        memory: '聽他論掃地即修行',
        affinity: 8,
      },
      {
        chronicle: '了塵隨手接了你一記戲耍的拳頭，力道卻讓你倒退三步。',
        memory: '見識他深藏武學',
        affinity: 10,
      },
      {
        chronicle: '他點破你招式裡的貪念：「你這一拳，圖的是贏，不是理。」',
        memory: '受他點破貪念',
        affinity: 11,
      },
      {
        chronicle: '了塵教你一口吐納心法，只說：「悟不悟，看你自己。」',
        memory: '得他授吐納心法',
        affinity: 13,
      },
      {
        chronicle: '你再訪時，他已不在藏經閣前，只留下一把舊掃帚。',
        memory: '見他悄然離去留掃帚',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_ouyang_sword',
    title: '鑄劍無聲',
    npcId: 'npc_ouyang_zhu',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你不懂他的沉默',
    bondMemory: '認你懂他手勢裡的話',
    reward: { kind: 'genGu', amount: 4, label: '根骨＋4' },
    canStart: (s) => s.character.attributes.genGu >= 70 && !s.character.flags.arc_done_arc_ouyang_sword,
    beats: [
      {
        chronicle: '鑄劍師歐陽鑄不能言語，只以手勢示意你坐下，遞來一把還帶著爐溫的粗胚劍。',
        memory: '得他遞粗胚劍',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他打鐵時，你發現他左臂上一道舊燙疤，形狀像是刻意留下的。',
        memory: '見他臂上舊疤',
        affinity: 9,
      },
      {
        chronicle: '你幫他搬了一爐礦石，他破天荒露出笑意，比了個「好」的手勢。',
        memory: '助他搬運礦石',
        affinity: 10,
      },
      {
        chronicle: '有人來找歐陽鑄鑄凶器害人，他斷然搖頭，把爐火潑熄。',
        memory: '見他拒鑄凶器',
        affinity: 12,
      },
      {
        chronicle: '一柄新劍出爐，歐陽鑄親手繫上劍穗，遞給你——那是他這輩子最後一把劍。',
        memory: '得他封爐之作',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_xuanxuzi_taoist',
    title: '玄虛譎語',
    npcId: 'npc_xuanxuzi',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你太把他當回事',
    bondMemory: '認你是聽得懂瘋話的人',
    reward: { kind: 'wuXing', amount: 3, label: '悟性＋3' },
    canStart: (s) => dominantNature(s.character) === 'kuang' && !s.character.flags.arc_done_arc_xuanxuzi_taoist,
    beats: [
      {
        chronicle: '瘋道人玄虛子倒騎著一頭瘸驢，指著你哈哈大笑：「你這副骨相，三十年後不是瘋子就是高手！」',
        memory: '被他當面戲言',
        affinity: 5,
        location: '千燈鎮',
      },
      {
        chronicle: '他說的話顛三倒四，卻總在關鍵處點中你的心事。',
        memory: '被他點中心事',
        affinity: 8,
      },
      {
        chronicle: '你陪他喝了一夜劣酒，他忽然清醒地問了你一句認真話。',
        memory: '陪他夜飲聽真話',
        affinity: 10,
      },
      {
        chronicle: '玄虛子教你一套聽起來荒唐的呼吸法，練起來卻真有奇效。',
        memory: '得他授荒唐呼吸法',
        affinity: 11,
      },
      {
        chronicle: '他臨走前留下一句籤語，你當時不解，後來卻應驗了。',
        memory: '得他留讖語',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_yiwuya_chess',
    title: '無涯一局',
    npcId: 'npc_yi_wuya',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你棋品太差',
    bondMemory: '認你是唯一贏過他的人',
    reward: { kind: 'wuXing', amount: 5, label: '悟性＋5' },
    canStart: (s) => s.character.attributes.wuXing >= 60 && !s.character.flags.arc_done_arc_yiwuya_chess,
    beats: [
      {
        chronicle: '山中棋亭，弈無涯頭也不抬：「一局如何？贏了，我教你一件事；輸了，你陪我下滿一百局。」',
        memory: '應他一局棋約',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '你輸得一敗塗地，他卻說：「你輸得不甘心，這點很好。」',
        memory: '敗局後受他點評',
        affinity: 8,
      },
      {
        chronicle: '他以棋局比喻江湖：「你以為的死路，往往是別人算漏的活眼。」',
        memory: '聽他以棋論江湖',
        affinity: 10,
      },
      {
        chronicle: '你終於贏了他一局，弈無涯罕見地認真收了笑容。',
        memory: '首勝他一局',
        affinity: 12,
      },
      {
        chronicle: '弈無涯把一副舊棋盤留給你：「以後遇上算不透的局，擺出來看看。」',
        memory: '得他贈舊棋盤',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_du_herb',
    title: '若蘭問藥',
    npcId: 'npc_du_ruolan',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你福緣太淺',
    bondMemory: '認你有幾分醫緣',
    reward: { kind: 'fuYuan', amount: 4, label: '福緣＋4' },
    canStart: (s) => s.character.attributes.fuYuan >= 60 && !s.character.flags.arc_done_arc_du_herb,
    beats: [
      {
        chronicle: '賣藥老婦杜若蘭在藥攤後打量你半晌：「你這氣色，帶著點劫數，要不要買副藥？」',
        memory: '被她看出氣色異狀',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '她給你的藥引古怪，卻真的管用，你開始懷疑她的來歷。',
        memory: '見識她藥引之效',
        affinity: 9,
      },
      {
        chronicle: '杜若蘭悄悄透露自己曾是某位隱世神醫的關門弟子。',
        memory: '得知她師承神醫',
        affinity: 10,
      },
      {
        chronicle: '有江湖人尋上門逼她獻毒方，你替她擋了回去。',
        memory: '替她擋逼獻毒方',
        affinity: 12,
      },
      {
        chronicle: '杜若蘭把一本殘破藥典交給你：「福緣淺的人，我不敢教；你，我信得過。」',
        memory: '得她傳授藥典',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_qian_pawn',
    title: '有道當鋪',
    npcId: 'npc_qian_youdao',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你不懂銀錢規矩',
    bondMemory: '認你是講信用的主顧',
    reward: { kind: 'money', amount: 30, label: '銀兩＋30' },
    canStart: (s) => s.character.money <= 20 && !s.character.flags.arc_done_arc_qian_pawn,
    beats: [
      {
        chronicle: '當鋪掌櫃錢有道推了推算盤：「小兄弟看你窮得叮噹響，要不要典當點什麼？」',
        memory: '被他看穿窮相',
        affinity: 5,
        location: '千燈鎮',
      },
      {
        chronicle: '他教你辨認當鋪裡以次充好的行規，講得頭頭是道。',
        memory: '受他教辨當鋪行規',
        affinity: 8,
      },
      {
        chronicle: '錢有道私下透露，自己當年也曾家財萬貫，一夕敗光。',
        memory: '聽他述家道中落',
        affinity: 9,
      },
      {
        chronicle: '有人拿贓物來典當，錢有道悄悄使了眼色讓你留意。',
        memory: '助他察覺贓物',
        affinity: 11,
      },
      {
        chronicle: '錢有道破例借你一筆本錢：「有道無道，就看你怎麼還。」',
        memory: '得他借本錢',
        affinity: 13,
      },
    ],
  },
  {
    id: 'arc_jiang_river',
    title: '大浪漕運',
    npcId: 'npc_jiang_dalang',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你不夠江湖義氣',
    bondMemory: '認你做半個漕幫自己人',
    reward: { kind: 'money', amount: 35, label: '銀兩＋35' },
    canStart: (s) => Boolean(s.character.sectId) && !s.character.flags.arc_done_arc_jiang_river,
    beats: [
      {
        chronicle: '漕幫舵主江大浪拍著船舷大笑：「聽聞閣下也是有門有派的人，敢不敢跟我跑一趟夜航？」',
        memory: '應他夜航之邀',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '江上遇劫，你和他並肩擊退了劫船的水匪。',
        memory: '並肩擊退水匪',
        affinity: 10,
      },
      {
        chronicle: '江大浪說起漕幫與官府的舊怨，語氣裡藏著火氣。',
        memory: '聽他述漕幫舊怨',
        affinity: 9,
      },
      {
        chronicle: '你替他斡旋了一樁碼頭糾紛，江大浪對你刮目相看。',
        memory: '替他斡旋碼頭糾紛',
        affinity: 11,
      },
      {
        chronicle: '江大浪送你一面漕幫令旗：「往後這條江，算你半個自己人。」',
        memory: '得他贈漕幫令旗',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_su_courtesan',
    title: '小蟬歌盡',
    npcId: 'npc_su_xiaochan',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你看輕她',
    bondMemory: '認你是唯一沒把她當貨物看的人',
    reward: { kind: 'meiLi', amount: 5, label: '魅力＋5' },
    canStart: (s) => s.character.attributes.meiLi >= 60 && !s.character.flags.arc_done_arc_su_courtesan,
    beats: [
      {
        chronicle: '花魁蘇小蟬一曲清歌唱罷，隔簾遞出一張箋紙：「客官的名字，倒是頭一回聽人提起。」',
        memory: '得她隔簾遞箋',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '她說起入這行前的舊事，語氣很輕，像是說別人的故事。',
        memory: '聽她述舊時身世',
        affinity: 9,
      },
      {
        chronicle: '有恩客仗勢欺人，你出面解了圍，蘇小蟬對你另眼相看。',
        memory: '替她解圍護場',
        affinity: 11,
      },
      {
        chronicle: '她私下問你，江湖上是不是真有能自己選路的女子。',
        memory: '聽她問江湖自主路',
        affinity: 10,
      },
      {
        chronicle: '蘇小蟬贖身離去前，留給你一支舊玉簪：「這行的最後一曲，唱給你聽了。」',
        memory: '得她留贈玉簪',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_mai_agency',
    title: '九鏢護行',
    npcId: 'npc_mai_jiubiao',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你多管鏢局的事',
    bondMemory: '認你做鏢局信得過的護院',
    reward: { kind: 'money', amount: 50, label: '銀兩＋50' },
    canStart: (s) => s.character.money >= 100 && !s.character.flags.arc_done_arc_mai_agency,
    beats: [
      {
        chronicle: '鏢局總鏢頭麥九鏢招募人手：「這趟鏢貨重，賞銀也重，你敢不敢押？」',
        memory: '應他押鏢之邀',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '路上遇劫，你和麥九鏢聯手擊退了劫鏢的山賊。',
        memory: '聯手擊退劫鏢賊',
        affinity: 10,
      },
      {
        chronicle: '麥九鏢私下坦言，這趟鏢裡藏著見不得光的貨。',
        memory: '聽他坦言鏢貨蹊蹺',
        affinity: 9,
      },
      {
        chronicle: '你逼問清楚後，麥九鏢決定改道，避開了一場更大的劫殺。',
        memory: '助他改道避劫',
        affinity: 12,
      },
      {
        chronicle: '鏢貨安然送達，麥九鏢分你雙倍賞銀：「往後有硬仗，第一個找你。」',
        memory: '得他雙倍賞銀',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_ayigulli_trade',
    title: '古麗西市',
    npcId: 'npc_ayigulli',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你信不過外鄉人',
    bondMemory: '認你做東土第一個朋友',
    reward: { kind: 'fuYuan', amount: 3, label: '福緣＋3' },
    canStart: (s) => s.character.money >= 50 && !s.character.flags.arc_done_arc_ayigulli_trade,
    beats: [
      {
        chronicle: '番商阿依古麗攤開一匹異域錦緞：「客官若識貨，這价錢好商量。」',
        memory: '見她攤開異域錦緞',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '她說起千里迢迢東來的路，路上遇過的沙匪與雪崩。',
        memory: '聽她述西來艱險',
        affinity: 9,
      },
      {
        chronicle: '有本地商販合夥排擠她的攤子，你替她說了句公道話。',
        memory: '替她說公道話',
        affinity: 10,
      },
      {
        chronicle: '阿依古麗教你辨認幾樣西域珍品的真偽。',
        memory: '受她教辨西域珍品',
        affinity: 9,
      },
      {
        chronicle: '她臨行前，把一枚異域護身符交給你：「這個，帶著平安。」',
        memory: '得她贈護身符',
        affinity: 13,
      },
    ],
  },
  {
    id: 'arc_bu_herbmountain',
    title: '長生採藥',
    npcId: 'npc_bu_changsheng',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你採藥太貪心',
    bondMemory: '認你識得山裡的規矩',
    reward: { kind: 'fuYuan', amount: 3, label: '福緣＋3' },
    canStart: (s) =>
      s.character.age >= 30 && dominantNature(s.character) !== 'kuang' && !s.character.flags.arc_done_arc_bu_herbmountain,
    beats: [
      {
        chronicle: '山中採藥翁卜長生蹲在崖邊，見你路過，隨口問：「識不識這株草？認得，算你有緣。」',
        memory: '被他考問識藥',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '你陪他採了一整日的藥，聽他講山裡的規矩——不採過頭，不採斷根。',
        memory: '陪他採藥聽規矩',
        affinity: 9,
      },
      {
        chronicle: '卜長生說起早年在江湖上見過的一場大劫，語氣淡然。',
        memory: '聽他述舊年大劫',
        affinity: 8,
      },
      {
        chronicle: '你替他擋了一頭下山的野獸，他難得誇了你一句。',
        memory: '替他擋野獸',
        affinity: 11,
      },
      {
        chronicle: '卜長生把自己畢生所識的藥草圖冊交給你：「山裡的路，你自己走了。」',
        memory: '得他傳藥草圖冊',
        affinity: 13,
      },
    ],
  },
  {
    id: 'arc_tian_farmer',
    title: '守拙耕讀',
    npcId: 'npc_tian_shouzhuo',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你靜不下心',
    bondMemory: '認你是能陪他種地的人',
    reward: { kind: 'health', amount: 15, label: '氣血略復' },
    canStart: (s) => s.character.reputation <= 5 && !s.character.flags.arc_done_arc_tian_farmer,
    beats: [
      {
        chronicle: '田舍老翁田守拙鋤地累了，靠著田埂喝水，見你路過：「後生，江湖上刀光劍影，可比得上這一畝地實在？」',
        memory: '聽他問田地與江湖',
        affinity: 5,
        location: '千燈鎮',
      },
      {
        chronicle: '你幫他耕了一日的地，累得腰都直不起來，他卻笑得開懷。',
        memory: '陪他耕地一日',
        affinity: 8,
      },
      {
        chronicle: '田守拙說起年輕時也曾仗劍闖蕩，後來厭倦了，回來種地。',
        memory: '聽他述棄劍歸田',
        affinity: 9,
      },
      {
        chronicle: '鄉里鬧了場水患，你和他一起加固了田埂。',
        memory: '陪他加固田埂',
        affinity: 10,
      },
      {
        chronicle: '田守拙送你一筐新收的稻米：「江湖再大，也得吃飯。」',
        memory: '得他贈新米一筐',
        affinity: 12,
      },
    ],
  },
  {
    id: 'arc_qin_retired',
    title: '孤劍歸隱',
    npcId: 'npc_qin_gujian',
    maxBeats: 6,
    severAtBeats: [2, 4],
    severMemory: '嫌你太執著於劍',
    bondMemory: '認你是唯一勸得動他重新握劍的人',
    reward: { kind: 'martial', amount: 1, label: '武學＋1' },
    canStart: (s) =>
      s.character.martial >= 30 && dominantNature(s.character) === 'xia' && !s.character.flags.arc_done_arc_qin_retired,
    beats: [
      {
        chronicle: '山間茅屋前，秦孤劍把一柄鏽劍插在地上：「這劍我十年沒拔過了，你若真想學，先問問它答不答應。」',
        memory: '見他劍插地十年',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他講起當年名滿江湖卻一夕心灰的往事，語氣裡沒有悔恨，只有疲憊。',
        memory: '聽他述封劍緣由',
        affinity: 9,
      },
      {
        chronicle: '你陪他練了半日基本功，他才鬆口指點你一招半式。',
        memory: '陪他練基本功',
        affinity: 10,
      },
      {
        chronicle: '有舊仇人尋上門挑釁，秦孤劍按下你的手：「他們要的是我，不是你。」',
        memory: '見他攔你護他',
        affinity: 11,
      },
      {
        chronicle: '他終於拔劍一次，只為給你演示一招失傳的劍式。',
        memory: '得他破例拔劍演式',
        affinity: 13,
      },
      {
        chronicle: '秦孤劍把鏽劍重新插回地裡：「這劍，還是留在這裡好。你，帶著我教你的東西走。」',
        memory: '得他傾囊相授',
        affinity: 16,
      },
    ],
  },
  {
    id: 'arc_jingming_nun',
    title: '靜明荒寺',
    npcId: 'npc_jingming',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你擾她清修',
    bondMemory: '認你是荒寺難得的訪客',
    reward: { kind: 'fuYuan', amount: 4, label: '福緣＋4' },
    canStart: (s) => s.character.attributes.danShi <= 30 && !s.character.flags.arc_done_arc_jingming_nun,
    beats: [
      {
        chronicle: '荒廢古寺裡，尼姑靜明獨自誦經，見你闖入也不驚：「施主是來借宿，還是來躲債？」',
        memory: '被她看穿來意',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '她講起這寺曾經香火鼎盛，後來一場大火，只剩她一人守著。',
        memory: '聽她述荒寺舊事',
        affinity: 8,
      },
      {
        chronicle: '你陪她修補了佛殿漏雨的屋頂。',
        memory: '陪她修補佛殿',
        affinity: 9,
      },
      {
        chronicle: '有地痞想霸佔這座荒寺，你替她趕走了他們。',
        memory: '替她趕走地痞',
        affinity: 11,
      },
      {
        chronicle: '靜明教你一段安神心法：「膽識不是不怕，是怕了還能定住。」',
        memory: '得她授安神心法',
        affinity: 13,
      },
    ],
  },
  {
    id: 'arc_zeng_widow',
    title: '阿珠寡居',
    npcId: 'npc_zeng_azhu',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你礙她報仇',
    bondMemory: '認你是唯一勸得住她的人',
    reward: { kind: 'reputation', amount: 5, label: '名望＋5' },
    canStart: (s) => dominantNature(s.character) === 'xie' && !s.character.flags.arc_done_arc_zeng_widow,
    beats: [
      {
        chronicle: '邊村寡婦曾阿珠攔住你的去路，眼神狠厲：「你是官府派來的，還是仇家派來的？」',
        memory: '被她狠厲盤問',
        affinity: 4,
        location: '千燈鎮',
      },
      {
        chronicle: '你證明清白後，她才鬆口說起亡夫死於一場說不清的械鬥。',
        memory: '聽她述亡夫冤情',
        affinity: 9,
      },
      {
        chronicle: '曾阿珠帶你翻出當年械鬥的舊物證，眼裡全是恨意。',
        memory: '陪她翻查舊物證',
        affinity: 10,
      },
      {
        chronicle: '她想以毒計報復仇家，你勸住了她：「這樣做，你會變成你恨的人。」',
        memory: '勸住她行毒計',
        affinity: 12,
      },
      {
        chronicle: '曾阿珠終於落淚，把亡夫遺物交給你收著：「這仇，我信你會還得乾淨。」',
        memory: '得她托付亡夫遺物',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_chen_elder',
    title: '耆年訓族',
    npcId: 'npc_chen_qinian',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你不守族規',
    bondMemory: '認你為家族撐得住場面的後生',
    reward: { kind: 'reputation', amount: 6, label: '名望＋6' },
    canStart: (s) => s.character.childrenCount > 0 && !s.character.flags.arc_done_arc_chen_elder,
    beats: [
      {
        chronicle: '族老陳耆年拄杖而來，開門見山：「聽聞你已有後，這族譜的事，該提上議程了。」',
        memory: '被他提族譜事',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他翻出泛黃族譜，一頁頁講起先祖的規矩與教訓。',
        memory: '聽他述先祖規矩',
        affinity: 8,
      },
      {
        chronicle: '族中為家產起了爭執，陳耆年請你出面主持公道。',
        memory: '替族中主持公道',
        affinity: 11,
      },
      {
        chronicle: '你依規矩辦事，卻得罪了族中另一房，陳耆年替你擋了風波。',
        memory: '得他替你擋風波',
        affinity: 12,
      },
      {
        chronicle: '陳耆年把族譜添上你這一支：「這名字，往後就是這個家的一部分了。」',
        memory: '得他添名入族譜',
        affinity: 15,
      },
    ],
  },
  {
    id: 'arc_ran_matchmaker',
    title: '巧言保媒',
    npcId: 'npc_ran_qiaoyan',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌你辜負一番好意',
    bondMemory: '認你是講良心的主顧',
    reward: { kind: 'meiLi', amount: 3, label: '魅力＋3' },
    canStart: (s) => !s.character.loverId && s.character.age >= 16 && !s.character.flags.arc_done_arc_ran_matchmaker,
    beats: [
      {
        chronicle: '媒婆冉巧言笑盈盈地登門：「小兄弟這般人物，怎能無人牽紅線？我這裡倒有幾門好親事。」',
        memory: '被她說起親事',
        affinity: 5,
        location: '千燈鎮',
      },
      {
        chronicle: '她一口氣說了三家的門第、脾性、嫁妝，滔滔不絕。',
        memory: '聽她細數三門親事',
        affinity: 7,
      },
      {
        chronicle: '你陪她去探了一戶人家的口風，發現對方另有隱情。',
        memory: '陪她探親事口風',
        affinity: 9,
      },
      {
        chronicle: '冉巧言察覺自己差點說錯了一門親，及時攔下：「這門，不能保。」',
        memory: '見她及時攔下錯配',
        affinity: 10,
      },
      {
        chronicle: '無論這門親事最終成與不成，冉巧言都認真道：「保媒這行，最忌昧著良心。你這人，我信得過。」',
        memory: '得她認可你的人品',
        affinity: 13,
      },
    ],
  },
  {
    id: 'arc_guan_relative',
    title: '世通認親',
    npcId: 'npc_guan_shitong',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '徹底斷了這門親戚',
    bondMemory: '認他做遠房但真實的親戚',
    reward: { kind: 'money', amount: 25, label: '銀兩＋25' },
    canStart: (s) => s.character.money >= 80 && !s.character.flags.arc_done_arc_guan_relative,
    beats: [
      {
        chronicle: '一個自稱「遠房叔伯」的關世通登門，一把鼻涕一把淚：「侄兒，總算找到你了，這些年苦了你。」',
        memory: '被他認作侄兒',
        affinity: 4,
        location: '千燈鎮',
      },
      {
        chronicle: '他開口借銀，數目不小，理由一套一套的。',
        memory: '被他開口借銀',
        affinity: -3,
      },
      {
        chronicle: '你私下查了關世通的底細，發現他確實與你家族沾親，卻也確實好賭成性。',
        memory: '查出他底細',
        affinity: 6,
      },
      {
        chronicle: '他又一次借銀不成，惱羞成怒，說了幾句難聽話。',
        memory: '被他惱羞出言',
        affinity: -5,
      },
      {
        chronicle: '事情鬧到最後，關世通終於說出真心話：他只是怕孤老無依，才想抱你這門親。',
        memory: '聽他吐露真心話',
        affinity: 8,
      },
    ],
  },
  {
    id: 'arc_gong_oldfriend',
    title: '守義還債',
    npcId: 'npc_gong_shouyi',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌他攀扯舊情',
    bondMemory: '認他是父親真正的故人',
    reward: { kind: 'reputation', amount: 5, label: '名望＋5' },
    canStart: (s) => s.character.age <= 20 && !s.character.flags.arc_done_arc_gong_oldfriend,
    beats: [
      {
        chronicle: '自稱是你父輩故交的龔守義找上門：「令尊當年救過我一命，這份情，我記到現在。」',
        memory: '得知他與父輩舊交',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '他講起你父親年輕時的糗事與義舉，你頭一次聽見這些故事。',
        memory: '聽他述父輩往事',
        affinity: 9,
      },
      {
        chronicle: '龔守義卻遭仇家尋上門，你才知這份舊情背後藏著恩怨。',
        memory: '見他遭仇家尋事',
        affinity: 8,
      },
      {
        chronicle: '你替他解了這場恩怨，龔守義感激涕零：「這下，你父親的情，我算還清了。」',
        memory: '替他解舊日恩怨',
        affinity: 12,
      },
      {
        chronicle: '他把你父親當年留下的一件舊物交還給你：「這個，本該早點還你。」',
        memory: '得他歸還父親舊物',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_shi_orphan',
    title: '石忠護主',
    npcId: 'npc_shi_zhong',
    maxBeats: 5,
    severAtBeats: [1, 3],
    severMemory: '嫌他礙手礙腳',
    bondMemory: '認他做生死相隨的家臣',
    reward: { kind: 'danShi', amount: 3, label: '膽識＋3' },
    canStart: (s) => s.character.reputation >= 10 && !s.character.flags.arc_done_arc_shi_orphan,
    beats: [
      {
        chronicle: '一個瘦弱少年石忠攔在你面前，單膝跪地：「家父曾是貴家家將，臨終前囑我來投靠，望公子收留。」',
        memory: '被他跪求投靠',
        affinity: 6,
        location: '千燈鎮',
      },
      {
        chronicle: '你安置了他，他卻堅持每日練功到深夜，只為「配得上護主」。',
        memory: '見他刻苦練功',
        affinity: 9,
      },
      {
        chronicle: '石忠替你擋下一場暗算，自己傷得不輕，卻笑說值得。',
        memory: '替你擋暗算受傷',
        affinity: 12,
      },
      {
        chronicle: '你查出他父親當年其實死於一場冤案，並非戰死。',
        memory: '查出他父親死於冤案',
        affinity: 10,
      },
      {
        chronicle: '你替他洗清了父親的冤屈，石忠對你行了大禮：「這條命，往後就是公子的了。」',
        memory: '替他洗清父親冤屈',
        affinity: 15,
      },
    ],
  },
];

export function getArcDef(id: string): ArcDef | undefined {
  return ARC_DEFS.find((a) => a.id === id);
}

/** 全部短弧因緣定義（測試／工具用；遊戲內請走 getArcDef／maybeStartLifeArc） */
export function listArcDefs(): readonly ArcDef[] {
  return ARC_DEFS;
}

export function isArcVisitReady(state: LifeGameState): boolean {
  return Boolean(state.lifeArc && state.lifeArc.monthsLeft <= 0);
}

export function buildArcVisitEvent(state: LifeGameState, beatOverride?: number): GameEvent | null {
  const arc = state.lifeArc;
  if (!arc) return null;
  const def = getArcDef(arc.id);
  if (!def) return null;
  const beat = beatOverride ?? arc.beat;
  const beatDef = def.beats[beat];
  if (!beatDef) return null;
  const npcName = state.npcs[arc.npcId]?.name ?? '故人';
  const prev = beat > 0 ? def.beats[beat - 1] : undefined;
  const recall = prev ? `${npcName}還記得上回：${prev.memory}。` : '';
  const body = recall ? `${recall}\n\n${beatDef.chronicle}` : beatDef.chronicle;
  const choices: GameEvent['choices'] = [
    {
      id: 'go',
      text: '推門進去',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你推門而入。${beatDef.chronicle}`,
            },
          ],
        },
      ],
    },
    {
      id: 'later',
      text: '巷口停一停，改日再說',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你在巷口停了停，沒有邁步。${npcName}那邊的燈火還在。`,
            },
          ],
        },
      ],
    },
  ];

  // 中段分岔：絕交／深交（可多於一拍）
  if (def.severAtBeats?.includes(beat)) {
    choices.push({
      id: 'sever',
      text: '拱手一別，這緣就此淡了',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你拱手退去，話只剩半句。${npcName}望着你的背影，終究沒有喊。`,
            },
          ],
        },
      ],
    });
    choices.push({
      id: 'bond',
      text: '把心裏那點猶豫說開',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你把心裏那點猶豫說開。${npcName}沉默片刻，點了點頭。`,
            },
          ],
        },
      ],
    });
  }

  return {
    id: `arc_visit_${arc.id}_${beat}`,
    title: `故人·${def.title}`,
    body,
    weight: 40,
    tags: ['arc', 'story'],
    choices,
  };
}

export function listArcBonusEvents(state: LifeGameState): GameEvent[] {
  if (!isArcVisitReady(state)) return [];
  const ev = buildArcVisitEvent(state);
  return ev ? [ev] : [];
}

export function lookupArcEvent(state: LifeGameState, eventId: string): GameEvent | null {
  if (!eventId.startsWith('arc_visit_')) return null;
  const live = buildArcVisitEvent(state);
  if (live && live.id === eventId) return live;
  const m = /^arc_visit_(arc_[a-z_]+)_(\d+)$/.exec(eventId);
  if (!m) return null;
  const arcId = m[1]!;
  const beat = Number(m[2]);
  const def = getArcDef(arcId);
  if (!def) return null;
  const shadow: LifeGameState = {
    ...state,
    lifeArc:
      state.lifeArc?.id === arcId
        ? { ...state.lifeArc, beat, monthsLeft: 0 }
        : {
            id: arcId,
            title: def.title,
            beat,
            maxBeats: def.maxBeats,
            npcId: def.npcId,
            monthsLeft: 0,
          },
  };
  return buildArcVisitEvent(shadow, beat);
}

export function maybeStartLifeArc(state: LifeGameState): string[] {
  if (state.lifeArc) return [];
  ensureStarterNpcs(state);
  const rng = getRng();
  // 短弧升主線：提高啟動率，讓一世更容易記住一個人際
  if (!rng.chance(0.34)) return [];
  const prefer = preferredArcIds(state);
  let candidates = ARC_DEFS.filter((d) => d.canStart(state) && state.npcs[d.npcId]?.alive);
  if (!candidates.length) return [];
  const preferred = candidates.filter((d) => prefer.includes(d.id));
  if (preferred.length && rng.chance(0.7)) candidates = preferred;
  const def = rng.pick(candidates);
  state.lifeArc = {
    id: def.id,
    title: def.title,
    beat: 0,
    maxBeats: def.maxBeats,
    npcId: def.npcId,
    monthsLeft: rng.nextInt(0, 2),
  };
  const npc = state.npcs[def.npcId]?.name ?? '故人';
  const line = `${npc}起了一段緣——「${def.title}」。`;
  pushChronicle(state, [line]);
  return [line];
}

export function tickLifeArc(state: LifeGameState): string[] {
  ensureStarterNpcs(state);
  const lines: string[] = [];
  if (!state.lifeArc) {
    lines.push(...maybeStartLifeArc(state));
    return lines;
  }
  const arc = state.lifeArc;
  if (arc.monthsLeft > 0) {
    arc.monthsLeft -= 1;
  }
  return lines;
}

function markArcDone(state: LifeGameState, def: ArcDef): void {
  state.character.flags[arcDoneFlag(def)] = true;
}

/** 「推門進去」／結緣：寫入本拍、推進下一拍或落幕 */
export function resolveArcVisitGo(state: LifeGameState, mode: 'go' | 'bond' = 'go'): string[] {
  ensureStarterNpcs(state);
  const arc = state.lifeArc;
  if (!arc) return [];
  const def = getArcDef(arc.id);
  if (!def) {
    state.lifeArc = undefined;
    return [];
  }
  const beat = def.beats[arc.beat];
  if (!beat) {
    state.lifeArc = undefined;
    return [];
  }

  const lines: string[] = [];
  if (beat.location) state.character.location = beat.location;
  const affinity = mode === 'bond' ? beat.affinity + 6 : beat.affinity;
  const memory = mode === 'bond' && def.bondMemory ? def.bondMemory : beat.memory;
  lines.push(...rememberNpc(state, arc.npcId, memory, affinity));

  if (mode === 'bond') {
    arc.branch = 'bonded';
    state.character.flags[`arc_bond_${def.id}`] = true;
    lines.push('這段緣，你們認了。');
  }

  lines.push(applyArcReward(state, def.reward));

  arc.beat += 1;
  if (arc.beat >= arc.maxBeats) {
    markArcDone(state, def);
    if (arc.branch === 'bonded') {
      state.character.flags.legacy_friend = def.npcId;
      lines.push(`「${def.title}」落幕。來世若還記得，或許仍會撞見。`);
    } else {
      lines.push(`「${def.title}」這段因緣，暫且落幕。`);
    }
    state.lifeArc = undefined;
  } else {
    const rng = getRng();
    arc.monthsLeft = rng.nextInt(2, 5);
    lines.push(`下一段會面，約在 ${arc.monthsLeft} 個月後。`);
  }
  return lines;
}

/** 疏遠斷緣 */
export function resolveArcVisitSever(state: LifeGameState): string[] {
  const arc = state.lifeArc;
  if (!arc) return [];
  const def = getArcDef(arc.id);
  if (!def) {
    state.lifeArc = undefined;
    return [];
  }
  const lines = rememberNpc(state, arc.npcId, def.severMemory ?? '與你疏遠', -12);
  arc.branch = 'severed';
  markArcDone(state, def);
  state.character.flags[`arc_sever_${def.id}`] = true;
  state.lifeArc = undefined;
  lines.push(`你與「${def.title}」一筆勾了。有些燈，轉身就不看。`);
  return lines;
}

export function resolveArcVisitLater(state: LifeGameState): string[] {
  const arc = state.lifeArc;
  if (!arc) return [];
  const rng = getRng();
  arc.monthsLeft = rng.nextInt(1, 2);
  return [`你改日再訪。這段因緣暫緩 ${arc.monthsLeft} 個月。`];
}

export function lifeArcStatusLine(state: LifeGameState): string | null {
  const arc = state.lifeArc;
  if (!arc) return null;
  const npc = state.npcs[arc.npcId]?.name ?? '故人';
  const ready = arc.monthsLeft <= 0 ? '· 可往一見' : `· ${arc.monthsLeft}月後可再訪`;
  return `因緣「${arc.title}」· 與${npc}${ready}`;
}
