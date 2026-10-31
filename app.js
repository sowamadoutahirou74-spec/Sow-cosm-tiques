(function(){
'use strict';
/* ═════ Réglages boutique ═════ */
var SHOP={name:'ATS Cosmétiques & Technologie',whatsapp:'224629015548',phone:'+224 629 01 55 48'};
var PAY={cash:'À la livraison',orange:'Orange Money',mtn:'MTN MoMo'};
var STATUS={sent:'Envoyée sur WhatsApp',confirmed:'Confirmée',delivered:'Livrée',cancelled:'Annulée'};

/* ═════ Outils ═════ */
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' FG'}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function hash(s){var h1=0xdeadbeef,h2=0x41c6ce57,ch;s='ats|'+s;for(var i=0;i<s.length;i++){ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return String(4294967296*(2097151&h2)+(h1>>>0))}
var tT;
function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tT);tT=setTimeout(function(){t.classList.remove('show')},2600)}
function waLink(text){return 'https://wa.me/'+SHOP.whatsapp+(text?'?text='+encodeURIComponent(text):'')}
function fileToJpeg(file,max,q){return new Promise(function(res,rej){var r=new FileReader();r.onerror=rej;r.onload=function(){var im=new Image();im.onerror=rej;im.onload=function(){var s=Math.min(1,max/Math.max(im.width,im.height));var c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',q))};im.src=r.result};r.readAsDataURL(file)})}

/* ═════ Fenêtres ═════ */
var stack=[];
function lockBody(){document.body.classList.toggle('locked',stack.length>0||!$('#welcome').hidden)}
function modal(title,cls){
  var prev=document.activeElement;
  var wrap=document.createElement('div');wrap.className=cls||'modal';
  wrap.innerHTML='<div class="modal-box" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modal-top"><h2>'+esc(title)+'</h2><button class="x-btn" type="button" aria-label="Fermer">×</button></div><div class="mbody"></div></div>';
  $('#layers').appendChild(wrap);
  var layer={el:wrap,body:$('.mbody',wrap),close:function(){var i=stack.indexOf(layer);if(i>=0)stack.splice(i,1);wrap.remove();lockBody();if(prev&&prev.focus)try{prev.focus()}catch(e){}}};
  $('.x-btn',wrap).onclick=layer.close;
  wrap.addEventListener('mousedown',function(e){if(e.target===wrap)layer.close()});
  stack.push(layer);lockBody();$('.x-btn',wrap).focus();
  return layer;
}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&stack.length)stack[stack.length-1].close()});

/* ═════ Médias ═════ */
var MEDIA=JSON.parse($('#media').textContent);
$$('[data-media]').forEach(function(i){var s=MEDIA[i.getAttribute('data-media')];if(s)i.src=s});

/* ═════ Écran de bienvenue ═════ */
(function(){
  var w=$('#welcome'),seen=false;
  try{seen=sessionStorage.getItem('ats_w')==='1'}catch(e){}
  if(!seen){w.hidden=false;lockBody();$('#wgo').focus()}
  $('#wgo').onclick=function(){w.classList.add('out');setTimeout(function(){w.hidden=true;lockBody()},450);try{sessionStorage.setItem('ats_w','1')}catch(e){}};
})();

/* ═════ Catalogue (fichier + modifications locales) ═════ */
var BASE=JSON.parse($('#catalog').textContent);
var LSK='ats_local_v2';
var local=lsGet(LSK,null);
if(!local||local.baseRev!==BASE.rev)local={baseRev:BASE.rev,added:[],edits:{},zones:null,pass:null};
function saveLocal(){if(!lsSet(LSK,local)){toast('Mémoire du navigateur pleine : supprimez des photos.');return false}return true}
function allProducts(){
  var out=BASE.products.map(function(p){return Object.assign({},p,local.edits[p.id]||{})});
  return out.concat(local.added).filter(function(p){return !p.deleted});
}
function visibleProducts(){return allProducts().filter(function(p){return !p.hidden})}
function zones(){return local.zones||BASE.zones}
function passHash(){return local.pass||BASE.pass||hash('1234')}
function getP(id){return allProducts().filter(function(p){return p.id===id})[0]}
function mutate(id,patch){
  var a=local.added.filter(function(p){return p.id===id})[0];
  if(a)Object.assign(a,patch);else local.edits[id]=Object.assign(local.edits[id]||{},patch);
  return saveLocal();
}
function removeP(id){
  var i=-1;local.added.forEach(function(p,k){if(p.id===id)i=k});
  if(i>=0)local.added.splice(i,1);else mutate(id,{deleted:true});
  return saveLocal();
}
function isDirty(){return local.added.length>0||Object.keys(local.edits).length>0||!!local.zones||!!local.pass}

/* ═════ Panier ═════ */
var cart=lsGet('ats_cart',{});
function saveCart(){lsSet('ats_cart',cart)}
function lines(){
  var out=[];
  Object.keys(cart).forEach(function(id){var p=getP(id);if(p&&!p.hidden&&!p.soldout&&p.price)out.push({p:p,q:cart[id]})});
  return out;
}
function addToCart(id,d){var p=getP(id);if(!p||p.soldout||!p.price)return;cart[id]=Math.min(99,(cart[id]||0)+(d||1));if(cart[id]<=0)delete cart[id];saveCart();renderCart();toast('✓ '+p.name+' ajouté au panier')}
function setQty(id,q){if(q<=0)delete cart[id];else cart[id]=Math.min(99,q);saveCart();renderCart()}
function count(){return lines().reduce(function(s,l){return s+l.q},0)}
function subtotal(){return lines().reduce(function(s,l){return s+l.q*l.p.price},0)}
function curZone(){var n=$('#fZone').value;return zones().filter(function(z){return z.name===n})[0]||null}
var payMode='cash';

function renderCart(){
  var L=lines(),c=count();
  $('#navCount').textContent=c;$('#fabCount').textContent=c;$('#fabCount').hidden=c===0;
  var h='<h3>Mon panier</h3>';
  if(!L.length){h+='<p class="sub">Votre panier est vide. Ajoutez des produits depuis la boutique.</p><p style="margin-top:14px"><a class="btn-primary" href="#produits">Voir les produits</a></p>'}
  else{
    L.forEach(function(l){
      h+='<div class="line"><div class="nm"><strong>'+esc(l.p.name)+'</strong><div class="sub">'+fmt(l.p.price)+'</div></div>'+
      '<div class="qty"><button type="button" data-q="-1" data-id="'+esc(l.p.id)+'" aria-label="Moins">−</button><strong aria-label="Quantité">'+l.q+'</strong><button type="button" data-q="1" data-id="'+esc(l.p.id)+'" aria-label="Plus">+</button></div>'+
      '<strong>'+fmt(l.q*l.p.price)+'</strong><button class="link" type="button" data-rm="'+esc(l.p.id)+'">Retirer</button></div>';
    });
    var z=curZone(),fee=z?z.fee:0,sub=subtotal();
    h+='<div class="tot"><span>Sous-total</span><span>'+fmt(sub)+'</span></div>';
    h+='<div class="tot"><span>Livraison'+(z?' ('+esc(z.name)+')':'')+'</span><span>'+(!z?'—':(fee>0?fmt(fee):'à confirmer'))+'</span></div>';
    h+='<div class="tot big"><span>Total</span><span>'+fmt(sub+fee)+(fee>0?'':' + livraison')+'</span></div>';
  }
  $('#cartPanel').innerHTML=h;
  $('#orderForm').hidden=!L.length&&!$('#donePanel').hidden;
}
$('#cartPanel').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  if(b.dataset.q)addToCart(b.dataset.id,+b.dataset.q);
  else if(b.dataset.rm)setQty(b.dataset.rm,0);
});
function fillZones(){
  var s=$('#fZone'),cur=s.value;
  s.innerHTML='<option value="">— Choisir la commune —</option>'+zones().map(function(z){return '<option value="'+esc(z.name)+'">'+esc(z.name)+(z.fee>0?' — '+fmt(z.fee):' — frais à confirmer')+'</option>'}).join('');
  if(cur)s.value=cur;
}
$('#fZone').addEventListener('change',renderCart);
$('#payBtns').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;payMode=b.dataset.p;$$('#payBtns button').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')})});

/* ═════ Envoi de la commande ═════ */
function newNo(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return 'ATS-'+String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+'-'+String(Math.floor(1000+Math.random()*9000))}
function buildMsg(o){
  var t='Bonjour '+SHOP.name+', je voudrais passer une commande.\n\n🧾 Commande N° '+o.no+'\n\n📦 Détails de ma commande\n';
  o.items.forEach(function(i){t+='• '+i.qty+' × '+i.name+' — '+fmt(i.qty*i.price)+'\n'});
  t+='\nSous-total : '+fmt(o.sub)+'\nLivraison ('+o.zone+') : '+(o.fee>0?fmt(o.fee):'à confirmer')+'\n💰 TOTAL : '+fmt(o.total)+(o.fee>0?'':' + livraison')+'\n';
  t+='\n💳 Mode de paiement : '+PAY[o.pay]+'\n\n👤 Mes informations\nNom : '+o.name+'\nTéléphone : '+o.phone+'\nCommune : '+o.zone+'\nRepère : '+o.addr+'\n';
  if(o.note)t+='Remarque : '+o.note+'\n';
  return t;
}
function formErr(m){var e=$('#formErr');e.textContent=m;e.hidden=!m;if(m)e.scrollIntoView({block:'center',behavior:'smooth'})}
$('#orderForm').addEventListener('submit',function(e){
  e.preventDefault();
  var L=lines();if(!L.length){formErr('Votre panier est vide.');return}
  var name=$('#fName').value.trim(),phone=$('#fPhone').value.trim(),addr=$('#fAddr').value.trim(),z=curZone();
  if(name.length<2){formErr('Veuillez écrire votre nom.');$('#fName').focus();return}
  if(phone.replace(/\D/g,'').length<8){formErr('Veuillez écrire un numéro de téléphone valide.');$('#fPhone').focus();return}
  if(!z){formErr('Veuillez choisir votre commune.');$('#fZone').focus();return}
  if(addr.length<3){formErr('Veuillez indiquer votre quartier ou un repère.');$('#fAddr').focus();return}
  formErr('');
  var sub=subtotal(),fee=z.fee||0;
  var o={no:newNo(),date:Date.now(),name:name,phone:phone,zone:z.name,addr:addr,pay:payMode,note:$('#fNote').value.trim(),
    items:L.map(function(l){return {id:l.p.id,name:l.p.name,qty:l.q,price:l.p.price}}),sub:sub,fee:fee,total:sub+fee,status:'sent'};
  var orders=lsGet('ats_orders',[]);orders.unshift(o);lsSet('ats_orders',orders);
  var msg=buildMsg(o);
  try{window.open(waLink(msg),'_blank','noopener')}catch(x){}
  cart={};saveCart();renderCart();$('#orderForm').reset();payMode='cash';$$('#payBtns button').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.p==='cash'?'true':'false')});
  showDone(o,msg);
});
function showDone(o,msg){
  var d=$('#donePanel');d.hidden=false;$('#orderCols').hidden=true;
  d.innerHTML='<div class="panel done"><h3>✅ Commande prête : N° '+esc(o.no)+'</h3>'+
  '<div class="notice"><strong>Dernière étape :</strong> dans WhatsApp, appuyez sur <strong>Envoyer</strong>. Tant que le message n’est pas envoyé, nous ne recevons pas votre commande.</div>'+
  '<pre>'+esc(msg)+'</pre>'+
  '<div class="actions"><a class="btn-wa" href="'+esc(waLink(msg))+'" target="_blank" rel="noopener">💬 Ouvrir WhatsApp</a><button class="btn-outline" type="button" id="cpMsg">📋 Copier le message</button><button class="btn-outline" type="button" id="backShop">Continuer mes achats</button></div>'+
  '<p class="sub" style="margin-top:14px">Gardez ce numéro : <strong>'+esc(o.no)+'</strong>. Vous le retrouvez avec « Suivre ma commande ».</p></div>';
  $('#cpMsg').onclick=function(){if(navigator.clipboard)navigator.clipboard.writeText(msg).then(function(){toast('Message copié')},function(){toast('Copie impossible')});else toast('Copie impossible')};
  $('#backShop').onclick=function(){d.hidden=true;d.innerHTML='';$('#orderCols').hidden=false;renderCart();location.hash='#produits'};
  d.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ═════ Mes commandes (sur cet appareil) ═════ */
function openMyOrders(){
  var m=modal('Mes commandes'),orders=lsGet('ats_orders',[]);
  if(!orders.length){m.body.innerHTML='<p class="sub">Aucune commande enregistrée sur cet appareil.</p>';return}
  var h='<p class="sub" style="margin-bottom:12px">Ces commandes ont été préparées depuis cet appareil. Pour connaître l’état réel de la livraison, écrivez-nous sur WhatsApp avec votre numéro.</p>';
  orders.forEach(function(o){
    var q='Bonjour, je voudrais des nouvelles de ma commande N° '+o.no+' ('+o.name+', '+o.phone+').';
    h+='<div class="ord"><header><strong>'+esc(o.no)+'</strong><span class="badge sent">'+esc(STATUS.sent)+'</span></header><div class="sub">'+new Date(o.date).toLocaleString('fr-FR')+'</div><ul>'+o.items.map(function(i){return '<li>'+i.qty+' × '+esc(i.name)+'</li>'}).join('')+'</ul><div><strong>Total : '+fmt(o.total)+(o.fee>0?'':' + livraison')+'</strong></div><p style="margin-top:10px"><a class="btn-wa" style="min-height:44px;padding:10px 18px" href="'+esc(waLink(q))+'" target="_blank" rel="noopener">💬 Demander le suivi</a></p></div>';
  });
  m.body.innerHTML=h;
}
$('#myOrdersBtn').onclick=openMyOrders;$('#myOrdersBtn2').onclick=openMyOrders;

/* ═════ Visionneuse photos ═════ */
function openLightbox(p,start){
  var ph=p.photos||[];if(!ph.length)return;
  var prev=document.activeElement,i=start||0;
  var el=document.createElement('div');el.className='lb';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Photos de '+p.name);
  el.innerHTML='<div class="lb-top"><div class="lb-title">'+esc(p.name)+'</div><div class="lb-count"></div><button class="x-btn" type="button" aria-label="Fermer">×</button></div>'+
  '<div class="lb-main"><div class="lb-strip">'+ph.map(function(s,k){return '<div><img alt="'+esc(p.name)+' — photo '+(k+1)+'"></div>'}).join('')+'</div>'+
  (ph.length>1?'<button class="lb-nav prev" type="button" aria-label="Photo précédente">‹</button><button class="lb-nav next" type="button" aria-label="Photo suivante">›</button>':'')+'</div>'+
  (ph.length>1?'<div class="lb-thumbs">'+ph.map(function(s,k){return '<button type="button" aria-label="Photo '+(k+1)+'"><img alt=""></button>'}).join('')+'</div>':'');
  $$('.lb-strip img',el).forEach(function(im,k){im.src=ph[k]});$$('.lb-thumbs img',el).forEach(function(im,k){im.src=ph[k]});
  $('#layers').appendChild(el);
  var strip=$('.lb-strip',el),layer={el:el,close:function(){var k=stack.indexOf(layer);if(k>=0)stack.splice(k,1);el.remove();lockBody();if(prev&&prev.focus)try{prev.focus()}catch(e){}}};
  stack.push(layer);lockBody();
  function sync(){$('.lb-count',el).textContent=ph.length>1?(i+1)+' / '+ph.length:'';var pv=$('.prev',el),nx=$('.next',el);if(pv){pv.disabled=i===0;nx.disabled=i===ph.length-1}$$('.lb-thumbs button',el).forEach(function(b,k){b.setAttribute('aria-current',k===i?'true':'false')})}
  function go(k){i=Math.max(0,Math.min(ph.length-1,k));strip.scrollTo({left:i*strip.clientWidth,behavior:'smooth'});sync()}
  $('.x-btn',el).onclick=layer.close;
  var pv=$('.prev',el),nx=$('.next',el);if(pv){pv.onclick=function(){go(i-1)};nx.onclick=function(){go(i+1)}}
  $$('.lb-thumbs button',el).forEach(function(b,k){b.onclick=function(){go(k)}});
  strip.addEventListener('scroll',function(){var k=Math.round(strip.scrollLeft/strip.clientWidth);if(k!==i){i=k;sync()}});
  strip.scrollLeft=i*strip.clientWidth;sync();$('.x-btn',el).focus();
}

/* ═════ Boutique ═════ */
var grp='all',query='';
function cardHTML(p){
  var ph=p.photos||[],img;
  if(!ph.length)img='<div class="ph" aria-hidden="true">'+(p.group==='informatique'?'💻':'🌿')+'</div>';
  else img='<div class="gal"><div class="strip" data-zoom="'+esc(p.id)+'">'+ph.map(function(s,k){return '<img data-s="'+k+'" alt="'+esc(p.name)+(ph.length>1?' — photo '+(k+1):'')+'" loading="lazy">'}).join('')+'</div>'+(ph.length>1?'<div class="dots">'+ph.map(function(s,k){return '<i'+(k===0?' class="on"':'')+'></i>'}).join('')+'</div>':'')+'<span class="zoomtag">🔍'+(ph.length>1?' '+ph.length:'')+'</span></div>';
  var long=(p.desc||'').length>110;
  var act;
  if(p.soldout)act='<button class="add-btn" disabled>Indisponible</button>';
  else if(!p.price)act='<a class="add-btn" target="_blank" rel="noopener" href="'+esc(waLink('Bonjour, je voudrais le prix et la disponibilité de : '+p.name))+'">💬 Demander</a>';
  else act='<button class="add-btn" type="button" data-add="'+esc(p.id)+'">+ Ajouter</button>';
  return '<article class="prod-card'+(p.soldout?' off':'')+'" data-id="'+esc(p.id)+'"><div class="prod-img-wrap">'+img+(p.badge?'<span class="prod-badge'+(p.badge==='Promo'?' promo':'')+'">'+esc(p.badge)+'</span>':'')+'</div>'+
  '<div class="prod-info"><span class="prod-cat">'+esc(p.cat)+'</span><h3 class="prod-name">'+esc(p.name)+'</h3>'+(p.soldout?'<span class="rupture">Rupture de stock</span>':'')+
  '<p class="desc'+(long?' clamp':'')+'">'+esc(p.desc)+'</p>'+(long?'<button class="more" type="button" data-more aria-expanded="false">Voir plus</button>':'')+
  '<div class="prod-footer"><span class="prod-price'+(p.price?'':' ask')+'">'+(p.price?fmt(p.price):'Sur demande')+'</span>'+act+'</div></div></article>';
}
function renderProducts(){
  var q=norm(query).trim(),list=visibleProducts().filter(function(p){
    if(grp!=='all'&&p.group!==grp)return false;
    return !q||norm(p.name+' '+p.cat+' '+p.desc).indexOf(q)>=0;
  });
  var g=$('#prodGrid');
  g.innerHTML=list.length?list.map(cardHTML).join(''):'<p class="empty-msg">Aucun produit trouvé. <a href="'+esc(waLink('Bonjour, je cherche : '+query))+'" target="_blank" rel="noopener" style="color:var(--gold)">Demandez-nous sur WhatsApp</a>.</p>';
  $$('.strip img',g).forEach(function(im){var id=im.closest('.prod-card').dataset.id,p=getP(id);im.src=p.photos[+im.dataset.s]});
}
$('#prodGrid').addEventListener('click',function(e){
  var t=e.target;
  var a=t.closest('[data-add]');if(a){addToCart(a.dataset.add,1);return}
  var m=t.closest('[data-more]');if(m){var d=m.previousElementSibling,open=d.classList.toggle('clamp')===false;m.textContent=open?'Voir moins':'Voir plus';m.setAttribute('aria-expanded',open?'true':'false');return}
  var s=t.closest('.strip');if(s){var p=getP(s.dataset.zoom),im=t.closest('img');if(p)openLightbox(p,im?+im.dataset.s:0)}
});
$('#prodGrid').addEventListener('scroll',function(e){
  var s=e.target;if(!s.classList||!s.classList.contains('strip'))return;
  var k=Math.round(s.scrollLeft/s.clientWidth);$$('.dots i',s.parentNode).forEach(function(d,n){d.classList.toggle('on',n===k)});
},true);
function setGroup(g){grp=g;$$('#tabs button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.g===g?'true':'false')});renderProducts()}
$('#tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setGroup(b.dataset.g)});
$('#q').addEventListener('input',function(){query=this.value;renderProducts()});
$$('[data-go]').forEach(function(el){el.addEventListener('click',function(ev){var g=el.dataset.go;setGroup(g);if(el.tagName!=='A'){document.getElementById('produits').scrollIntoView({behavior:'smooth'})}})});

/* ═════ Espace vendeur (sous le logo) ═════ */
var tries=0,lockUntil=0,vendorOpen=false;
$('#logoAdmin').onclick=function(){if(vendorOpen)return;openLogin()};
function openLogin(){
  var m=modal('Espace vendeur');
  m.body.innerHTML='<p class="sub" style="margin-bottom:12px">Entrez votre mot de passe.</p><div id="lErr" class="err" role="alert" hidden></div><form id="lForm"><label class="f">Mot de passe<input class="in" type="password" id="lPw" autocomplete="current-password" required></label><button class="btn-primary" type="submit" style="width:100%">Entrer</button></form>';
  $('#lPw').focus();
  $('#lForm').onsubmit=function(e){
    e.preventDefault();
    var er=$('#lErr');
    if(Date.now()<lockUntil){er.textContent='Trop d’essais. Patientez '+Math.ceil((lockUntil-Date.now())/1000)+' secondes.';er.hidden=false;return}
    if(hash($('#lPw').value)===passHash()){m.close();openVendor()}
    else{tries++;if(tries>=5){lockUntil=Date.now()+30000;tries=0}er.textContent='Mot de passe incorrect.';er.hidden=false;$('#lPw').select()}
  };
}
function openVendor(){
  vendorOpen=true;
  var wrap=document.createElement('div');wrap.className='vendor';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label','Espace vendeur');
  wrap.innerHTML='<div class="v-wrap"><div class="v-top"><h2>Espace vendeur</h2><button class="x-btn" type="button" aria-label="Fermer">×</button></div><div class="v-tabs" role="group" aria-label="Sections"></div><div id="vBody"></div></div>';
  $('#layers').appendChild(wrap);
  var layer={el:wrap,close:function(){var k=stack.indexOf(layer);if(k>=0)stack.splice(k,1);wrap.remove();vendorOpen=false;lockBody();fillZones();renderCart();renderProducts();$('#logoAdmin').focus()}};
  stack.push(layer);lockBody();$('.x-btn',wrap).onclick=layer.close;
  var tabs=[['prod','📦 Produits'],['ord','🧾 Commandes'],['set','⚙️ Réglages'],['pub','🚀 Publier']],cur='prod';
  var tb=$('.v-tabs',wrap);
  tb.innerHTML=tabs.map(function(t){return '<button type="button" data-t="'+t[0]+'" aria-pressed="'+(t[0]===cur)+'">'+t[1]+'</button>'}).join('');
  tb.onclick=function(e){var b=e.target.closest('button');if(b)show(b.dataset.t)};
  var body=$('#vBody',wrap);
  function show(t){cur=t;$$('button',tb).forEach(function(b){b.setAttribute('aria-pressed',b.dataset.t===t?'true':'false')});({prod:vProducts,ord:vOrders,set:vSettings,pub:vPublish})[t](body,show);wrap.scrollTop=0}
  show('prod');$('.x-btn',wrap).focus();
}
function dirtyBanner(){return isDirty()?'<div class="dirty">⚠️ Vous avez des modifications <strong>sur cet appareil seulement</strong>. Vos clients ne les voient pas encore. Allez dans « 🚀 Publier » pour les mettre en ligne.</div>':''}

function vProducts(body,show){
  var L=allProducts();
  var h=dirtyBanner()+'<p style="margin-bottom:14px"><button class="v-btn" type="button" id="vAdd">+ Ajouter un produit</button></p>';
  L.forEach(function(p){
    var th=(p.photos&&p.photos[0])?'<img class="th" data-th="'+esc(p.id)+'" alt="">':'<div class="th">'+(p.group==='informatique'?'💻':'🌿')+'</div>';
    h+='<div class="v-prod" data-id="'+esc(p.id)+'">'+th+'<div class="info"><strong>'+esc(p.name)+'</strong><div class="sub">'+(p.price?fmt(p.price):'Sur demande')+' · '+esc(p.cat)+'</div><div class="sub">'+(p.hidden?'🙈 Masqué ':'')+(p.soldout?'⛔ Rupture':'')+(!p.hidden&&!p.soldout?'✅ En vente':'')+'</div></div><div class="acts"><button class="v-btn ghost" data-a="edit">Modifier</button><button class="v-btn ghost" data-a="hide">'+(p.hidden?'Afficher':'Masquer')+'</button><button class="v-btn ghost" data-a="sold">'+(p.soldout?'Remis en stock':'Rupture')+'</button><button class="v-btn danger" data-a="del">Supprimer</button></div></div>';
  });
  body.innerHTML=h;
  $$('[data-th]',body).forEach(function(im){im.src=getP(im.dataset.th).photos[0]});
  $('#vAdd',body).onclick=function(){vForm(body,show,null)};
  body.onclick=function(e){
    var b=e.target.closest('[data-a]');if(!b)return;
    var id=b.closest('.v-prod').dataset.id,p=getP(id),a=b.dataset.a;
    if(a==='edit')vForm(body,show,p);
    else if(a==='hide'){mutate(id,{hidden:!p.hidden});vProducts(body,show)}
    else if(a==='sold'){mutate(id,{soldout:!p.soldout});vProducts(body,show)}
    else if(a==='del'){if(confirm('Supprimer « '+p.name+' » ?')){removeP(id);vProducts(body,show)}}
  };
}
function vForm(body,show,p){
  var photos=(p&&p.photos?p.photos.slice():[]);
  body.onclick=null;
  body.innerHTML='<div class="v-card"><h3 style="margin-bottom:12px">'+(p?'Modifier le produit':'Nouveau produit')+'</h3><div id="pErr" class="err" role="alert" hidden></div>'+
  '<label class="f">Nom du produit<input class="in" id="pName" maxlength="90"></label>'+
  '<div class="v-grid"><label class="f">Boutique<select class="in" id="pGroup"><option value="informatique">Informatique</option><option value="longrich">Longrich</option></select></label>'+
  '<label class="f">Catégorie<input class="in" id="pCat" maxlength="40" placeholder="Ex. Soins de la peau"></label>'+
  '<label class="f">Prix en FG (vide = sur demande)<input class="in" id="pPrice" type="number" inputmode="numeric" min="0" step="1"></label>'+
  '<label class="f">Étiquette<select class="in" id="pBadge"><option value="">Aucune</option><option>Nouveau</option><option>Populaire</option><option>Promo</option><option>Bestseller</option><option>Spécial</option></select></label></div>'+
  '<label class="f">Description<textarea class="in" id="pDesc" maxlength="600"></textarea></label>'+
  '<div class="f" style="gap:2px"><span>Photos (la première est la photo principale)</span></div><div class="photos" id="pPhotos"></div>'+
  '<label class="v-btn ghost" style="display:inline-flex;align-items:center;margin-bottom:16px;cursor:pointer">📷 Ajouter des photos<input id="pFile" type="file" accept="image/*" multiple hidden></label>'+
  '<div class="v-row"><button class="v-btn" type="button" id="pSave">Enregistrer</button><button class="v-btn ghost" type="button" id="pCancel">Annuler</button></div></div>';
  $('#pName').value=p?p.name:'';$('#pGroup').value=p?p.group:'longrich';$('#pCat').value=p?p.cat:'';$('#pPrice').value=p&&p.price?p.price:'';$('#pBadge').value=p?(p.badge||''):'';$('#pDesc').value=p?p.desc:'';
  function drawPhotos(){
    var box=$('#pPhotos');box.innerHTML=photos.map(function(s,k){return '<div class="photo"><img alt="Photo '+(k+1)+'"><button type="button" data-rm="'+k+'" aria-label="Retirer la photo '+(k+1)+'">×</button></div>'}).join('');
    $$('img',box).forEach(function(im,k){im.src=photos[k]});
  }
  drawPhotos();
  $('#pPhotos').onclick=function(e){var b=e.target.closest('[data-rm]');if(b){photos.splice(+b.dataset.rm,1);drawPhotos()}};
  $('#pFile').onchange=function(){
    var fs=Array.prototype.slice.call(this.files),inp=this;
    Promise.all(fs.map(function(f){return fileToJpeg(f,900,0.74)})).then(function(r){photos=photos.concat(r).slice(0,6);drawPhotos();inp.value=''}).catch(function(){toast('Photo illisible')});
  };
  $('#pCancel').onclick=function(){show('prod')};
  $('#pSave').onclick=function(){
    var name=$('#pName').value.trim(),price=parseInt($('#pPrice').value,10),er=$('#pErr');
    if(name.length<2){er.textContent='Écrivez le nom du produit.';er.hidden=false;return}
    var data={name:name,group:$('#pGroup').value,cat:$('#pCat').value.trim()||($('#pGroup').value==='informatique'?'Informatique':'Longrich'),price:price>0?price:null,badge:$('#pBadge').value,desc:$('#pDesc').value.trim(),photos:photos};
    var ok;
    if(p)ok=mutate(p.id,data);
    else{local.added.push(Object.assign({id:'c'+Date.now().toString(36)},data));ok=saveLocal()}
    if(ok){toast('✓ Produit enregistré');show('prod')}
  };
}

function vOrders(body){
  var orders=lsGet('ats_orders',[]);
  var h='<p class="v-note">Les clients envoient leur commande sur votre <strong>WhatsApp</strong> : c’est là que vous la recevez. Cette liste ne contient que les commandes préparées <strong>sur cet appareil</strong> (par exemple quand vous saisissez une commande pour un client).</p>';
  if(!orders.length)h+='<p class="sub">Aucune commande sur cet appareil.</p>';
  orders.forEach(function(o,idx){
    h+='<div class="ord" data-i="'+idx+'"><header><strong>'+esc(o.no)+'</strong><select class="in" style="width:auto;min-height:40px" data-st aria-label="Statut">'+Object.keys(STATUS).map(function(k){return '<option value="'+k+'"'+(o.status===k?' selected':'')+'>'+STATUS[k]+'</option>'}).join('')+'</select></header>'+
    '<div class="sub">'+new Date(o.date).toLocaleString('fr-FR')+'</div><div><strong>'+esc(o.name)+'</strong> · '+esc(o.phone)+'</div><div class="sub">'+esc(o.zone)+' — '+esc(o.addr)+' · '+esc(PAY[o.pay]||o.pay)+'</div>'+
    '<ul>'+o.items.map(function(i){return '<li>'+i.qty+' × '+esc(i.name)+'</li>'}).join('')+'</ul>'+(o.note?'<div class="sub">Remarque : '+esc(o.note)+'</div>':'')+
    '<div><strong>Total : '+fmt(o.total)+(o.fee>0?'':' + livraison')+'</strong></div>'+
    '<p style="margin-top:10px" class="v-row"><a class="v-btn" style="display:inline-flex;align-items:center;text-decoration:none" target="_blank" rel="noopener" href="'+esc(waLink('').replace(SHOP.whatsapp,String(o.phone).replace(/\D/g,'').replace(/^(?!224)/,'224'))+'?text='+encodeURIComponent('Bonjour '+o.name+', c’est '+SHOP.name+' au sujet de votre commande N° '+o.no+'.'))+'">💬 Écrire au client</a><button class="v-btn danger" data-del>Supprimer</button></p></div>';
  });
  body.innerHTML=h;
  body.onchange=function(e){var s=e.target.closest('[data-st]');if(!s)return;var i=+s.closest('.ord').dataset.i,os=lsGet('ats_orders',[]);if(os[i]){os[i].status=s.value;lsSet('ats_orders',os);toast('Statut mis à jour')}};
  body.onclick=function(e){var b=e.target.closest('[data-del]');if(!b)return;var i=+b.closest('.ord').dataset.i;if(confirm('Supprimer cette commande de la liste ?')){var os=lsGet('ats_orders',[]);os.splice(i,1);lsSet('ats_orders',os);vOrders(body)}};
}

function vSettings(body,show){
  body.onclick=null;body.onchange=null;
  var Z=zones().map(function(z){return {name:z.name,fee:z.fee}});
  function draw(){
    var h=dirtyBanner()+'<div class="v-card"><h3 style="margin-bottom:6px">Frais de livraison par commune</h3><p class="v-note">Mettez 0 si le prix est à confirmer avec le client.</p><div id="zr">'+Z.map(function(z,k){return '<div class="zone-row"><input class="in" data-n="'+k+'" aria-label="Commune"><input class="in" data-f="'+k+'" type="number" min="0" step="500" aria-label="Frais en FG"><button class="v-btn danger" type="button" data-x="'+k+'" aria-label="Retirer">×</button></div>'}).join('')+'</div><div class="v-row"><button class="v-btn ghost" type="button" id="zAdd">+ Ajouter une commune</button><button class="v-btn" type="button" id="zSave">Enregistrer</button></div></div>'+
    '<div class="v-card"><h3 style="margin-bottom:6px">Mot de passe vendeur</h3><p class="v-note">Il masque seulement l’espace vendeur. Il n’offre pas une vraie sécurité : ne l’utilisez pas ailleurs.</p><div id="wErr" class="err" role="alert" hidden></div><label class="f">Nouveau mot de passe<input class="in" id="np1" type="password" autocomplete="new-password"></label><label class="f">Répétez-le<input class="in" id="np2" type="password" autocomplete="new-password"></label><button class="v-btn" type="button" id="pwSave">Changer le mot de passe</button></div>';
    body.innerHTML=h;
    Z.forEach(function(z,k){$('[data-n="'+k+'"]',body).value=z.name;$('[data-f="'+k+'"]',body).value=z.fee});
    $('#zAdd',body).onclick=function(){grab();Z.push({name:'',fee:0});draw()};
    $('#zr',body).onclick=function(e){var b=e.target.closest('[data-x]');if(b){grab();Z.splice(+b.dataset.x,1);draw()}};
    $('#zSave',body).onclick=function(){grab();var ok=Z.filter(function(z){return z.name.trim()});if(!ok.length){toast('Gardez au moins une commune');return}local.zones=ok.map(function(z){return {name:z.name.trim(),fee:Math.max(0,parseInt(z.fee,10)||0)}});if(saveLocal()){toast('✓ Livraison enregistrée');vSettings(body,show)}};
    $('#pwSave',body).onclick=function(){var a=$('#np1').value,b=$('#np2').value,er=$('#wErr');if(a.length<4){er.textContent='Au moins 4 caractères.';er.hidden=false;return}if(a!==b){er.textContent='Les deux mots de passe sont différents.';er.hidden=false;return}local.pass=hash(a);if(saveLocal()){toast('✓ Mot de passe changé');vSettings(body,show)}};
  }
  function grab(){$$('[data-n]',body).forEach(function(i){Z[+i.dataset.n].name=i.value});$$('[data-f]',body).forEach(function(i){Z[+i.dataset.f].fee=i.value})}
  draw();
}

function vPublish(body){
  body.onclick=null;body.onchange=null;
  body.innerHTML=dirtyBanner()+'<div class="v-card"><h3 style="margin-bottom:8px">Mettre mes changements en ligne</h3><p class="v-note">Vos produits, prix, photos, communes et mot de passe sont enregistrés <strong>dans ce navigateur</strong>. Pour que vos clients les voient, il faut remplacer le fichier du site sur Netlify :</p><ol class="steps"><li>Touchez le bouton ci-dessous : un fichier <strong>index.html</strong> mis à jour est téléchargé.</li><li>Ouvrez Netlify, puis votre site, puis l’onglet <strong>Deploys</strong>.</li><li>Glissez le fichier <strong>index.html</strong> dans la zone de dépôt.</li></ol><div id="pbErr" class="err" role="alert" hidden></div><button class="v-btn" type="button" id="pubBtn">⬇️ Télécharger le site mis à jour</button></div>'+
  '<div class="v-card"><h3 style="margin-bottom:8px">Sauvegarde</h3><p class="v-note">Un fichier de secours de vos modifications locales (produits ajoutés, prix, communes).</p><div class="v-row"><button class="v-btn ghost" type="button" id="bkDown">Exporter</button><label class="v-btn ghost" style="display:inline-flex;align-items:center;cursor:pointer">Importer<input type="file" id="bkUp" accept="application/json,.json" hidden></label><button class="v-btn danger" type="button" id="resetBtn">Annuler mes modifications locales</button></div></div>';
  $('#pubBtn',body).onclick=function(){
    var er=$('#pbErr'),btn=this;er.hidden=true;btn.disabled=true;btn.textContent='Préparation…';
    var url=location.href.split('#')[0].split('?')[0];
    fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('http');return r.text()}).then(function(src){
      var cat={rev:Date.now(),zones:zones(),pass:local.pass||BASE.pass||null,products:allProducts()};
      var json=JSON.stringify(cat).replace(/</g,'\\u003c');
      var re=/(<script id="catalog" type="application\/json">)[\s\S]*?(<\/script>)/;
      if(!re.test(src))throw new Error('fmt');
      var out=src.replace(re,function(m,a,b){return a+json+b});
      var blob=new Blob([out],{type:'text/html'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='index.html';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
      toast('✓ index.html téléchargé');
    }).catch(function(){er.textContent='Impossible de préparer le fichier. Ouvrez le site depuis son adresse Netlify (https://…) et réessayez.';er.hidden=false}).then(function(){btn.disabled=false;btn.textContent='⬇️ Télécharger le site mis à jour'});
  };
  $('#bkDown',body).onclick=function(){var blob=new Blob([JSON.stringify(local)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ats-sauvegarde.json';document.body.appendChild(a);a.click();a.remove()};
  $('#bkUp',body).onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);if(!d||!Array.isArray(d.added)||typeof d.edits!=='object')throw 0;d.baseRev=BASE.rev;local=d;if(saveLocal()){toast('✓ Sauvegarde importée');vPublish(body)}}catch(e){toast('Fichier non valide')}};r.readAsText(f)};
  $('#resetBtn',body).onclick=function(){if(confirm('Effacer toutes les modifications faites sur cet appareil ?')){local={baseRev:BASE.rev,added:[],edits:{},zones:null,pass:null};saveLocal();vPublish(body)}};
}

/* ═════ Assistant ═════ */
(function(){
  var FAQ=[
    {k:['livraison','livrer','livrez','frais'],a:'Nous livrons partout à Conakry. Les frais dépendent de votre commune : ils s’affichent dans le panier quand vous la choisissez.'},
    {k:['paiement','payer','paye','orange','mtn','momo','cash','especes'],a:'Vous pouvez payer à la livraison, par Orange Money ou par MTN MoMo. Choisissez votre mode dans le panier.'},
    {k:['contact','telephone','numero','whatsapp','appeler','joindre'],a:'WhatsApp et appel : '+SHOP.phone+'. Écrivez-nous, nous répondons vite.'},
    {k:['commande','suivi','suivre','colis'],a:'Après avoir envoyé votre commande sur WhatsApp, retrouvez-la avec « Suivre ma commande ». Pour l’état réel de la livraison, écrivez-nous avec votre numéro de commande.'},
    {k:['adresse','boutique','magasin','localisation','situe'],a:'Nous sommes à Conakry. Écrivez-nous sur WhatsApp pour l’adresse précise.'},
    {k:['garantie','retour','echange','rembours'],a:'Pour une garantie, un échange ou un retour, parlez-en avec nous sur WhatsApp avant de commander.'}
  ];
  var btn=document.createElement('button');btn.type='button';btn.className='ast-fab';btn.setAttribute('aria-label','Ouvrir l’assistant');btn.textContent='💬 Aide';
  var st=document.createElement('style');st.textContent='.ast-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:90;min-height:52px;padding:0 20px;border-radius:999px;border:0;background:#fff;color:#0D0D0D;font-weight:700;font-size:1rem;box-shadow:0 8px 24px rgba(0,0,0,.5);cursor:pointer}.ast{position:fixed;right:12px;left:12px;bottom:calc(76px + env(safe-area-inset-bottom));max-width:380px;margin-left:auto;z-index:240;background:var(--dark2);border:1px solid rgba(201,168,76,.35);border-radius:16px;display:flex;flex-direction:column;max-height:70vh;box-shadow:0 18px 50px rgba(0,0,0,.6)}.ast header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line);font-weight:700;color:var(--gold)}.ast .log{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:140px}.ast .m{max-width:88%;padding:9px 12px;border-radius:12px;font-size:.92rem;white-space:pre-line}.ast .bot{background:var(--dark3);align-self:flex-start}.ast .me{background:var(--gold);color:#0D0D0D;align-self:flex-end}.ast .chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}.ast .chips button{border:1px solid rgba(255,255,255,.2);background:none;color:var(--white);border-radius:999px;padding:7px 12px;font-size:.82rem;cursor:pointer;min-height:36px}.ast form{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line)}.ast form input{flex:1;min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:var(--dark3);color:var(--white);padding:0 12px;font-size:1rem}.ast form button{min-height:44px;padding:0 16px;border:0;border-radius:10px;background:var(--gold);font-weight:700;cursor:pointer}.ast .pr{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px}.ast .pr button{min-height:36px;border:0;border-radius:8px;background:var(--gold);padding:0 10px;font-weight:700;cursor:pointer}';
  document.head.appendChild(st);document.body.appendChild(btn);
  var panel=null;
  function say(t,who,html){var l=$('.log',panel),d=document.createElement('div');d.className='m '+who;if(html)d.innerHTML=html;else d.textContent=t;l.appendChild(d);l.scrollTop=l.scrollHeight}
  function reply(q){
    var n=norm(q);
    if(/(soign|guer|maladie|traitement|enceinte|grossesse|medicament|posologie|dose)/.test(n)){say('Pour un avis santé, parlez à un professionnel de santé. Nous pouvons vous présenter les produits sur WhatsApp : '+SHOP.phone+'.','bot');return}
    var hit=FAQ.filter(function(f){return f.k.some(function(k){return n.indexOf(k)>=0})})[0];
    var toks=n.split(/[^a-z0-9]+/).filter(function(t){return t.length>2});
    var found=visibleProducts().map(function(p){var h=norm(p.name+' '+p.cat+' '+p.desc),s=0;toks.forEach(function(t){if(h.indexOf(t)>=0)s++});return {p:p,s:s}}).filter(function(x){return x.s>0}).sort(function(a,b){return b.s-a.s}).slice(0,3);
    if(found.length&&(!hit||/prix|combien|coute|acheter|avez/.test(n))){
      say('','bot','Voici ce que j’ai trouvé :'+found.map(function(x){return '<div class="pr"><span>'+esc(x.p.name)+'<br><strong>'+(x.p.price?fmt(x.p.price):'Sur demande')+'</strong></span>'+(x.p.price&&!x.p.soldout?'<button type="button" data-add="'+esc(x.p.id)+'">Ajouter</button>':'')+'</div>'}).join(''));return;
    }
    if(hit){say(hit.a,'bot');return}
    if(/prix|combien|coute/.test(n)){say('Dites-moi le nom du produit (ex. « prix laptop », « prix savon »).','bot');return}
    say('Je n’ai pas bien compris. Vous pouvez demander un produit, la livraison, le paiement, ou nous écrire sur WhatsApp : '+SHOP.phone+'.','bot');
  }
  btn.onclick=function(){
    if(panel){panel.remove();panel=null;return}
    panel=document.createElement('div');panel.className='ast';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Assistant');
    panel.innerHTML='<header>Assistant ATS<button class="x-btn" type="button" aria-label="Fermer" style="width:36px;height:36px;font-size:1.2rem">×</button></header><div class="log" aria-live="polite"></div><div class="chips"><button type="button">Livraison</button><button type="button">Paiement</button><button type="button">Contact</button><button type="button">Ma commande</button></div><form><input aria-label="Votre question" placeholder="Écrivez votre question…" autocomplete="off"><button type="submit">OK</button></form>';
    document.body.appendChild(panel);
    say('Bonjour 👋 Je peux vous aider à trouver un produit, expliquer la livraison ou le paiement.','bot');
    $('.x-btn',panel).onclick=function(){btn.onclick()};
    $('.chips',panel).onclick=function(e){var b=e.target.closest('button');if(b){say(b.textContent,'me');reply(b.textContent)}};
    $('form',panel).onsubmit=function(e){e.preventDefault();var i=$('input',panel),v=i.value.trim();if(!v)return;i.value='';say(v,'me');reply(v)};
    $('.log',panel).onclick=function(e){var b=e.target.closest('[data-add]');if(b)addToCart(b.dataset.add,1)};
    $('input',panel).focus();
  };
})();

/* ═════ Démarrage ═════ */
fillZones();renderCart();renderProducts();
try{var mf=new Blob([JSON.stringify({name:SHOP.name,short_name:'ATS',start_url:'.',display:'standalone',background_color:'#0D0D0D',theme_color:'#0D0D0D',lang:'fr'})],{type:'application/manifest+json'});var l=document.createElement('link');l.rel='manifest';l.href=URL.createObjectURL(mf);document.head.appendChild(l)}catch(e){}
})();
