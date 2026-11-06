(function(){'use strict';
const accepted=new WeakMap();
document.addEventListener('click',event=>{
 const button=event.target.closest?.('button.rotor');if(!button)return;
 const now=performance.now(),previous=accepted.get(button);
 if(previous!==undefined&&now-previous<220){event.preventDefault();event.stopImmediatePropagation();return;}
 accepted.set(button,now);
},true);
})();
