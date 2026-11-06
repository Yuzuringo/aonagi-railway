(function(){'use strict';
window.RailNavigation={install({active,suspend}){
 let leaving=false,resume=null,href=null,opener=null;
 const dialog=document.createElement('dialog');dialog.className='leave-dialog';
 dialog.setAttribute('aria-labelledby','leave-title');dialog.setAttribute('aria-describedby','leave-description');
 dialog.innerHTML='<h2 id="leave-title">運行中の画面を離れますか？</h2><p id="leave-description">現在の勤務は終了し、運行状況と未保存の記録は失われます。<br>この画面を離れてもよろしいですか？</p><div class="leave-actions"><button type="button" class="leave-cancel" autofocus>運行に戻る</button><button type="button" class="leave-confirm">画面を離れる</button></div>';
 document.body.append(dialog);
 function cancel(){dialog.close();if(resume)resume();resume=null;href=null;opener?.focus();}
 dialog.querySelector('.leave-cancel').onclick=cancel;
 dialog.addEventListener('cancel',event=>{event.preventDefault();cancel();});
 dialog.querySelector('.leave-confirm').onclick=()=>{leaving=true;window.location.assign(href);};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.hasAttribute('download')||link.target&&link.target!=='_self')return;
  const url=new URL(link.href,location.href);
  if(!['http:','https:','file:'].includes(url.protocol)||url.href.split('#')[0]===location.href.split('#')[0]&&url.hash)return;
  if(!active()||leaving)return;
  event.preventDefault();if(dialog.open)return;
  href=url.href;opener=link;resume=suspend();dialog.showModal();
 },true);
 window.addEventListener('beforeunload',event=>{if(active()&&!leaving){event.preventDefault();event.returnValue='';}});
}};
})();
