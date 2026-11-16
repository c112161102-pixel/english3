(function(){
  const $ = id => document.getElementById(id);
  const POS = {n:'n',noun:'n',v:'v',verb:'v',adj:'adj',adjective:'adj',adv:'adv',adverb:'adv',prep:'prep',preposition:'prep',conj:'conj',conjunction:'conj',pron:'pron',pronoun:'pron',interj:'interj',det:'det'};
  const normPos = s => { s = s.trim().toLowerCase().replace(/[.\s]/g,''); return POS[s] || s; };
  const showPos = s => { const k = normPos(s); return k ? k + '.' : ''; };

  let words = [];
  try { words = JSON.parse(localStorage.getItem('vocab-words') || '[]'); } catch(e){ words = []; }
  if (!Array.isArray(words)) words = [];
  const save = () => { try { localStorage.setItem('vocab-words', JSON.stringify(words)); } catch(e){} };

  let cur = null, answered = false, slow = false, ok = 0, bad = 0, streak = 0, lastIdx = -1;

  function speak(text){
    if (!('speechSynthesis' in window)) { feedback('info','這個瀏覽器不支援語音播放'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = slow ? 0.55 : 0.9;
    const v = speechSynthesis.getVoices().find(v => /^en[-_]US/i.test(v.lang)) || speechSynthesis.getVoices().find(v => /^en/i.test(v.lang));
    if (v) u.voice = v;
    const btn = $('playBtn'); btn.classList.add('speaking');
    u.onend = u.onerror = () => btn.classList.remove('speaking');
    speechSynthesis.speak(u);
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

  function feedback(type, msg){ const f = $('fb'); f.className = 'feedback ' + type; f.textContent = msg; }
  function clearFb(){ $('fb').className = 'feedback'; $('fb').textContent = ''; }

  function renderList(){
    const ul = $('list'); ul.innerHTML = '';
    if (!words.length){ ul.innerHTML = '<li class="empty" style="justify-content:center">還沒有單字，從上方開始加入</li>'; return; }
    words.forEach((it, i) => {
      const li = document.createElement('li');
      const w = document.createElement('span'); w.className = 'w'; w.textContent = it.w;
      const t = document.createElement('span'); t.className = 'tag'; t.textContent = showPos(it.p) || '—';
      const d = document.createElement('button'); d.className = 'icon'; d.textContent = '×'; d.setAttribute('aria-label','刪除 ' + it.w);
      d.onclick = () => { words.splice(i,1); save(); renderList(); if (cur && cur.w === it.w) next(); };
      li.append(w,t,d); ul.appendChild(li);
    });
  }

  function next(){
    clearFb(); $('spell').value = ''; $('pos').value = ''; answered = false;
    if (!words.length){ cur = null; $('hint').textContent = '先在右邊加入單字吧'; return; }
    let i = Math.floor(Math.random()*words.length);
    if (words.length > 1 && i === lastIdx) i = (i + 1) % words.length;
    lastIdx = i; cur = words[i];
    $('hint').textContent = '按下馬卡龍聽發音';
    speak(cur.w);
    $('spell').focus();
  }

  function check(){
    if (!cur){ feedback('info','請先加入單字'); return; }
    if (answered){ next(); return; }
    const sp = $('spell').value.trim().toLowerCase();
    if (!sp){ feedback('info','請先輸入拼寫'); return; }
    const spOk = sp === cur.w.toLowerCase();
    const posOk = !cur.p || normPos($('pos').value) === normPos(cur.p);
    answered = true;
    if (spOk && posOk){ ok++; streak++; feedback('ok','答對了！' + cur.w + '（' + showPos(cur.p) + '）'); }
    else {
      bad++; streak = 0;
      const parts = [];
      if (!spOk) parts.push('拼寫應為 ' + cur.w);
      if (!posOk) parts.push('詞性應為 ' + showPos(cur.p));
      feedback('bad','再試試看：' + parts.join('，'));
    }
    $('sOk').textContent = ok; $('sBad').textContent = bad; $('sStreak').textContent = streak;
  }

  function add(){
    const w = $('nw').value.trim(), p = $('np').value.trim();
    if (!/^[A-Za-z][A-Za-z'\- ]*$/.test(w)){ $('nw').focus(); return; }
    if (words.some(x => x.w.toLowerCase() === w.toLowerCase())) { $('nw').value=''; return; }
    words.push({w, p: normPos(p)}); save(); renderList();
    $('nw').value = ''; $('np').value = ''; $('nw').focus();
    if (!cur) next();
  }

  $('playBtn').onclick = () => { if (cur) speak(cur.w); else if (words.length) next(); else feedback('info','先加入單字再來練習'); };
  $('checkBtn').onclick = check;
  $('nextBtn').onclick = next;
  $('addBtn').onclick = add;
  $('slowBtn').onclick = e => { slow = !slow; e.target.textContent = '慢速：' + (slow ? '開' : '關'); e.target.setAttribute('aria-pressed', slow); };
  ['spell','pos'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
  ['nw','np'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') add(); }));

  renderList();
  if (words.length) $('hint').textContent = '按下馬卡龍開始，會隨機出題';
})();
