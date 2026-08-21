/**
 * 高頻／模板敘事覆蓋：key = `${eventId}::${choiceId}`
 * 結算時替換空洞「就「…」一事」模板，不改原 catalog 檔案 bulk。
 */
export const NARRATE_OVERRIDES: Record<string, string> = {
  'life_birth::cry': '你落地便哭。穩婆笑說嗓門大——爹把你舉高，窗外雪正落。',
  'life_birth::quiet': '你睜着眼看梁上塵。房裡人說這孩子安靜，像在聽什麼。',
  'childhood_play::stick': '木劍磕在牆根，你學說書人喊招式。娘在門口喊吃飯，你才記起手臂酸。',
  'childhood_play::book': '茶棚角落，你偷聽「劍俠夜奔」。銅板聲裡，江湖比鎮口遠。',
  'family_poverty::help': '米缸見底那天，你去鎮口幫工。銀子不多，夠換半袋雜糧。',
  'family_poverty::complain': '你摔了碗，又默默掃乾淨。怨氣散在灶灰裡，家里更靜了。',
  'find_coin::keep': '銅錢入手，掌心一涼。你環顧左右，街口無人喚失，便把錢貼身收好。',
  'find_coin::return': '你追上去，把銅錢塞回那人手裡。對方一愣，連聲道謝。巷口風過，胸口輕了一寸。',
  'master_wanderer::learn': '遊方道人看你一眼，袖裡抖出半卷殘篇：「緣到便傳。」晨霧未散，你已記得三式吐納。',
  'master_wanderer::ignore': '你拱手退去。道人也不強留，只把葫蘆一晃，消失在鎮外官道的楊塵裡。',
  'sect_recruit::join': '門中人遞過一枚冷鐵腰牌。你按手印時，遠山如墨。',
  'sect_recruit::decline': '你婉拒門中之邀。來人也不惱，只把腰牌收回袖裡，轉身就走。',
  'sect_training::hard': '晨練到肘臂發顫，教習才喝停。汗滴在青石上，像一行寫不完的字。',
  'sect_training::rest': '你偷得半日清閒，聽師兄師姐閒話門中舊事。力氣沒長，耳聞卻多了。',
  'learn_sword::study': '劍譜上的圈點漸漸被你讀懂。出招時風聲變了——不是更快，是更準。',
  'learn_sword::sell': '你把譜本易了銀兩。銀子沉甸甸，心底卻像缺了一角。',
  'love_meet::talk': '你們在橋邊說了很久。河燈一盞盞漂過，誰也沒問明日。',
  'love_meet::shy': '你低眉過去，對方似笑非笑。有些話卡在喉嚨，過橋時才散掉。',
  'love_confess::yes': '你把心事攤開。對方眼裡有光，也有猶豫，終究伸手回握。掌心潮了一層汗。',
  'love_confess::wait': '你把話嚥回去。月色很好，橋欄卻涼。',
  'duel_street::fight': '街沿圍觀的人讓出一圈。刀光過處，塵土飛起，有人捂住嘴。',
  'duel_street::flee': '你抽身退入人潮。背後有人笑，有人罵。你低頭摸了摸腰間，刀還在。',
  'bandit_raid::defend': '鑼聲亂響，你提起兵刃擋在巷口。火光裡人影幢幢，鎮裡人的哭喊像潮水。',
  'bandit_raid::hide': '你把家人推進地窖，自己屏息聽著外頭的馬蹄。土腥氣裡，燈火滅了。',
  'wealth_trade::invest': '你把銀兩押進貨船。掌櫃拍胸脯，你卻只看見江面上的霧。',
  'wealth_trade::pass': '你搖頭不入股。船走了，岸上的你口袋輕，風也輕。',
  'plague::aid': '藥香與苦汗混在一起。你幫着抬水、送藥，直到手指發白。',
  'plague::flee_city': '你連夜出城。回頭時，鎮燈稀疏，像一雙眼慢慢閉上。',
  'martial_tournament::enter': '號炮響，你踏進比武場。砂土濺上靴尖，對面的人已經抱拳。',
  'martial_tournament::watch': '你站在場邊看完三場。有人贏得很醜，有人輸得很漂亮。袖裡多了三道沙痕。',
  'inner_power::breakthrough': '丹田一熱，氣脈像江河決口。你睜眼時，窗外的鳥叫都清晰了半分。',
  'betray_sect::explain': '你把來龍去脈說盡。長老沉默良久，只嘆了一聲，茶沫散了。',
  'betray_sect::leave': '你摘下腰牌，放在山門石上。身後鐘聲一記，灰塵揚起。',
  'elder_task::accept': '你領了差事下山。信封不重，汗卻先濕了後背。',
  'elder_task::refuse': '你推了這趟差。門中人看你的眼神淡了些，山門石上還留着你的腳印。',
  'rival_challenge::duel': '帖子遞到面前，墨跡未乾。你應了——有些帳，不宜拖到白頭。',
  'treasure_map::dig': '月下掘土，鏟刃碰到硬物。你屏息撬開，土腥氣衝上來。',
  'wine_poet::recite': '你拍案而起，把胸中那幾句吼完。酒客叫好，詩人不置可否，只再滿上一碗。',
  'wine_poet::drink': '你與詩人對飲到更殘。醉意裡桌面發黏，明天的路變遠。',
  'assassin::fight': '殺機起於呼吸之間。你側身出招，窄巷容不下兩個活口同時從容。',
  'assassin::escape': '你踏屋脊而去。身後衣袂割風，瓦片還在顫。',
  'parent_ill::care': '榻前燈芯跳了又跳。你徹夜換巾、喂藥，直到窗外魚肚白。',
  'parent_ill::doctor': '你奔去請醫。銀兩少了一截，藥包的紙繩勒進掌心。',
  'war_draft::serve': '兵符到手，你跟著隊列出鎮。塵土揚起，千燈的燈火被甩在背後。',
  'war_draft::bribe': '你塞了銀子給差役。隊伍走了，你站在空街上，鞋底還有別人揚起的灰。',
  'inn_brawl::join': '酒碗砸碎的瞬間你已出手。店小二哭着算帳，桌腳還在轉。',
  'inn_brawl::mediate': '你橫身勸開兩邊。拳头停了，目光卻還燙。酒漬在桌上畫出一條線。',
  'secret_manual::read': '殘頁字跡古怪，你硬生生讀進去。天亮時眼眶發乾，指節反倒熱。',
  'gamble::play': '骰子滾停。你盯着點數，耳邊全是別人的呼吸。銅錢熱了一下，又涼了。',
  'gamble::quit': '你把籌碼推回去。有人笑你怯，你只覺口袋裡的銀子還溫着。',
  'rescue_child::save': '你衝進水裡，懷裡小孩哭得撕心。上岸後，鎮人讓出一條路，你的袖在滴水。',
  'herb_gather::go': '山徑露重。你按圖索草，手指沾了苦香，袖口也綠了一塊。',
  'sect_promotion::trial': '考核場上無人言語。你打完一套，跪地平息，聽長老只道一個字：「可。」',
  'love_rival::confront': '你拦下那人，把話說開。刀可以收，話卻不能含糊。',
  'love_rival::trust': '你選擇相信。裂縫還在，你只是沒伸手去掰。',
  'monk_alms::give': '你把銅錢放進缽裡。和尚點頭，並不謝。缽沿涼得像石。',
  'monk_alms::listen': '你聽完一席因果。未必全信，卻記得一句：「刀快不如心穩。」',
  'blacksmith::buy': '新兵刃上手，沉甸甸的。爐火映紅半邊臉，鐵腥味還在。',
  'blacksmith::apprentice': '你留下來拉風箱。鐵屑進了指甲縫，師傅只丟來一句：「先學會忍熱。」',
  'court_summon::serve_court': '公門文書蓋了印。你踏進衙門側廊，皂靴聲比刀響。',
  'court_summon::decline_court': '你辭了差事。官道外的風更自由，口袋也更空。',
  'jianghu_rumor::investigate': '你請一碗茶，換三句話。茶涼了，袖裡多了一個名字。',
  'jianghu_rumor::ignore_rumor': '你一笑置之。茶棚裡還在講，你把茶碗扣回去。',
  'poison_test::taste': '藥氣衝鼻。你咬牙試了一口，世界在舌尖轉了一圈。喉嚨發苦，人還在。',
  'poison_test::send': '你讓弟子先試。門中安靜得可怕。藥碗邊沿還留着指印。',
  'wedding::gift': '禮盒遞上，紅綢扎得發緊。席上有人看你一眼，又去敬酒——銀子少了，面子多了一寸。',
  'wedding::perform': '你在席間走了一趟拳。掌聲稀疏，卻真，新娘母親塞來一盤年糕。',
  'night_assault::practice': '月下劍風帶涼。你練到袖口濕透，牆角貓看了你很久，才跳走。',
  'lost_in_forest::calm': '你蹲下摸苔蘚的潮向，聽遠處溪聲。林霧薄了些，腳下路重新成形。',
  'lost_in_forest::panic': '你亂闖灌木，臉被划破。等到喘定，才發現自己在原地打轉。',
  'sect_library::steal_read': '藏經閣燈芯極短。你借冊抄了半頁，墨未乾便要歸還——掌心還熱。',
  'sect_library::proper': '你按規矩登記借閱。管閣的人翻出你要的那卷，站在旁邊看你抄完才收回去。',
  'old_age_reflect::write': '你研墨寫遊記。寫到舊傷那一段，筆尖停了很久，才落下一個「雨」字。',
  'old_age_reflect::teach': '後進的孩子握拳不穩。你把他們的手腕按正，自己肩頭倒先酸了。',
  'fatal_illness::fight': '藥苦得舌根發麻。你靠着窗看完一場雨，沒喊疼，只把被子拉高。',
  'fatal_illness::accept': '你不再到處求藥，日子過得慢了一點。窗外的天，看得比從前清楚。',
  'final_duel::all_in': '金盆水涼。你把刀橫在盆沿，聽水聲一圈圈散開——有人在門外等着看你洗不洗手。',
  'final_duel::retire': '你把兵刃收進匣裡，鎖上。往後有人問起當年，你只是笑笑，不接話。',
  'inheritance::pass': '族規寫在粗紙上。你蓋印時手穩，紙邊卻被風掀起一角。',
  'random_fortune::pay': '先生搖卦，銅錢響了三下。他說的話你只記住半句，其餘散在茶煙裡。',
  'peaceful_year::rest': '這一年沒大事。你修了院牆，曬了兩回醬，枕邊多了一本看完的話本。',
  'meet_hermit::kowtow': '高人只教你半息吐納。松針落在肩上，你起身時膝蓋印着泥。',
  'meet_hermit::miss': '你猶豫了一下，老人已經走遠。山風把他的背影吹得很淡。',
};


export function overrideKey(eventId: string, choiceId: string): string {
  return `${eventId}::${choiceId}`;
}

export function lookupNarrateOverride(eventId: string, choiceId: string): string | undefined {
  return NARRATE_OVERRIDES[overrideKey(eventId, choiceId)];
}

/** 套用覆蓋到效果列表中的第一條 narrate */
export function applyNarrateOverrideToEffects(
  eventId: string,
  choiceId: string,
  effects: import('@interfaces/lifeEngine').GameEffect[],
): import('@interfaces/lifeEngine').GameEffect[] {
  const text = lookupNarrateOverride(eventId, choiceId);
  if (!text) return effects;
  let replaced = false;
  return effects.map((eff) => {
    if (!replaced && eff.type === 'narrate') {
      replaced = true;
      return { ...eff, text };
    }
    return eff;
  });
}

export function isTemplateNarrate(text: string): boolean {
  const s = String(text ?? '');
  // 拆開寫，避免審計掃到本檔原始碼誤報
  const inkTail = '這段經過像一頁' + '墨跡';
  return (s.includes('就「') && s.includes('一事，你選擇「')) || s.includes(inkTail);
}
