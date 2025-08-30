
const CSV_URL = 'data.csv';
const qs = (s,el=document)=>el.querySelector(s);
const qsa = (s,el=document)=>[...el.querySelectorAll(s)];

// Simple CSV parser (quoted fields supported)
function parseCSV(text){
  const rows=[];let row=[],cell='',inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(inQuotes){
      if(c==='"'&&n==='"'){cell+='"';i++;}
      else if(c==='"'){inQuotes=false;}
      else{cell+=c;}
    }else{
      if(c==='"'){inQuotes=true;}
      else if(c===','){row.push(cell);cell='';}
      else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';}
      else if(c==='\r'){} else {cell+=c;}
    }
  }
  if(cell.length||row.length){row.push(cell);rows.push(row);}
  const headers=rows.shift()||[];
  return {headers,rows};
}

function highlight(text,q){
  if(!q)return text;
  const esc=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return text.replace(new RegExp(esc,'gi'),m=>`<mark>${m}</mark>`);
}

const state={headers:[],rows:[],filtered:[],sortKey:null,sortDir:1};

function renderHead(){
  const head=qs('#headRow');head.innerHTML='';
  state.headers.forEach((h,i)=>{
    const th=document.createElement('th');
    th.innerHTML=`<span>${h}</span> <span class="sort">↕</span>`;
    th.onclick=()=>sortBy(i);
    head.appendChild(th);
  });
}

function renderBody(){
  const tb=qs('#bodyRows');
  const q=qs('#q').value.trim();
  tb.innerHTML='';
  const frag=document.createDocumentFragment();
  state.filtered.forEach(r=>{
    const tr=document.createElement('tr');
    r.forEach(c=>{
      const td=document.createElement('td');
      td.innerHTML=highlight(String(c??''),q);
      tr.appendChild(td);
    });
    frag.appendChild(tr);
  });
  tb.appendChild(frag);
  qs('#counter').textContent=`${state.filtered.length} kayıt`;
}

function applyFilter(){
  const q=qs('#q').value.toLowerCase().trim();
  state.filtered = !q ? [...state.rows] :
    state.rows.filter(r=>r.some(c=>String(c).toLowerCase().includes(q)));
  if(state.sortKey!=null){sortBy(state.sortKey,true);}
  renderBody();
}

function sortBy(i,keep=false){
  if(!keep){
    state.sortDir = (state.sortKey===i? -state.sortDir:1);
    state.sortKey=i;
  }
  state.filtered.sort((a,b)=>{
    const A=String(a[i]??'').toLowerCase();
    const B=String(b[i]??'').toLowerCase();
    return state.sortDir*((A>B)-(A<B));
  });
  qsa('thead th .sort').forEach((el,j)=>{
    el.textContent=j===i?(state.sortDir===1?'↑':'↓'):'↕';
  });
  renderBody();
}

async function initDict(){
  try{
    const resp = await fetch(CSV_URL);
    if(!resp.ok) throw new Error('CSV yüklenemedi: '+resp.status);
    const text = await resp.text();
    const parsed = parseCSV(text.replace(/^\uFEFF/,''));
    state.headers=parsed.headers;
    state.rows=parsed.rows;
    state.filtered=[...state.rows];
    renderHead();
    renderBody();
    qs('#q').addEventListener('input',applyFilter);
  }catch(e){
    qs('#bodyRows').innerHTML=`<tr><td>Hata: ${e.message}</td></tr>`;
  }
}

export { initDict };
